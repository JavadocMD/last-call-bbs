export const Char = {
  Wall: "█",
  Floor: " ",
  Hobbit: "☻",
  HobbitSelected: "☺",
  Demolish: "!",
} as const;

export type MapSymbol = keyof {
  [Char.Wall]: null;
  [Char.Floor]: null;
};

export const Color = {
  BLACK: 0,
  FILL: 2,
  DIG: 6,
  GROUND: 8,
  BUILDING_GHOST: 1,
  BUILDING: 6,
  TEXT: 13,
  WHITE: 17,
} as const;

export const Key = {
  ESCAPE: 27,
  SPACE: 32,
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 10,
  UP: 17,
  DOWN: 18,
  LEFT: 19,
  RIGHT: 20,
  BACKTICK: 96,
  NUM_0: 48,
  NUM_1: 49,
  NUM_2: 50,
  NUM_3: 51,
  NUM_4: 52,
  NUM_5: 53,
  NUM_6: 54,
  NUM_7: 55,
  NUM_8: 56,
  NUM_9: 57,
  isNumber(key: number): boolean {
    return key >= Key.NUM_0 && key <= Key.NUM_9;
  },
  toNumber(key: number): number {
    return key - Key.NUM_0;
  },
} as const;
