import { Building, BuildingType } from "game/Building";
import * as GameMap from "game/GameMap";
import { Hobbit } from "game/Hobbit";
import { Build, Work } from "game/Work";
import * as WorkQueue from "game/WorkQueue";
import { State } from "State";
import { Char } from "utils/Constants";
import { Arrays, Box } from "utils/index";

export function getHobbit(index: number): (state: State) => Hobbit {
  return (s) => s.hobbits[index];
}

export function isOccupied(
  { hobbits }: State,
  position: GameMap.Cell
): boolean {
  return hobbits.some((h) => position.equals(h.position));
}

export function getBuildingAt(
  state: State,
  position: GameMap.Cell
): Building | null;
export function getBuildingAt(state: State, box: Box): Building | null;
export function getBuildingAt(
  { buildings }: State,
  pOrB: GameMap.Cell | Box
): Building | null {
  const testBox = pOrB instanceof Box ? pOrB : pOrB.toBox();
  return Arrays.find(buildings, (x) => testBox.overlaps(x.box));
}

export function getBuildingOfType(
  { buildings }: State,
  type: BuildingType
): Building | null {
  return Arrays.find(buildings, (x) => x.type === type);
}

export function getWorkAt(
  { workQueue }: State,
  position: GameMap.Cell
): Work | null {
  const positionBox = position.toBox();
  return WorkQueue.find(workQueue, (x) => {
    return (
      // Either this is the exact same position...
      x.position.equals(position) ||
      // Or we overlap with a Build or Demolish order.
      ((x.type === "Build" || x.type === "Demolish") &&
        x.building.box.overlaps(positionBox))
    );
  });
}

export function buildFits(state: State, build: Build): boolean {
  const { map, workQueue } = state;
  const { box: buildBox } = build.building;
  // do not build off the map
  if (!buildBox.inside(GameMap.mapBox)) {
    return false;
  }

  // only build on open floor
  const [w, h] = buildBox.size;
  const [x0, y0] = buildBox.topLeft;
  const x1 = x0 + w;
  const y1 = y0 + h;
  for (let j = y0; j < y1; j++) {
    for (let i = x0; i < x1; i++) {
      if (!GameMap.isXY(map, Char.Floor, i, j)) {
        return false;
      }
    }
  }

  return (
    // check for other buildings
    !getBuildingAt(state, buildBox) &&
    // check build work orders
    !WorkQueue.find(
      workQueue,
      (w) =>
        w !== build && //
        w.type === "Build" && //
        w.building.box.overlaps(buildBox) //
    )
  );
}

export type CheckResult = "Valid" | "Wait" | "Cancel";

export function checkWorkConditions(state: State, work: Work): CheckResult {
  switch (work.type) {
    case "Dig":
      if (!GameMap.is(state.map, Char.Wall, work.position)) {
        return "Cancel";
      } else {
        return "Valid";
      }
    case "Fill":
      if (!GameMap.is(state.map, Char.Floor, work.position)) {
        return "Cancel";
      } else if (isOccupied(state, work.position)) {
        return "Wait";
      } else {
        return "Valid";
      }
    case "Build":
      if (!buildFits(state, work)) {
        return "Cancel";
      } else {
        return "Valid";
      }
    case "Demolish":
      if (!Arrays.find(state.buildings, (x) => x === work.building)) {
        return "Cancel";
      } else {
        return "Valid";
      }
  }
}
