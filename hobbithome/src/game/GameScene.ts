import { tick } from "Clock";
import * as Painter from "Painter";
import { Scene, State } from "State";
import { pipe } from "utils/index";
import { Action, IdleAction } from "./Action";
import * as GameMap from "./GameMap";
import * as GameMenu from "./GameMenu";
import { Hobbit } from "./Hobbit";
import { onComplete, Work } from "./Work";
import * as WorkQueue from "./WorkQueue";
import * as WorkUtils from "./WorkUtils";

class GameScene extends Scene {
  public readonly defaultMenu = GameMenu.Default;

  onUpdate(s: State): State {
    return processUpdate(s);
  }

  onRender(s: State): void {
    Painter.drawMap(s);
    Painter.drawBuildings(s);
    Painter.drawWork(s);
    Painter.drawHobbits(s);
  }
}

const instance = new GameScene();

export default instance;

// Update logic

const processUpdate = pipe(
  retryWork, //
  assignWork, //
  performActions, //
  tickTock, //
  updateMap //
);

/** Periodically release an on-hold job. */
function retryWork(state: State): State {
  if (state.clock.time % 10 !== 0) {
    return state;
  } else {
    const workQueue = WorkQueue.retry(state.workQueue);
    return { ...state, workQueue };
  }
}

/** Assign work to idle hobbits. */
function assignWork(state: State): State {
  if (state.clock.frame % 15 !== 0) {
    return state;
  } else {
    return WorkUtils.assign(state);
  }
}

/** Perform actions. */
function performActions(state: State): State {
  if (state.clock.frame % 15 !== 0) {
    return state;
  } else {
    const hobbits = new Array<Hobbit>();
    const actions = new Array<Action>();
    const canceledWork = new Array<Work>();
    const completedWork = new Array<Work>();
    for (let i = 0; i < state.actions.length; i++) {
      const action = state.actions[i];
      const { type, hobbit, work } = action.apply(state);
      hobbits.push(hobbit);
      switch (type) {
        case "Continue":
          actions.push(action);
          break;
        case "Cancel":
          actions.push(new IdleAction(i));
          if (work) {
            canceledWork.push(work);
          }
          break;
        case "Complete":
          actions.push(new IdleAction(i));
          if (work) {
            completedWork.push(work);
          }
          break;
      }
    }

    // Assemble state for action results.
    let nextState = {
      ...state,
      hobbits,
      actions,
      workQueue: WorkQueue.update(state.workQueue, completedWork, canceledWork),
    };

    // Apply completed work.
    completedWork.forEach((work) => {
      nextState = onComplete(nextState, work);
    });

    return nextState;
  }
}

/** Advance the game clock. */
function tickTock(state: State): State {
  return { ...state, clock: tick(state.clock) };
}

/** Apply map updates. NON-FUNCTIONAL. */
function updateMap(state: State): State {
  GameMap.mutateMap(state);
  return state;
}
