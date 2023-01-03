import { State } from "State";
import { checkWorkConditions } from "StateQuery";
import { Arrays, Mutable, randomInt } from "utils/index";
import * as GameMap from "./GameMap";
import { Hobbit, randomThought } from "./Hobbit";
import { Work } from "./Work";

interface ActionResult {
  readonly type: "Continue" | "Complete" | "Cancel";
  readonly hobbit: Hobbit;
  readonly work?: Work;
}

abstract class ActionBase {
  public abstract readonly actorIndex: number;
  public abstract readonly work?: Work;

  public abstract apply(state: State): ActionResult;

  protected resultOf(
    state: State,
    type: ActionResult["type"],
    updateHobbit?: Hobbit
  ): ActionResult {
    return {
      type,
      hobbit: updateHobbit || this.getActor(state),
      work: this.work,
    };
  }

  protected getActor(state: State): Hobbit {
    return state.hobbits[this.actorIndex];
  }

  protected mutableActor(state: State): Mutable<Hobbit> {
    return { ...this.getActor(state) };
  }
}

export type Action =
  | IdleAction
  | WalkAction
  | GoToAction
  | GoToAdjacentAction
  | WorkAction;

/** Returns a list of hobbits currently doing the IdleAction. */
export function getIdleHobbits({ actions, hobbits }: State): Array<Hobbit> {
  let results = new Array<Hobbit>();
  for (let i = 0; i < actions.length; i++) {
    if (actions[i] instanceof IdleAction) {
      results.push(hobbits[i]);
    }
  }
  return results;
}

export class IdleAction extends ActionBase {
  public readonly actorIndex: number;
  public readonly work = undefined;

  constructor(actorIndex: number) {
    super();
    this.actorIndex = actorIndex;
  }

  private first = true;

  apply(s: State): ActionResult {
    const hobbit = this.mutableActor(s);
    if (this.first) {
      hobbit.thoughts = randomThought();
      this.first = false;
    }
    const behavior = randomInt(7);
    if (behavior === 0) {
      // Wander
      const ns = GameMap.walkableNeighbors(s.map, hobbit.position);
      if (Arrays.notEmpty(ns)) {
        hobbit.position = Arrays.random(ns)!;
      }
      return this.resultOf(s, "Continue", hobbit);
    } else {
      // Check self-status
      // if hungry, go eat
      // if joyful, play music
      // if tired, go sleep
      return this.resultOf(s, "Continue", hobbit);
    }
  }
}

export class WalkAction extends ActionBase {
  public readonly actorIndex: number;
  public readonly work = undefined;

  constructor(actorIndex: number, path: GameMap.Path) {
    super();
    this.actorIndex = actorIndex;
    this.path = path;
  }

  private path: GameMap.Path;

  apply(s: State): ActionResult {
    // Done?
    if (Arrays.empty(this.path)) {
      return this.resultOf(s, "Complete");
    } else {
      // Walk.
      const next = this.path.shift()!;
      if (GameMap.isWalkable(s.map, next)) {
        // Step.
        const hobbit = this.mutableActor(s);
        hobbit.position = next;
        return this.resultOf(s, "Continue", hobbit);
      } else {
        // Blocked!
        return this.resultOf(s, "Cancel");
      }
    }
  }
}

// Walk to the indicated space if navigable.
export class GoToAction extends ActionBase {
  public readonly actorIndex: number;
  public readonly work = undefined;

  constructor(actorIndex: number, destination: GameMap.Cell) {
    super();
    this.actorIndex = actorIndex;
    this.destination = destination;
  }

  private readonly destination: GameMap.Cell;
  private walk: Action | null = null;

  apply(s: State): ActionResult {
    if (this.walk === null) {
      // Pathfind.
      const { position } = this.getActor(s);
      const path = GameMap.astar(s.map, position, this.destination);
      if (path === null) {
        return this.resultOf(s, "Cancel");
      } else {
        this.walk = new WalkAction(this.actorIndex, path);
        // drop through...
      }
    }

    // Defer to Walk action.
    const result = this.walk.apply(s);
    if (result.type === "Cancel") {
      // Re-navigate next tick.
      this.walk = null;
      return { ...result, type: "Continue" };
    } else {
      return result;
    }
  }
}

// Find the first navigable adjacent space and walk there.
export class GoToAdjacentAction extends ActionBase {
  public readonly actorIndex: number;
  public readonly work = undefined;

  constructor(actorIndex: number, destination: GameMap.Cell) {
    super();
    this.actorIndex = actorIndex;
    this.destination = destination;
  }

  private readonly destination: GameMap.Cell;
  private walk: Action | null = null;

  apply(s: State): ActionResult {
    if (this.walk === null) {
      // Pathfind.
      const { position } = this.getActor(s);
      const path = Arrays.mapFirstNotNull(
        GameMap.walkableNeighbors(s.map, this.destination),
        (x) => GameMap.astar(s.map, position, x)
      );
      if (path === null) {
        return this.resultOf(s, "Cancel");
      } else {
        this.walk = new WalkAction(this.actorIndex, path);
        // drop through...
      }
    }

    // Defer to Walk action.
    const result = this.walk.apply(s);
    if (result.type === "Cancel") {
      // Re-navigate next tick.
      this.walk = null;
      return { ...result, type: "Continue" };
    } else {
      return result;
    }
  }
}

export class WorkAction extends ActionBase {
  public readonly actorIndex: number;
  public readonly work: Work;
  private go: Action | null;
  private timer: number;
  private timeout: number;

  constructor(actorIndex: number, work: Work) {
    super();
    this.actorIndex = actorIndex;
    this.work = work;
    this.go = new GoToAdjacentAction(this.actorIndex, this.work.position);
    this.timer = this.work.time;
    this.timeout = 30;
  }

  apply(s: State): ActionResult {
    const condition = checkWorkConditions(s, this.work);
    if (condition === "Cancel") {
      return this.resultOf(s, "Cancel");
    }

    // Defer to goto action.
    // (Which we can do even if work condition is "Wait".)
    if (this.go !== null) {
      const result = this.go.apply(s);
      switch (result.type) {
        case "Complete":
          this.go = null;
          return { ...result, type: "Continue" };
        case "Continue":
        case "Cancel":
          return result;
      }
    }

    // Do the work.
    if (this.timeout <= 0) {
      return this.resultOf(s, "Cancel");
    } else if (condition === "Wait") {
      this.timeout -= 1;
      return this.resultOf(s, "Continue");
    } else if (this.timer > 0) {
      this.timer -= 1;
      return this.resultOf(s, "Continue");
    } else {
      return this.resultOf(s, "Complete");
    }
  }
}
