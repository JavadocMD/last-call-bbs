import { State } from "State";
import { ArrayMutation, Arrays, orElse } from "utils/index";
import { Action, getIdleHobbits, IdleAction, WorkAction } from "./Action";
import { Hobbit } from "./Hobbit";
import { Work } from "./Work";
import { InProgress, start } from "./WorkQueue";

/** Assign idle hobbits pending work from the queue. */
export function assign(state: State): State {
  const idle = getIdleHobbits(state);
  if (Arrays.empty(idle)) {
    return state;
  }

  const [unclaimed, pending] = Arrays.split(
    state.workQueue.pending,
    idle.length
  );

  const [actions, started] = assignPriority(state, unclaimed, idle);
  const workQueue = start(state.workQueue, started, pending);
  return { ...state, actions, workQueue };
}

/** As long as we have jobs and hobbits to do them, give each job to the nearest hobbit. */
function assignPriority(
  state: State,
  unclaimed: Array<Work>,
  idle: Array<Hobbit>
): [Array<Action>, Array<InProgress>] {
  let actions = [...state.actions];
  let started = new Array<InProgress>();
  while (Arrays.notEmpty(unclaimed) && Arrays.notEmpty(idle)) {
    const w = unclaimed.shift()!;
    const h = ArrayMutation.removeMaxBy(
      idle,
      (hobbit) => -w.position.distanceTo(hobbit.position)
    )!;
    const i = state.hobbits.indexOf(h);
    actions[i] = new WorkAction(i, w);
    started.push({ workerIndex: i, work: w });
  }
  return [actions, started];
}

// If pending, remove it from queue.
function removePending(s: State, w: Work): State | null {
  const q = s.workQueue;
  const pending = Arrays.removeOption(q.pending, w);
  return pending ? { ...s, workQueue: { ...q, pending } } : null;
}

// If held, remove it from queue.
function removeHeld(s: State, w: Work): State | null {
  const q = s.workQueue;
  const held = Arrays.removeOption(q.held, w);
  return held ? { ...s, workQueue: { ...q, held } } : null;
}

// If in progress, remove it and replace the worker's action with idle.
function removeInProgress(s: State, w: Work): State | null {
  const q = s.workQueue;
  const i = Arrays.indexOf(q.inProgress, ({ work }) => work === w);
  if (i < 0) {
    return null;
  } else {
    const { workerIndex: worker } = q.inProgress[i];
    const inProgress = Arrays.removeIndex(q.inProgress, i);
    const workQueue = { ...q, inProgress };
    const actions = Arrays.update(s.actions, worker, new IdleAction(worker));
    return { ...s, actions, workQueue };
  }
}

/** Cancel a work item by evicting it from the work queue, and, if it's currently in progress, canceling the work action. */
export function remove(state: State, work: Work): State {
  return orElse<State>(
    (s) => removePending(s, work),
    (s) => removeHeld(s, work),
    (s) => removeInProgress(s, work)
  )(state);
}
