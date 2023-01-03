import * as Cursor from "Cursor";
import * as Debug from "Debug";
import { State, state as stateFn } from "State";
import TitleScene from "TitleScene";
import GameScene from "game/GameScene";

var state: State = undefined!;

export function getName(): string {
  return "Hobbit Home TS";
}

export function onConnect(): void {
  // TODO: set back to title scene
  // state = stateFn.load(TitleScene);
  state = stateFn.load(GameScene);
}

export function onUpdate(): void {
  state = state.scene.onUpdate(state);
  clearScreen();
  state.scene.onRender(state);
  state.menu.onRender(state);
  Cursor.onRender(state);
  Debug.draw();
}

export function onInput(key: number): void {
  // Input handling priority:
  state =
    // Cursor
    Cursor.onInput(state, key) ||
    // Current Menu
    state.menu.onInput(state, key) ||
    // If unhandled, state is unchanged
    state;
}
