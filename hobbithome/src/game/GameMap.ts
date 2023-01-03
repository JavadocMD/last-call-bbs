import { State } from "State";
import { Char, MapSymbol } from "utils/Constants";
import { Arrays, Box, constrain, PQueue, v1x1, Vector } from "utils/index";

export type GameMap = Array<Array<MapSymbol>>;

export const mapWidth = 56;
export const mapHeight = 20;
export const mapBox = new Box([28, 10], [56, 20]);

export function defaultMap() {
  return [
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "████████████████████████████████████████████████████████",
    "███████████████████████████████████████████████████████ ",
    "█████████   ██████████████████████████  █████████████   ",
    "                                                        ",
    "                                                        ",
    "                                                        ",
    "                                                        ",
    "                                                        ",
    "                                                        ",
    "                                                        ",
    "                                                        ",
  ].map((x) => x.split("")) as GameMap;
}

export const constrainX = (value: number) => constrain(0, value, mapWidth);
export const constrainY = (value: number) => constrain(0, value, mapHeight);

export class Cell {
  readonly index = this.y * mapHeight + this.x;

  constructor(readonly x: number, readonly y: number) {}

  neighbors(): Array<Cell> {
    return [
      new Cell(this.x, this.y - 1),
      new Cell(this.x + 1, this.y),
      new Cell(this.x, this.y + 1),
      new Cell(this.x - 1, this.y),
    ];
  }

  distanceTo(that: Cell): number {
    // manhattan distance
    return Math.abs(that.x - this.x) + Math.abs(that.y - this.y);
  }

  equals(that: Cell): boolean {
    return this.x === that.x && this.y === that.y;
  }

  toBox(): Box {
    return new Box([this.x, this.y], v1x1);
  }

  toVector(): Vector {
    return [this.x, this.y];
  }

  static fromVector([x, y]: Vector): Cell {
    return new Cell(x, y);
  }
}

export function isInBounds({ x, y }: Cell): boolean {
  return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
}

export function is(map: GameMap, symbol: MapSymbol, cell: Cell): boolean {
  return map[cell.y][cell.x] === symbol;
}

export function isXY(
  map: GameMap,
  symbol: MapSymbol,
  x: number,
  y: number
): boolean {
  return map[y][x] === symbol;
}

export function isWalkable(map: GameMap, cell: Cell): boolean {
  return (
    // Don't walk off map.
    isInBounds(cell) &&
    // Don't walk into a wall.
    map[cell.y][cell.x] !== Char.Wall
  );
}

export function walkableNeighbors(map: GameMap, position: Cell): Array<Cell> {
  return position.neighbors().filter((x) => isWalkable(map, x));
}

export interface MapUpdate {
  readonly position: Cell;
  readonly symbol: MapSymbol;
}

export function mutateMap({ map, mapUpdates }: State): void {
  while (Arrays.notEmpty(mapUpdates)) {
    const { position, symbol } = mapUpdates.shift()!;
    map[position.y][position.x] = symbol;
  }
}

export type Path = Array<Cell>;

export function astar(map: GameMap, start: Cell, goal: Cell): Path | null {
  const frontier = new PQueue<Cell>();
  frontier.enqueue(start, 0);
  const cameFrom = new Array<Cell | null>();
  cameFrom[start.index] = null;
  const cost = new Array<number>();
  cost[start.index] = 0;

  while (frontier.nonEmpty()) {
    const curr = frontier.dequeue()!;
    if (curr.equals(goal)) {
      break;
    }
    const neighbors = walkableNeighbors(map, curr);
    for (let i = 0; i < neighbors.length; i++) {
      const next = neighbors[i];
      const newCost = cost[curr.index] + 1;
      if (cost[next.index] === undefined || newCost < cost[next.index]) {
        cost[next.index] = newCost;
        const priority = newCost + next.distanceTo(goal);
        frontier.enqueue(next, priority);
        cameFrom[next.index] = curr;
      }
    }
  }

  if (cost[goal.index] === undefined) {
    // No path!
    return null;
  } else {
    const path = [goal];
    let curr = cameFrom[goal.index];
    while (curr !== null) {
      path.unshift(curr);
      curr = cameFrom[curr.index];
    }
    path.shift(); // trim 'start' off of path
    return path;
  }
}
