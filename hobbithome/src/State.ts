import { Clock, defaultClock } from "Clock";
import { Cursor, defaultCursor } from "Cursor";
import { Action, IdleAction } from "game/Action";
import { Building } from "game/Building";
import { Cell, defaultMap, GameMap, MapUpdate } from "game/GameMap";
import { Hobbit, instance as newHobbit } from "game/Hobbit";
import { defaultWorkQueue, WorkQueue } from "game/WorkQueue";

// Global State

export interface State {
  // non-persisted
  readonly scene: Scene;
  readonly menu: Menu;
  readonly menuLeft: boolean;
  readonly selectedHobbit: number | null;
  readonly cursor: Cursor;
  readonly actions: Array<Action>;
  /** MUTABLE: Accumulate map updates during the frame and apply at the end. */
  readonly mapUpdates: Array<MapUpdate>;
  // persisted as-is
  readonly clock: Clock;
  readonly map: GameMap;
  readonly hobbits: Array<Hobbit>;
  readonly buildings: Array<Building>;
  readonly workQueue: WorkQueue;
}

const defaultHobbits = [
  newHobbit("Gundabald", "Gundabald Bolger", new Cell(18, 18)),
  newHobbit("Frogo", "Frogo Hornfoot", new Cell(26, 16)),
  newHobbit("Stumpy", "Stumpy", new Cell(36, 17)),
  newHobbit("Hamwise", "Hamwise Prouse", new Cell(30, 17)),
  newHobbit("Mordo", "Mordo Glugbottle", new Cell(20, 19)),
];

export const state = {
  initial(initialScene: Scene): State {
    const actions: Array<Action> = defaultHobbits.map(
      (x, i) => new IdleAction(i)
    );
    return {
      scene: initialScene,
      menu: initialScene.defaultMenu,
      selectedHobbit: null,
      cursor: defaultCursor,
      actions,
      mapUpdates: new Array(),
      map: defaultMap(),
      workQueue: defaultWorkQueue,
      menuLeft: true,
      clock: defaultClock,
      hobbits: defaultHobbits,
      buildings: [],
    };
  },
  load(initialScene: Scene): State {
    let data = loadData();
    if (data === "") {
      return state.initial(initialScene);
    } else {
      // TODO: rehydrate state from save data
      throw new Error("load: not implemented");
      // const data = JSON.parse(data) as State;
      // return {
      //   ...data,
      //   scene: initialScene,
      //   menu: initialScene.defaultMenu,
      // };
    }
  },
  saveState(state: State): void {
    // TODO: implement saving.
    // Be careful about which things are serializable and which aren't.
    // We probably need to scoop in-progress WorkActions and put the work
    // back into the work queue.
    // saveData(JSON.stringify(state));
  },
} as const;

// Scene and Menu State

export type Result = State | null;

export abstract class Scene {
  public abstract readonly defaultMenu: Menu;
  abstract onUpdate(state: State): State;
  abstract onRender(state: State): void;
}

export interface Menu {
  onRender(state: State): void;
  onInput(state: State, key: number): Result;
  onEnter(state: State): State;
  onExit(state: State): State;
}
