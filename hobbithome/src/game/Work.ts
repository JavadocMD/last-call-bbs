import { State } from "State";
import { Char } from "utils/Constants";
import { Building } from "./Building";
import * as GameMap from "./GameMap";

export type WorkType = keyof {
  Dig: null;
  Fill: null;
  Build: null;
  Demolish: null;
};

interface WorkBase {
  readonly type: WorkType;
  readonly position: GameMap.Cell;
  readonly time: number;
}

export interface Dig extends WorkBase {
  readonly type: "Dig";
}

export interface Fill extends WorkBase {
  readonly type: "Fill";
}

export interface Build extends WorkBase {
  readonly type: "Build";
  readonly building: Building;
}

export interface Demolish extends WorkBase {
  readonly type: "Demolish";
  readonly building: Building;
}

export type Work = Dig | Fill | Build | Demolish;

export function onComplete(state: State, work: Work): State {
  const { position } = work;
  switch (work.type) {
    case "Dig":
      state.mapUpdates.push({ position, symbol: Char.Floor });
      return state;
    case "Fill":
      state.mapUpdates.push({ position, symbol: Char.Wall });
      return state;
    case "Build":
      const bs0 = [...state.buildings, work.building];
      return { ...state, buildings: bs0 };
    case "Demolish":
      const bs1 = state.buildings.filter((x) => x !== work.building);
      return { ...state, buildings: bs1 };
  }
}

export function dig(position: GameMap.Cell): Dig {
  return {
    type: "Dig",
    position,
    time: 10,
  };
}

export function fill(position: GameMap.Cell): Fill {
  return {
    type: "Fill",
    position,
    time: 10,
  };
}

export function build(position: GameMap.Cell, building: Building): Build {
  return {
    type: "Build",
    position,
    building,
    time: 10,
  };
}

export function demolish(position: GameMap.Cell, building: Building): Demolish {
  return {
    type: "Demolish",
    position,
    building,
    time: 10,
  };
}
