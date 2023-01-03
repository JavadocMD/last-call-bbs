import { constrainX, constrainY } from "game/GameMap";
import * as Painter from "Painter";
import { Result, State } from "State";
import { Color, Key } from "utils/Constants";
import { Vector } from "utils/index";

export interface Cursor {
  readonly on: boolean;
  readonly size: Vector;
  readonly position: Vector;
}

export const defaultCursor: Cursor = {
  on: false,
  size: [1, 1],
  position: [10, 10],
};

export function enableCursor(state: State, size: Vector): State {
  const { position } = state.cursor;
  return {
    ...state,
    cursor: { on: true, size, position },
  };
}

export function disableCursor(state: State): State {
  const { position, size } = state.cursor;
  return {
    ...state,
    cursor: { on: false, size, position },
  };
}

export function moveCursor(state: State, position: Vector): State {
  return { ...state, cursor: { ...state.cursor, position } };
}

export function onInput(state: State, key: number): Result {
  const { cursor } = state;
  if (cursor.on) {
    const [x, y] = cursor.position;
    if (key === Key.LEFT) {
      return moveCursor(state, [constrainX(x - 1), y]);
    } else if (key === Key.RIGHT) {
      return moveCursor(state, [constrainX(x + 1), y]);
    } else if (key === Key.UP) {
      return moveCursor(state, [x, constrainY(y - 1)]);
    } else if (key === Key.DOWN) {
      return moveCursor(state, [x, constrainY(y + 1)]);
    }
  }
  return null;
}

export function onRender({ clock, cursor }: State): void {
  if (cursor.on) {
    const color = clock.anim ? Color.WHITE : Color.GROUND;
    Painter.drawCursor(cursor, color);
  }
}
