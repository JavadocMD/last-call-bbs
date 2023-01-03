import { Arrays, constrain } from "utils/index";
import { Cell } from "./GameMap";

export interface Hobbit {
  readonly name: string;
  readonly fullName: string;
  readonly position: Cell;
  readonly mood: Mood;
  readonly hunger: Hunger;
  readonly thoughts: string;
}

const idleThoughts = [
  "Nothin' particular.",
  "Lovely day, innit?",
  "Oi.",
  "What's goin' on 'ere then?",
  "Nice weather.",
];

export function randomThought() {
  return Arrays.random(idleThoughts)!;
}

export function instance(
  shortName: string,
  fullName: string,
  position: Cell
): Hobbit {
  return {
    name: shortName,
    fullName: fullName,
    position,
    mood: mood.min,
    hunger: hunger.max,
    thoughts: randomThought(),
  };
}

type Mood = number;

export const mood = {
  min: 0,
  max: 6, // non-inclusive
  constrain(value: number): Mood {
    return constrain(mood.min, value, mood.max);
  },
  toString(mood: Mood): string {
    switch (mood) {
      case 0:
        return "Grumpy";
      case 1:
        return "Sad";
      case 2:
        return "Glum";
      case 3:
        return "Content";
      case 4:
        return "Happy";
      case 5:
        return "Joyful";
      default:
        return "???";
    }
  },
} as const;

type Hunger = number;

export const hunger = {
  min: 0,
  max: 11, // non-inclusive
  constrain(value: number): Hunger {
    return constrain(hunger.min, value, hunger.max);
  },
  toString(hunger: Hunger): string {
    switch (hunger) {
      case 0:
      case 1:
        return "Full";
      case 2:
      case 3:
        return "Peckish";
      case 4:
      case 5:
      case 6:
      case 7:
        return "Hungry";
      case 8:
      case 9:
      case 10:
        return "Starving";
      default:
        return "???";
    }
  },
};
