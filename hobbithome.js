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
  _0: 48,
  _1: 49,
  _2: 50,
  _3: 51,
  _4: 52,
  _5: 53,
  _6: 54,
  _7: 55,
  _8: 56,
  _9: 57,
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
  is: function (state, position, char) {
    let x = position[0];
    let y = position[1];
    return state.map[y][x] === char;
  },
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
          hobbit.position = Arrays.random(ns);
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
        path = Arrays.mapFirstNotNull(
          Map.walkableNeighbors(state, to),
          function (x) {
            return astar(state, hobbit.position, x);
          }
        );
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
            state.workQueue.canceled(work);
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
        state.workQueue.completed(work);
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
            state.workQueue.canceled(work);
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
        state.workQueue.completed(work);
        return ActionResult.COMPLETE;
      }
    };
  },
  forWork: function (work) {
    switch (work.type) {
      case "Dig":
        return this.Dig(work);
      case "Fill":
        return this.Fill(work);
      default:
        throw "Unable to create action for work type " + work.type;
    }
  },
};

var Work = {
  Dig: function (position) {
    return {
      type: "Dig",
      position: position,
      claimedBy: null,
      onHold: false,
    };
  },
  Fill: function (position) {
    return {
      type: "Fill",
      position: position,
      claimedBy: null,
      onHold: false,
    };
  },
  isUnassigned: function (x) {
    return x.claimedBy === null && x.onHold === false;
  },
};

function WorkQueue(initialItems) {
  this.items = []; // all work items
  this.onHold = []; // queue for on-hold items (an item may be in both arrays)
  if (initialItems && notEmpty(initialItems)) {
    this.items = this.items.concat(initialItems);
  }

  this.add = function (work) {
    this.items.push(work);
  };
  this.remove = function (work) {
    Arrays.removeItem(this.items, work);
    Arrays.removeItem(this.onHold, work);
  };

  this.started = function (work, hobbit) {
    work.claimedBy = hobbit;
  };
  this.canceled = function (work) {
    // work unable to be completed by hobbit: place on hold
    work.claimedBy = null;
    work.onHold = true;
    this.onHold.push(work);
  };
  this.completed = function (work) {
    Arrays.removeItem(this.items, work);
  };

  this.tick = function () {
    // on hold work is trickled back into queue, one per tick
    if (notEmpty(this.onHold)) {
      let w = this.onHold.shift();
      w.onHold = false;
    }
  };

  this.getUnassigned = function () {
    return this.items.filter(Work.isUnassigned);
  };
  this.at = function (position) {
    return Arrays.find(this.items, function (x) {
      return samePosition(x.position, position);
    });
  };

  this.draw = function () {
    let xs = this.items;
    for (let i = 0; i < xs.length; i++) {
      let curr = xs[i];
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
  };
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
      state.workQueue.tick();
      // assign work to idle hobbits
      let unclaimedWork = state.workQueue.getUnassigned();
      let idleHobbits = state.hobbits.filter(function (x) {
        return x.action.name === "Idle";
      });
      while (notEmpty(unclaimedWork) && notEmpty(idleHobbits)) {
        let w = unclaimedWork.shift();
        let h = Arrays.removeMaxBy(idleHobbits, function (hobbit) {
          return -distance(w.position, hobbit.position);
        });
        state.workQueue.started(w, h);
        h.action = Action.forWork(w);
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
    // cursor input
    if (state.cursorOn) {
      let x = state.cursor[0];
      let y = state.cursor[1];
      if (key === Key.LEFT) {
        state.cursor = [constrain(0, x - 1, 56), y];
      } else if (key === Key.RIGHT) {
        state.cursor = [constrain(0, x + 1, 56), y];
      } else if (key === Key.UP) {
        state.cursor = [x, constrain(0, y - 1, 20)];
      } else if (key === Key.DOWN) {
        state.cursor = [x, constrain(0, y + 1, 20)];
      }
    }
    // modal input
    state.mode.onInput(state, key);
    // trigger mode transition
    if (state.prevMode !== state.mode) {
      state.prevMode.onExit(state);
      state.mode.onEnter(state);
      state.prevMode = state.mode;
    }
    return state;
  }

  var Mode = {
    default: {
      onInput: function (state, key) {
        if (key === Key.TAB) {
          state.mode = Mode.rootMenu;
        }
        return state;
      },
      onRender: function (state) {},
      onEnter: function (state) {},
      onExit: function (state) {},
    },
    rootMenu: {
      onInput: function (state, key) {
        if (key === Key.TAB || key === Key.ESCAPE) {
          state.mode = Mode.default;
        } else if (key === Key.BACKTICK) {
          state.menuLeft = !state.menuLeft;
        } else if (key === Key._1) {
          state.mode = Mode.digging;
        } else if (key === Key._2) {
          state.mode = Mode.filling;
        } else if (key === Key._3) {
          // TODO: hobbits menu
          // state.mode = Mode.hobbits;
        }
        return state;
      },
      onRender: function (state) {
        let offset = state.menuLeft ? 0 : 40;
        drawBox(Color.TEXT, offset, 0, 16, 20);
        fillArea(" ", Color.BLACK, offset + 1, 1, 14, 18);
        drawText("Hobbit Home", Color.TEXT, offset + 2, 0);
        drawText("1. dig", Color.TEXT, offset + 1, 1);
        drawText("2. fill", Color.TEXT, offset + 1, 2);
        // drawText("3. hobbits", Color.TEXT, offset + 1, 3);
      },
      onEnter: function (state) {},
      onExit: function (state) {},
    },
    digging: {
      onInput: function (state, key) {
        if (key === Key.ESCAPE) {
          state.mode = Mode.rootMenu;
        } else if (key === Key.ENTER) {
          let work = state.workQueue.at(state.cursor);
          if (!work) {
            // no existing order, create one
            if (Map.is(state, state.cursor, Char.WALL)) {
              state.workQueue.add(Work.Dig(state.cursor));
            }
          } else if (work.type === "Dig") {
            // terminate existing dig orders
            state.workQueue.remove(work);
            if (work.claimedBy) {
              work.claimedBy.action = ACTION_IDLE;
            }
          }
          // leave non-dig orders as-is
        }
        return state;
      },
      onRender: function (state) {
        drawBox(Color.TEXT, 0, 0, 56, 1);
        drawText("digging (ENTER to mark, ESC to cancel)", Color.TEXT, 1, 0);
      },
      onEnter: function (state) {
        state.cursorOn = true;
        return state;
      },
      onExit: function (state) {
        state.cursorOn = false;
        return state;
      },
    },
    filling: {
      onInput: function (state, key) {
        if (key === Key.ESCAPE) {
          state.mode = Mode.rootMenu;
        } else if (key === Key.ENTER) {
          let work = state.workQueue.at(state.cursor);
          if (!work) {
            // no existing order, create one
            if (Map.is(state, state.cursor, Char.FLOOR)) {
              state.workQueue.add(Work.Fill(state.cursor));
            }
          } else if (work.type === "Fill") {
            // terminate existing fill orders
            state.workQueue.remove(work);
            if (work.claimedBy) {
              work.claimedBy.action = ACTION_IDLE;
            }
          }
          // leave non-fill orders as-is
        }
        return state;
      },
      onRender: function (state) {
        drawBox(Color.TEXT, 0, 0, 56, 1);
        drawText("filling (ENTER to mark, ESC to cancel)", Color.TEXT, 1, 0);
      },
      onEnter: function (state) {
        state.cursorOn = true;
        return state;
      },
      onExit: function (state) {
        state.cursorOn = false;
        return state;
      },
    },
  };

  function initialState() {
    return {
      clock: 0, // frame clock [0,30)
      anim: 0, // animation clock [0,1]
      mode: Mode.default,
      prevMode: Mode.default,
      menuLeft: true,
      cursorOn: false,
      cursor: [10, 10],
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
        "                                                        ".split(""),
        "                                                        ".split(""),
        "                                                        ".split(""),
        "                                                        ".split(""),
        "                                                        ".split(""),
        "                                                        ".split(""),
        "                                                        ".split(""),
        "                                                        ".split(""),
      ],
      workQueue: new WorkQueue([
        Work.Dig([0, 0]),
        Work.Dig([0, 1]),
        Work.Dig([1, 0]),
        Work.Dig([3, 11]),
        Work.Dig([4, 11]),
        Work.Dig([5, 11]),
        Work.Dig([3, 10]),
        Work.Dig([4, 10]),
        Work.Dig([5, 10]),
        Work.Fill([19, 19]),
      ]),
      hobbits: [
        {
          name: "Gundabald Bolger",
          position: [18, 18],
          // action: Action.GoTo([34, 16]),
          action: ACTION_IDLE,
        },
        {
          name: "Frogo Hornfoot",
          position: [26, 16],
          action: ACTION_IDLE,
        },
        {
          name: "Stumpy",
          position: [36, 17],
          action: ACTION_IDLE,
        },
        {
          name: "Hamwise Prouse",
          position: [30, 17],
          action: ACTION_IDLE,
        },
        {
          name: "Mordo Glugbottle",
          position: [10, 19],
          action: ACTION_IDLE,
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
    state.workQueue.draw();
    // draw hobbits
    for (let i = 0; i < state.hobbits.length; i++) {
      let curr = state.hobbits[i];
      let x = curr.position[0];
      let y = curr.position[1];
      drawText(Char.HOBBIT, Color.WHITE, x, y);
    }
    // draw modality
    state.mode.onRender(state);
    // draw cursor
    if (state.cursorOn) {
      let color = state.anim ? Color.WHITE : Color.GROUND;
      let x = state.cursor[0];
      let y = state.cursor[1];
      drawText("X", color, x, y);
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
        Arrays.insert(this.queue, i, [element, priority]);
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

function distance(a, b) {
  // manhattan distance
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

function constrain(min, value, max) {
  if (value < min) {
    return min;
  } else if (value >= max) {
    return max - 1;
  } else {
    return value;
  }
}

var Arrays = {
  random: function (xs) {
    return xs.length > 0 ? xs[randomInt(xs.length)] : null;
  },
  mapFirstNotNull: function (xs, mapFn) {
    for (let i = 0; i < xs.length; i++) {
      let y = mapFn(xs[i]);
      if (y !== null) {
        return y;
      }
    }
    return null;
  },
  find: function (xs, predicate) {
    for (let i = 0; i < xs.length; i++) {
      let x = xs[i];
      if (predicate(x) === true) {
        return x;
      }
    }
    return null;
  },
  maxBy: function (xs, scoreFn) {
    if (xs.length === 0) {
      return null;
    }
    let bestItem = xs[0];
    let bestScore = scoreFn(bestItem);
    for (let i = 1; i < xs.length; i++) {
      let curr = xs[i];
      let score = scoreFn(curr);
      if (score > bestScore) {
        bestItem = curr;
        bestScore = score;
      }
    }
    return bestItem;
  },
  insert: function (xs, i, x) {
    xs.splice(i, 0, x);
  },
  remove: function (xs, i) {
    xs.splice(i, 1);
  },
  removeItem: function (xs, item) {
    let i = xs.indexOf(item);
    if (i >= 0) {
      xs.splice(i, 1);
    }
  },
  removeMaxBy: function (xs, scoreFn) {
    if (xs.length === 0) {
      return null;
    }
    let bestIndex = 0;
    let bestItem = xs[bestIndex];
    let bestScore = scoreFn(bestItem);
    for (let i = 1; i < xs.length; i++) {
      let curr = xs[i];
      let score = scoreFn(curr);
      if (score > bestScore) {
        bestIndex = i;
        bestItem = curr;
        bestScore = score;
      }
    }
    Arrays.remove(xs, bestIndex);
    return bestItem;
  },
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
        let priority = newCost + distance(goal, next);
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
