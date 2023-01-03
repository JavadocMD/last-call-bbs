import { Box, Lib, Vector } from "utils/index";
import { Cell } from "./GameMap";

export type BuildingType = keyof {
  Pantry: null;
  Bedroom: null;
  DiningRoom: null;
  Farm: null;
  Kitchen: null;
  Tavern: null;
  Workshop: null;
};

export interface BuildingDef {
  readonly type: BuildingType;
  readonly name: string;
  readonly size: Vector;
  readonly icon: string;
}

export interface Building extends BuildingDef {
  readonly box: Box;
}

export const def: Lib<BuildingType, BuildingDef> = {
  Pantry: {
    type: "Pantry",
    name: "Pantry",
    size: [3, 4],
    icon: "p",
  },
  Bedroom: {
    type: "Bedroom",
    name: "Bedroom",
    size: [3, 3],
    icon: "B",
  },
  DiningRoom: {
    type: "DiningRoom",
    name: "Dining Room",
    size: [4, 4],
    icon: "D",
  },
  Farm: {
    type: "Farm",
    name: "Farm",
    size: [3, 3],
    icon: "f",
  },
  Kitchen: {
    type: "Kitchen",
    name: "Kitchen",
    size: [3, 3],
    icon: "k",
  },
  Tavern: {
    type: "Tavern",
    name: "Tavern",
    size: [3, 3],
    icon: "t",
  },
  Workshop: {
    type: "Workshop",
    name: "Workshop",
    size: [3, 3],
    icon: "W",
  },
};

export const defValues: Array<BuildingDef> = [
  def.Pantry,
  def.Bedroom,
  def.DiningRoom,
  def.Farm,
  def.Kitchen,
  def.Tavern,
  def.Workshop,
];

export function create(def: BuildingDef, cell: Cell): Building {
  const box = new Box([cell.x, cell.y], def.size);
  return { ...def, box };
}
