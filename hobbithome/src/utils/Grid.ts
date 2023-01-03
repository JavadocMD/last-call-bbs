export type Vector = readonly [number, number];

export const v1x1: Vector = [1, 1];

export class Box {
  constructor(readonly center: Vector, readonly size: Vector) {}

  readonly topLeft: Vector = [
    this.center[0] - Math.floor(this.size[0] / 2),
    this.center[1] - Math.floor(this.size[1] / 2),
  ];

  readonly bottomRight: Vector = [
    this.center[0] + Math.ceil(this.size[0] / 2) - 1,
    this.center[1] + Math.ceil(this.size[1] / 2) - 1,
  ];

  overlaps(that: Box): boolean {
    // for each axis: `this` range is [a0,a1] and `that` range is [b0,b1]
    // if overlap, a0 <= b1 && b0 <= a1
    return (
      this.topLeft[0] <= that.bottomRight[0] &&
      that.topLeft[0] <= this.bottomRight[0] &&
      this.topLeft[1] <= that.bottomRight[1] &&
      that.topLeft[1] <= this.bottomRight[1]
    );
  }

  inside(that: Box): boolean {
    // both of `this` corners have to be entirely inside `that`
    return (
      this.topLeft[0] >= that.topLeft[0] &&
      this.bottomRight[0] <= that.bottomRight[0] &&
      this.topLeft[1] >= that.topLeft[1] &&
      this.bottomRight[1] <= that.bottomRight[1]
    );
  }
}
