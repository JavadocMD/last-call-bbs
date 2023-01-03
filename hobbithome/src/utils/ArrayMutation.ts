export function insert<T>(xs: Array<T>, i: number, x: T): void {
  xs.splice(i, 0, x);
}

export function remove<T>(xs: Array<T>, i: number): void {
  xs.splice(i, 1);
}

export function removeItem<T>(xs: Array<T>, item: T): void {
  let i = xs.indexOf(item);
  if (i >= 0) {
    xs.splice(i, 1);
  }
}

export function removeMaxBy<T>(
  xs: Array<T>,
  scoreFn: (x: T) => number
): T | null {
  if (xs.length === 0) {
    return null;
  }
  let bestIndex = 0;
  let bestItem = xs[bestIndex];
  let bestScore = scoreFn(bestItem);
  for (let i = 1; i < xs.length; i++) {
    const curr = xs[i];
    const score = scoreFn(curr);
    if (score > bestScore) {
      bestIndex = i;
      bestItem = curr;
      bestScore = score;
    }
  }
  remove(xs, bestIndex);
  return bestItem;
}

export function removeAll<T>(xs: Array<T>, items: Array<T>): void {
  items.forEach((x) => removeItem(xs, x));
}
