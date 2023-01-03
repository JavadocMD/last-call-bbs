import { randomInt } from "./Funcs";
import { Predicate } from "./Types";

export function empty<T>(xs: Array<T>): boolean {
  return xs.length === 0;
}

export function notEmpty<T>(xs: Array<T>): boolean {
  return xs.length > 0;
}

export function get<T>(xs: Array<T>, index: number): T | null {
  if (index >= 0 && index < xs.length) {
    return xs[index];
  } else {
    return null;
  }
}

export function random<T>(xs: Array<T>): T | null {
  return xs.length > 0 ? xs[randomInt(xs.length)] : null;
}

export function mapFirstNotNull<X, Y>(
  xs: Array<X>,
  mapFn: (x: X) => Y | null
): Y | null {
  for (let i = 0; i < xs.length; i++) {
    const y = mapFn(xs[i]);
    if (y !== null) {
      return y;
    }
  }
  return null;
}

export function find<T>(xs: Array<T>, predicate: Predicate<T>): T | null {
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    if (predicate(x) === true) {
      return x;
    }
  }
  return null;
}

export function indexOf<T>(xs: Array<T>, predicate: Predicate<T>): number {
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    if (predicate(x) === true) {
      return i;
    }
  }
  return -1;
}

export function includes<T>(xs: Array<T>, item: T): boolean {
  return indexOf(xs, (x) => x === item) >= 0;
}

export function maxBy<T>(xs: Array<T>, scoreFn: (x: T) => number): T | null {
  if (xs.length === 0) {
    return null;
  }
  let bestItem = xs[0];
  let bestScore = scoreFn(bestItem);
  for (let i = 1; i < xs.length; i++) {
    const curr = xs[i];
    const score = scoreFn(curr);
    if (score > bestScore) {
      bestItem = curr;
      bestScore = score;
    }
  }
  return bestItem;
}

export function split<T>(xs: Array<T>, index: number): [Array<T>, Array<T>] {
  return [xs.slice(0, index), xs.slice(index)];
}

export function update<T>(xs: Array<T>, index: number, newItem: T): Array<T> {
  return [...xs.slice(0, index), newItem, ...xs.slice(index + 1)];
}

export function removeIndex<T>(xs: Array<T>, index: number): Array<T> {
  return [...xs.slice(0, index), ...xs.slice(index + 1)];
}

export function removeOption<T>(xs: Array<T>, x: T): Array<T> | null {
  const i = xs.indexOf(x);
  return i < 0 ? null : [...xs.slice(0, i), ...xs.slice(i + 1)];
}
