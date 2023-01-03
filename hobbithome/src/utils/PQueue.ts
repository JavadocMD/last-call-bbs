import * as ArrayMutation from "./ArrayMutation";

type Entry<T> = [T, number];

export class PQueue<T> {
  private queue = Array<Entry<T>>();

  nonEmpty(): boolean {
    return this.queue.length > 0;
  }

  dequeue(): T | null {
    const first = this.queue.shift();
    return first ? first[0] : null;
  }

  enqueue(element: T, priority: number): void {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i][1] > priority) {
        ArrayMutation.insert(this.queue, i, [element, priority]);
        return;
      }
    }
    this.queue.push([element, priority]);
  }
}
