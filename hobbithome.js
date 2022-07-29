/**
 * Hobbit Home by @javadocmd (https://github.com/JavadocMD)
 * Copyright (C) 2022  Tyler Coles
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Hobbit Home by @javadocmd (https://github.com/JavadocMD)
// An Axiom QuickServe server.
// Dial us up on NETronics Connect!
// See https://www.zachtronics.com/quickserve/ for instructions.

var scene;
var state;
var debug;

function getName() {
  return "Hobbit Home";
}

function onConnect() {
  // scene = TitleScene();
  scene = GameScene();
  state = scene.init();
  debug = new Debug();
}

function onUpdate() {
  state = scene.onUpdate(state);
  clearScreen();
  scene.onRender(state);
  debug.draw();
}

function onInput(key) {
  let result = scene.onInput(state, key);
  if (result.event) {
    if (result.event === Event.GOTO_SCENE) {
      scene = result.scene();
      state = scene.init();
    }
  } else {
    state = result;
  }
  if (key === Key.BACKSPACE) {
    debug.clear();
  }
}

// ======== CONSTANTS ======== //

var Key = {
  SPACE: 32,
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 10,
  UP: 17,
  DOWN: 18,
  LEFT: 19,
  RIGHT: 20,
  BACKTICK: 96,
};

var Color = {
  BLACK: 0,
  FILL: 2,
  DIG: 6,
  GROUND: 8,
  TEXT: 13,
  WHITE: 17,
};

var Char = {
  WALL: "█",
  FLOOR: " ",
  HOBBIT: "☻",
};

var Event = {
  GOTO_SCENE: "GOTO_SCENE",
};

// ======== ENGINE ======== //

function Menu(options) {
  function draw(color, x, y) {
    for (let i = 0; i < options.length; i++) {
      let key = i + 1;
      drawText(key + ". " + options[i], color, x, y + i);
    }
  }
  function checkOption(key) {
    // options are keyed 1-based, with 0 being the 10th option.
    if (key === 48) {
      return options[9] || null;
    } else if (key >= 49 && key <= 57) {
      return options[key - 49] || null;
    } else {
      return null;
    }
  }
  return {
    draw: draw,
    checkOption: checkOption,
  };
}

function TitleScene() {
  var menu = Menu(["start game"]);
  function init() {
    return {};
  }
  function onUpdate(state) {
    return state;
  }
  function onInput(state, key) {
    let opt = menu.checkOption(key);
    if (opt === "start game") {
      return { event: Event.GOTO_SCENE, scene: GameScene };
    }
    return state;
  }
  function onRender(state) {
    drawText("Hobbit Home", Color.TEXT, 10, 5);
    drawText("a game by javadocmd", Color.TEXT, 12, 8);

    drawText("══ MENU ══", Color.TEXT, 12, 11);
    menu.draw(Color.TEXT, 12, 12);

    drawText("v0.1", Color.TEXT, 52, 19);
  }
  return {
    init: init,
    onUpdate: onUpdate,
    onRender: onRender,
    onInput: onInput,
  };
}

var Map = {
  width: 56,
  height: 20,
  isWalkable: function (state, position) {
    let x = position[0];
    let y = position[1];
    // Don't walk off map.
    if (x < 0 || x >= Map.width || y < 0 || y >= Map.height) {
      return false;
    }
    // Don't walk into another hobbit.
    // for (let i = 0; i < state.hobbits.length; i++) {
    //   if (samePosition(position, state.hobbits[i].position)) {
    //     return false;
    //   }
    // }
    // Don't walk into a wall.
    return state.map[y][x] !== Char.WALL;
  },
  isOccupied: function (state, position) {
    return state.hobbits.some(function (h) {
      return samePosition(position, h.position);
    });
  },
  walkableNeighbors: function (state, position) {
    return neighbors(position).filter(function (x) {
      return Map.isWalkable(state, x);
    });
  },
};

var ActionResult = {
  CONTINUE: -1,
  COMPLETE: 0,
  CANCELED: 1,
};

var Action = {
  Idle: function () {
    return function Idle(hobbit, state) {
      if (randomInt(7) === 0) {
        let ns = Map.walkableNeighbors(state, hobbit.position);
        if (notEmpty(ns)) {
          hobbit.position = ns.random();
        }
      }
      return ActionResult.CONTINUE;
    };
  },
  Walk: function (path) {
    return function Walk(hobbit, state) {
      // Done?
      if (path.length === 0) {
        return ActionResult.COMPLETE;
      }
      // Walk.
      let next = path.shift();
      if (Map.isWalkable(state, next)) {
        // Step.
        hobbit.position = next;
        return ActionResult.CONTINUE;
      } else {
        // Blocked!
        return ActionResult.CANCELED;
      }
    };
  },
  // Walk to the indicated space if navigable.
  GoTo: function (to) {
    let path = null;
    let walk = null;
    return function GoTo(hobbit, state) {
      // Pathfind.
      if (path === null) {
        path = astar(state, hobbit.position, to);
        if (path === null) {
          return ActionResult.CANCELED;
        } else {
          walk = Action.Walk(path);
        }
      }
      // Defer to Walk action.
      let res = walk(hobbit, state);
      switch (res) {
        case ActionResult.CONTINUE:
          return ActionResult.CONTINUE;
        case ActionResult.COMPLETE:
          return ActionResult.COMPLETE;
        case ActionResult.CANCELED:
          // Re-navigate next tick.
          path = null;
          walk = null;
          return ActionResult.CONTINUE;
      }
    };
  },
  // Find the first navigable adjacent space and walk there.
  GoToAdjacent: function (to) {
    let path = null;
    let walk = null;
    return function GoToAdjacent(hobbit, state) {
      // Pathfind.
      if (path === null) {
        path = Map.walkableNeighbors(state, to).mapFirstNotNull(function (x) {
          return astar(state, hobbit.position, x);
        });
        if (path === null) {
          return ActionResult.CANCELED;
        } else {
          walk = Action.Walk(path);
        }
      }
      // Defer to Walk action.
      let res = walk(hobbit, state);
      switch (res) {
        case ActionResult.CONTINUE:
          return ActionResult.CONTINUE;
        case ActionResult.COMPLETE:
          return ActionResult.COMPLETE;
        case ActionResult.CANCELED:
          // Re-navigate next tick.
          path = null;
          walk = null;
          return ActionResult.CONTINUE;
      }
    };
  },
  Fill: function (work) {
    let go = Action.GoToAdjacent(work.position);
    let timer = 10;
    return function Fill(hobbit, state) {
      // Defer to goto action until complete.
      if (go) {
        let res = go(hobbit, state);
        switch (res) {
          case ActionResult.CONTINUE:
            return ActionResult.CONTINUE;
          case ActionResult.COMPLETE:
            go = null;
            return ActionResult.CONTINUE;
          case ActionResult.CANCELED:
            cancelWork(state, hobbit, work);
            return ActionResult.CANCELED;
        }
      }
      // Do the fill.
      if (timer > 0) {
        timer--;
        return ActionResult.CONTINUE;
      } else if (Map.isOccupied(state, work.position)) {
        // wait for spot to be empty
        return ActionResult.CONTINUE;
      } else {
        let x = work.position[0];
        let y = work.position[1];
        state.map[y][x] = Char.WALL;
        finishWork(state, hobbit, work);
        return ActionResult.COMPLETE;
      }
    };
  },
  Dig: function (work) {
    let go = Action.GoToAdjacent(work.position);
    let timer = 10;
    return function Dig(hobbit, state) {
      // Defer to goto action until complete.
      if (go) {
        let res = go(hobbit, state);
        switch (res) {
          case ActionResult.CONTINUE:
            return ActionResult.CONTINUE;
          case ActionResult.COMPLETE:
            go = null;
            return ActionResult.CONTINUE;
          case ActionResult.CANCELED:
            cancelWork(state, hobbit, work);
            return ActionResult.CANCELED;
        }
      }
      // Do the dig.
      if (timer > 0) {
        timer--;
        return ActionResult.CONTINUE;
      } else {
        let x = work.position[0];
        let y = work.position[1];
        state.map[y][x] = Char.FLOOR;
        finishWork(state, hobbit, work);
        return ActionResult.COMPLETE;
      }
    };
  },
};

var Work = {
  Dig: function (position) {
    return {
      type: "Dig",
      position: position,
      claimed: false,
      toAction: function (self) {
        return Action.Dig(self);
      },
    };
  },
  Fill: function (position) {
    return {
      type: "Fill",
      position: position,
      claimed: false,
      toAction: function (self) {
        return Action.Fill(self);
      },
    };
  },
};

function startWork(state, hobbit, work) {
  hobbit.work = work;
  work.claimed = true;
}

function cancelWork(state, hobbit, work) {
  hobbit.work = null;
  work.claimed = false;
}

function finishWork(state, hobbit, work) {
  hobbit.work = null;
  let i = state.workQueue.indexOf(work);
  state.workQueue.splice(i, 1);
}

function GameScene() {
  let ACTION_IDLE = Action.Idle();

  function init() {
    return loadState();
  }

  function onUpdate(state) {
    state.clock = (state.clock + 1) % 30;
    state.anim = Math.floor(state.clock / 15);

    // twice per second, process work/actions
    if (state.clock % 15 === 0) {
      // TODO: detect inaccessible work and maybe don't assign it until map changes?
      // assign work to idle hobbits
      let unclaimedWork = state.workQueue.filter(function (x) {
        return x.claimed === false;
      });
      let idleHobbits = state.hobbits.filter(function (x) {
        return x.action.name === "Idle";
      });
      while (notEmpty(unclaimedWork) && notEmpty(idleHobbits)) {
        let w = unclaimedWork.shift();
        let h = idleHobbits.shift();
        startWork(state, h, w);
        h.action = w.toAction(w);
      }

      // perform actions
      for (let i = 0; i < state.hobbits.length; i++) {
        let h = state.hobbits[i];
        let result = h.action(h, state);
        switch (result) {
          case ActionResult.CONTINUE:
            break;
          case ActionResult.COMPLETE:
            h.action = ACTION_IDLE;
            break;
          case ActionResult.CANCELED:
            h.action = ACTION_IDLE;
            break;
          default:
            throw "ActionResult not valid.";
        }
      }
    }

    return state;
  }

  function onInput(state, key) {
    return state;
  }

  function initialState() {
    return {
      clock: 0, // frame clock [0,30)
      anim: 0, // animation clock [0,1]
      map: [
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "████████████████████████████████████████████████████████".split(""),
        "███████████████████████████████████████████████████████ ".split(""),
        "█████████   ██████████████████████████  █████████████   ".split(""),
        "  .                                                     ".split(""),
        "                                                   .    ".split(""),
        "            .                                           ".split(""),
        "                                                        ".split(""),
        "                                   .                    ".split(""),
        "                     .                                  ".split(""),
        "                                                        ".split(""),
        "        .                                    .          ".split(""),
      ],
      workQueue: [
        // Work.Dig([0, 0]),
        // Work.Dig([0, 1]),
        // Work.Dig([1, 0]),
        Work.Dig([4, 11]),
        Work.Fill([19, 19]),
      ],
      hobbits: [
        {
          name: "Gundabald Bolger",
          position: [18, 18],
          // action: Action.GoTo([34, 16]),
          action: ACTION_IDLE,
          work: null,
        },
        {
          name: "Frogo Hornfoot",
          position: [26, 16],
          action: ACTION_IDLE,
          work: null,
        },
        {
          name: "Stumpy",
          position: [36, 17],
          action: ACTION_IDLE,
          work: null,
        },
        {
          name: "Hamwise Prouse",
          position: [30, 17],
          action: ACTION_IDLE,
          work: null,
        },
        {
          name: "Mordo Glugbottle",
          position: [10, 19],
          action: ACTION_IDLE,
          work: null,
        },
      ],
    };
  }

  function loadState() {
    let data = loadData();
    if (data === "") {
      return initialState();
    } else {
      return JSON.parse(data);
    }
  }

  function saveState(state) {
    saveData(JSON.stringify(state));
  }

  function onRender(state) {
    // draw map
    for (let j = 0; j < 20; j++) {
      for (let i = 0; i < 56; i++) {
        drawText(state.map[j][i], Color.GROUND, i, j);
      }
    }
    // draw work items
    for (let i = 0; i < state.workQueue.length; i++) {
      let curr = state.workQueue[i];
      let x = curr.position[0];
      let y = curr.position[1];
      switch (curr.type) {
        case "Dig":
          drawText(Char.WALL, Color.DIG, x, y);
          break;
        case "Fill":
          drawText(Char.WALL, Color.FILL, x, y);
          break;
      }
    }
    // draw hobbits
    for (let i = 0; i < state.hobbits.length; i++) {
      let curr = state.hobbits[i];
      let x = curr.position[0];
      let y = curr.position[1];
      drawText(Char.HOBBIT, Color.WHITE, x, y);
    }
  }

  return {
    init: init,
    onUpdate: onUpdate,
    onRender: onRender,
    onInput: onInput,
  };
}

// ======== UTIL ======== //

function Debug() {
  this.text = null;
  this.log = function (text) {
    if (text === null) {
      this.text = "null";
    } else if (text === undefined) {
      this.text = "undefined";
    } else {
      this.text = text;
    }
  };
  this.clear = function () {
    this.text = null;
  };
  this.draw = function () {
    if (this.text !== null) {
      drawText(this.text, Color.TEXT, 0, 0);
    }
  };
}

function PQueue() {
  this.queue = [];
  this.nonEmpty = function () {
    return this.queue.length > 0;
  };
  this.dequeue = function () {
    let first = this.queue.shift();
    return first ? first[0] : null;
  };
  this.enqueue = function (element, priority) {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i][1] > priority) {
        this.queue.splice(i, 0, [element, priority]);
        return;
      }
    }
    this.queue.push([element, priority]);
  };
}

function notEmpty(xs) {
  return xs.length > 0;
}

function randomInt(max) {
  // max is non-inclusive
  return Math.floor(Math.random() * max);
}

function samePosition(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function distance2(a, b) {
  return Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
}

function neighbors(position) {
  let x = position[0];
  let y = position[1];
  return [
    [x, y - 1],
    [x + 1, y],
    [x, y + 1],
    [x - 1, y],
  ];
}

// function randomNeighbor(position) {
//   let x = position[0];
//   let y = position[1];
//   switch (randomInt(4)) {
//     case 0:
//       return [x, y - 1];
//     case 1:
//       return [x + 1, y];
//     case 2:
//       return [x, y + 1];
//     case 3:
//       return [x - 1, y];
//   }
// }

function constrain(min, value, max) {
  if (value < min) {
    return min;
  } else if (value >= max) {
    return max - 1;
  } else {
    return value;
  }
}

Array.prototype.mapFirstNotNull = function (mapFn) {
  for (let i = 0; i < this.length; i++) {
    let y = mapFn(this[i]);
    if (y !== null) {
      return y;
    }
  }
  return null;
};

Array.prototype.find = function (predicate) {
  for (let i = 0; i < this.length; i++) {
    let x = this[i];
    if (predicate(x) === true) {
      return x;
    }
  }
  return null;
};

Array.prototype.random = function () {
  return this.length > 0 ? this[randomInt(this.length)] : null;
};

function astar(state, start, goal) {
  let frontier = new PQueue();
  frontier.enqueue(start, 0);
  let cameFrom = {};
  cameFrom[start] = null;
  let cost = {};
  cost[start] = 0;

  while (frontier.nonEmpty()) {
    let curr = frontier.dequeue();
    if (samePosition(curr, goal)) {
      break;
    }
    let neighbors = Map.walkableNeighbors(state, curr);
    for (let i = 0; i < neighbors.length; i++) {
      let next = neighbors[i];
      let newCost = cost[curr] + 1;
      if (cost[next] === undefined || newCost < cost[next]) {
        cost[next] = newCost;
        let priority = newCost + distance2(goal, next);
        frontier.enqueue(next, priority);
        cameFrom[next] = curr;
      }
    }
  }

  if (cost[goal] === undefined) {
    // No path!
    return null;
  } else {
    let path = [goal];
    let curr = cameFrom[goal];
    while (curr !== null) {
      path.unshift(curr);
      curr = cameFrom[curr];
    }
    path.shift(); // trim 'start' off of path
    return path;
  }
}
