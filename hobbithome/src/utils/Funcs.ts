import { Transform, TransformPartial } from "./Types";

/** The identity function. */
export function identity<T>(x: T): T {
  return x;
}

/** Random integer in the range [0, max) */
export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Constrains `value` to be in the range [min, max).
 * If the value is outside the range, it returns the closest
 * value that is within the range.
 */
export function constrain(min: number, value: number, max: number) {
  if (value < min) {
    return min;
  } else if (value >= max) {
    return max - 1;
  } else {
    return value;
  }
}

export function isDefined<T>(x: T | undefined | null): x is T {
  return typeof x !== "undefined" && x !== null;
}

export function pipe<T>(...fs: Array<Transform<T>>): Transform<T> {
  return (initial) => fs.reduce((t, f) => f(t), initial);
}

export function orElse<T>(...fs: Array<(t: T) => T | null>): Transform<T> {
  return (initial) => {
    const result = fs.reduce(
      (t, f) => (t === null ? f(initial) : t),
      null as T | null
    );
    return result || initial;
  };
}

export function pipeUpdate<T>(...fs: Array<TransformPartial<T>>): Transform<T> {
  return (initial) =>
    fs.reduce((prev, f) => {
      const update = f(prev);
      return { ...prev, ...update };
    }, initial);
}
