export interface Clock {
  /** seconds clock: [0,65536) */
  readonly time: number;
  /** frame clock: [0,30) */
  readonly frame: number;
  /** animation clock: [0,1] */
  readonly anim: number;
}

export const defaultClock: Clock = { time: 0, frame: 0, anim: 0 };

export function tick(prev: Clock): Clock {
  const frame = (prev.frame + 1) % 30;
  const anim = Math.floor(prev.frame / 15);
  const time = frame === 0 ? (prev.time + 1) % 65536 : prev.time;
  return { time, frame, anim };
}
