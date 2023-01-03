import * as Cursor from "Cursor";
import { defaultMenu, flipMenu, gotoMenu, option, optionMenu } from "MenuUtils";
import { MenuPainter } from "Painter";
import { Menu, Result, State } from "State";
import { buildFits, getBuildingAt, getWorkAt } from "StateQuery";
import { Char, Color, Key } from "utils/Constants";
import { identity, v1x1 } from "utils/index";
import * as Building from "./Building";
import * as GameMap from "./GameMap";
import { hunger, mood } from "./Hobbit";
import * as Work from "./Work";
import * as WorkQueue from "./WorkQueue";
import * as WorkUtils from "./WorkUtils";

export const Default = defaultMenu(
  (s) => gotoMenu(s, Root) //
);

export const Root = optionMenu(
  (s) => gotoMenu(s, Default),
  (s) => gotoMenu(s, Default),
  "Hobbit Home",
  [
    option("dig", (s) => gotoMenu(s, Digging)),
    option("fill", (s) => gotoMenu(s, Filling)),
    option("build", (s) => gotoMenu(s, Build)),
    option("demolish", (s) => gotoMenu(s, Demolish)),
    option("hobbits", (s) => gotoMenu(s, Hobbits)),
  ]
);

export const Digging: Menu = {
  onRender(s) {
    drawBox(Color.TEXT, 0, 0, GameMap.mapWidth, 1);
    drawText("digging (ENTER to mark, ESC to cancel)", Color.TEXT, 1, 0);
  },
  onInput(s, key) {
    if (key === Key.TAB) {
      return gotoMenu(s, Default);
    } else if (key == Key.ESCAPE) {
      return gotoMenu(s, Root);
    } else if (key === Key.ENTER) {
      const pos = GameMap.Cell.fromVector(s.cursor.position);
      const work = getWorkAt(s, pos);
      if (work === null) {
        // no existing order, create one
        if (GameMap.is(s.map, Char.Wall, pos)) {
          const workQueue = WorkQueue.add(s.workQueue, Work.dig(pos));
          return { ...s, workQueue };
        }
      } else if (work.type === "Dig") {
        // terminate existing dig orders
        return WorkUtils.remove(s, work);
      }
      // leave non-dig orders as-is
    }
    return null;
  },
  onEnter(s) {
    return Cursor.enableCursor(s, v1x1);
  },
  onExit(s) {
    return Cursor.disableCursor(s);
  },
};

const Filling: Menu = {
  onRender(s) {
    drawBox(Color.TEXT, 0, 0, GameMap.mapWidth, 1);
    drawText("filling (ENTER to mark, ESC to cancel)", Color.TEXT, 1, 0);
  },
  onInput(s, key) {
    if (key === Key.TAB) {
      return gotoMenu(s, Default);
    } else if (key == Key.ESCAPE) {
      return gotoMenu(s, Root);
    } else if (key === Key.ENTER) {
      const pos = GameMap.Cell.fromVector(s.cursor.position);
      const work = getWorkAt(s, pos);
      if (work === null) {
        // no existing order, create one
        if (GameMap.is(s.map, Char.Floor, pos)) {
          const workQueue = WorkQueue.add(s.workQueue, Work.fill(pos));
          return { ...s, workQueue };
        }
      } else if (work.type === "Fill") {
        // terminate existing dig orders
        return WorkUtils.remove(s, work);
      }
      // leave non-fill orders as-is
    }
    return null;
  },
  onEnter(s) {
    return Cursor.enableCursor(s, v1x1);
  },
  onExit(s) {
    return Cursor.disableCursor(s);
  },
};

const Hobbits: Menu = {
  onRender({ menuLeft, hobbits }: State): void {
    const p = new MenuPainter(menuLeft);
    p.start("Hobbits");
    hobbits.forEach((x, i) => {
      const text = `${i + 1}. ${x.name}`;
      p.nextLine(text);
    });
  },
  onInput(s: State, key: number): Result {
    if (key === Key.TAB) {
      return gotoMenu(s, Default);
    } else if (key === Key.ESCAPE) {
      return gotoMenu(s, Root);
    } else if (key === Key.BACKTICK) {
      return flipMenu(s);
    } else if (Key.isNumber(key)) {
      const i = Key.toNumber(key) - 1;
      if (i >= 0 && i < s.hobbits.length) {
        return gotoMenu(s, HobbitDetail(i));
      } else {
        return null;
      }
    } else {
      return null;
    }
  },
  onEnter: identity,
  onExit: identity,
};

function HobbitDetail(index: number): Menu {
  return {
    onRender({ menuLeft, hobbits }: State): void {
      const p = new MenuPainter(menuLeft);
      p.start("Hobbit Detail");
      const h = hobbits[index];
      p.nextLineWrapped(h.fullName);
      p.nextLine("──────────────");
      p.nextLine("Mood:");
      p.nextLine(` ${mood.toString(h.mood)}`);
      p.nextLine("Hunger:");
      p.nextLine(` ${hunger.toString(h.hunger)}`);
      p.nextLine("Thoughts:");
      p.nextLineWrapped(h.thoughts);
    },
    onInput(s: State, key: number): Result {
      switch (key) {
        case Key.TAB:
          return gotoMenu(s, Default);
        case Key.ESCAPE:
          return gotoMenu(s, Hobbits);
        case Key.BACKTICK:
          return flipMenu(s);
        default:
          return null;
      }
    },
    onEnter(s) {
      return { ...s, selectedHobbit: index };
    },
    onExit(s) {
      return { ...s, selectedHobbit: null };
    },
  };
}

const Build: Menu = optionMenu(
  (s) => gotoMenu(s, Default),
  (s) => gotoMenu(s, Root),
  "Build",
  Building.defValues.map((def) => ({
    text: def.name,
    apply: (s: State) => gotoMenu(s, BuildPlacement(def)),
  }))
);

function BuildPlacement(buildingDef: Building.BuildingDef): Menu {
  return {
    onRender(s) {
      drawBox(Color.TEXT, 0, 0, GameMap.mapWidth, 1);
      drawText("building (ENTER to mark, ESC to cancel)", Color.TEXT, 1, 0);
    },
    onInput(s, key) {
      if (key === Key.TAB) {
        return gotoMenu(s, Default);
      } else if (key == Key.ESCAPE) {
        return gotoMenu(s, Build);
      } else if (key === Key.ENTER) {
        const pos = GameMap.Cell.fromVector(s.cursor.position);
        const work = getWorkAt(s, pos);
        if (work === null) {
          // no existing order, create one
          const building = Building.create(buildingDef, pos);
          const newWork = Work.build(pos, building);
          if (buildFits(s, newWork)) {
            const workQueue = WorkQueue.add(s.workQueue, newWork);
            return { ...s, workQueue };
          }
        } else if (work.type === "Build") {
          // terminate existing build orders
          return WorkUtils.remove(s, work);
        }
        // leave non-build orders as-is
      }
      return null;
    },
    onEnter(s) {
      return Cursor.enableCursor(s, buildingDef.size);
    },
    onExit(s) {
      return Cursor.disableCursor(s);
    },
  };
}

const Demolish: Menu = {
  onRender(s) {
    drawBox(Color.TEXT, 0, 0, GameMap.mapWidth, 1);
    drawText("demolishing (ENTER to mark, ESC to cancel)", Color.TEXT, 1, 0);
  },
  onInput(s, key) {
    if (key === Key.TAB) {
      return gotoMenu(s, Default);
    } else if (key == Key.ESCAPE) {
      return gotoMenu(s, Root);
    } else if (key === Key.ENTER) {
      const pos = GameMap.Cell.fromVector(s.cursor.position);
      const building = getBuildingAt(s, pos);
      if (building !== null) {
        // there's a building here, demolish it!
        const workQueue = WorkQueue.add(
          s.workQueue,
          Work.demolish(pos, building)
        );
        return { ...s, workQueue };
      }
      const work = getWorkAt(s, pos);
      if (work !== null && work.type === "Demolish") {
        // terminate existing demolish orders
        return WorkUtils.remove(s, work);
      }
      // otherwise no-op
    }
    return null;
  },
  onEnter(s) {
    return Cursor.enableCursor(s, v1x1);
  },
  onExit(s) {
    return Cursor.disableCursor(s);
  },
};
