import { Arrays, Predicate } from "utils/index";
import { Work } from "./Work";
import * as Debug from "../Debug";

export interface InProgress {
  readonly workerIndex: number;
  readonly work: Work;
}

export interface WorkQueue {
  readonly pending: Array<Work>;
  readonly held: Array<Work>;
  readonly inProgress: Array<InProgress>;
}

export const defaultWorkQueue: WorkQueue = {
  pending: new Array<Work>(),
  held: new Array<Work>(),
  inProgress: new Array<InProgress>(),
};

export function find(q: WorkQueue, predicate: Predicate<Work>): Work | null {
  const res0 = Arrays.find(q.pending, predicate);
  if (res0) {
    return res0;
  }
  const res1 = Arrays.find(q.held, predicate);
  if (res1) {
    return res1;
  }
  const res2 = Arrays.find(q.inProgress, ({ work }) => predicate(work));
  if (res2) {
    return res2.work;
  }
  return null;
}

export function add(q: WorkQueue, work: Work): WorkQueue {
  const pending = [...q.pending, work];
  return { ...q, pending };
}

/** Start work items. */
export function start(
  q: WorkQueue,
  started: Array<InProgress>,
  pending: Array<Work>
): WorkQueue {
  const inProgress = [...q.inProgress, ...started];
  return { ...q, pending, inProgress };
}

/** Complete/cancel work items. */
export function update(
  q: WorkQueue,
  complete: Array<Work>,
  hold: Array<Work>
): WorkQueue {
  const inProgress = q.inProgress.filter(
    (x) => !Arrays.includes(complete, x.work)
  );
  const held = [...q.held, ...hold];
  return { ...q, held, inProgress };
}

export function retry(q: WorkQueue): WorkQueue {
  if (Arrays.notEmpty(q.held)) {
    const [work, ...held] = q.held;
    const pending = [...q.pending, work];
    return { ...q, pending, held };
  } else {
    return q;
  }
}

export function forEach(q: WorkQueue, f: (work: Work) => void): void {
  q.pending.forEach(f);
  q.held.forEach(f);
  q.inProgress.forEach(({ work }) => f(work));
}
