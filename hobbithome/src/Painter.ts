import { Cursor } from "Cursor";
import { Building } from "game/Building";
import { mapHeight, mapWidth } from "game/GameMap";
import { Work } from "game/Work";
import { forEach as workQueueForEach } from "game/WorkQueue";
import { State } from "State";
import { Char, Color } from "utils/Constants";
import { Box } from "utils/index";

export function drawBoxOutline(box: Box, color: Color): void {
  drawBox(color, box.topLeft[0], box.topLeft[1], box.size[0], box.size[1]);
}

export function fillBox(box: Box, character: string, color: Color): void {
  fillArea(
    character,
    color,
    box.topLeft[0],
    box.topLeft[1],
    box.size[0],
    box.size[1]
  );
}

export function fillBoxInside(box: Box, character: string, color: Color): void {
  fillArea(
    character,
    color,
    box.topLeft[0] + 1,
    box.topLeft[1] + 1,
    box.size[0] - 2,
    box.size[1] - 2
  );
}

export class MenuPainter {
  private line = 1;
  private readonly offset = this.menuLeft ? 0 : 40;
  constructor(private readonly menuLeft: boolean) {}
  start(title?: string): void {
    drawBox(Color.TEXT, this.offset, 0, 16, 20);
    fillArea(" ", Color.BLACK, this.offset + 1, 1, 14, 18);
    if (typeof title === "string") {
      drawText(title, Color.TEXT, this.offset + 2, 0);
    }
  }
  nextLine(text: string): void {
    drawText(text, Color.TEXT, this.offset + 1, this.line);
    this.line += 1;
  }
  nextLineWrapped(text: string): void {
    drawTextWrapped(text, Color.TEXT, this.offset + 1, this.line, 14);
    this.line += 2;
  }
}

export function drawMap({ map }: State): void {
  for (let j = 0; j < mapHeight; j++) {
    for (let i = 0; i < mapWidth; i++) {
      drawText(map[j][i], Color.GROUND, i, j);
    }
  }
}

export function drawBuilding({ icon, box }: Building): void {
  drawBoxOutline(box, Color.BUILDING);
  fillBoxInside(box, icon, Color.BUILDING);
}

export function drawBuildingGhost({ icon, box }: Building): void {
  drawBoxOutline(box, Color.BUILDING_GHOST);
  fillBoxInside(box, icon, Color.BUILDING_GHOST);
}

export function drawBuildings({ buildings }: State): void {
  buildings.forEach(drawBuilding);
}

export function drawWork({ clock, workQueue }: State): void {
  function drawWorkItem(curr: Work): void {
    const { x, y } = curr.position;
    switch (curr.type) {
      case "Dig":
        drawText(Char.Wall, Color.DIG, x, y);
        break;
      case "Fill":
        drawText(Char.Wall, Color.FILL, x, y);
        break;
      case "Build":
        drawBuildingGhost(curr.building);
        break;
      case "Demolish":
        if (clock.anim) {
          drawText(Char.Demolish, Color.BUILDING_GHOST, x, y);
        }
        break;
    }
  }
  workQueueForEach(workQueue, drawWorkItem);
}

export function drawHobbits({ hobbits, selectedHobbit }: State): void {
  for (let i = 0; i < hobbits.length; i++) {
    const curr = hobbits[i];
    const { x, y } = curr.position;
    const char = selectedHobbit === i ? Char.HobbitSelected : Char.Hobbit;
    drawText(char, Color.WHITE, x, y);
  }
}

export function drawCursor(cursor: Cursor, color: Color): void {
  const [w, h] = cursor.size;
  const x = cursor.position[0] - Math.floor(w / 2);
  const y = cursor.position[1] - Math.floor(h / 2);
  fillArea("X", color, x, y, w, h);
}
