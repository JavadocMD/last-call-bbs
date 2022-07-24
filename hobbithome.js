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
  scene = TitleScene();
  // scene = GameScene();
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
  GROUND: 8,
  TEXT: 13,
  WHITE: 17,
};

var Char = {
  WALL: "█",
  HOBBIT: "☻",
};

var Event = {
  GOTO_SCENE: "GOTO_SCENE",
};

// ======== UTIL ======== //

function Debug() {
  this.text = null;
  this.log = function (text) {
    this.text = text;
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

function constrain(min, value, max) {
  if (value < min) {
    return min;
  } else if (value >= max) {
    return max - 1;
  } else {
    return value;
  }
}

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

function GameScene() {
  function init() {
    return loadState();
  }

  function onUpdate(state) {
    state.clock = (state.clock + 1) % 30;
    if (state.clock === 29) {
      // once per second each hobbit wanders to a new spot
      for (let i = 0; i < state.hobbits.length; i++) {
        let curr = state.hobbits[i];
        let x = curr.position[0];
        let y = curr.position[1];
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            x++;
            break;
          case 1:
            x--;
            break;
          case 2:
            y++;
            break;
          case 3:
            y--;
            break;
        }
        curr.position = [constrain(0, x, 56), constrain(0, y, 20)];
      }
    }
    return state;
  }

  function onInput(state, key) {
    return state;
  }

  function initialState() {
    return {
      clock: 0,
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
      hobbits: [
        {
          name: "Gundabald Bolger",
          position: [18, 18],
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
    // draw hobbits
    for (let i = 0; i < state.hobbits.length; i++) {
      let curr = state.hobbits[i];
      drawText(Char.HOBBIT, Color.WHITE, curr.position[0], curr.position[1]);
    }
  }

  return {
    init: init,
    onUpdate: onUpdate,
    onRender: onRender,
    onInput: onInput,
  };
}
