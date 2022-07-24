/**
 * netMAZE by @javadocmd (https://github.com/JavadocMD)
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

// netMAZE by @javadocmd (https://github.com/JavadocMD)
// An Axiom QuickServe server.
// Dial us up on NETronics Connect!
// See https://www.zachtronics.com/quickserve/ for instructions.

var engine;
var state;
var profile;

function getName() {
  return "netMAZE";
}

function onConnect() {
  let w = 25;
  let h = 15;
  let ox = 15; // 54 / 2 - w / 2;
  let oy = 4;
  engine = Engine(w, h, ox, oy);
  state = engine.restart();
  profile = engine.loadProfile();
}

function onUpdate() {
  clearScreen();
  engine.drawUI();
  engine.drawMaze(state.maze);
  engine.drawPlayer(state.player);

  // debug
  // drawText(state.player.x + "," + state.player.y, 5, 0, 0);
}

function onInput(key) {
  // Check for move.
  let move = null;
  if (key === 104 || key === 72) {
    move = dir.left; // h
  } else if (key === 106 || key === 74) {
    move = dir.down; // j
  } else if (key === 107 || key === 75) {
    move = dir.up; // k
  } else if (key === 108 || key === 76) {
    move = dir.right; // l
  }

  if (move !== null) {
    // On valid move, update player position.
    let result = engine.tryMove(move, state.player, state.maze);
    if (result !== null) {
      state.player.x = result[0];
      state.player.y = result[1];
    }

    // If player has won, increment wins and restart with a new maze.
    if (engine.isWin(state)) {
      profile.wins = profile.wins + 1;
      engine.saveProfile(profile);
      state = engine.restart();
    }
  }
}

// ======== UTIL ========

function shuffle(arr) {
  for (let i = 0; i < arr.length - 2; i++) {
    let j = Math.floor(Math.random() * (arr.length - i)) + i;
    let tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function arrayOf(length, fValue) {
  let arr = Array.apply(length);
  for (let i = 0; i < length; i++) {
    arr[i] = fValue(i);
  }
  return arr;
}

// ======== CONSTANTS ========

var glyph = {
  floor: ".",
  wall: "#",
  player: "⚉",
};

var dir = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
};

// ======== ENGINE ========

// Width and height includes walls.
function Engine(width, height, drawOffsetX, drawOffsetY) {
  var startX = 1;
  var startY = 0;

  function blankMaze(w, h) {
    return arrayOf(h, function () {
      return arrayOf(w, function () {
        return glyph.wall;
      });
    });
  }

  // Generate a maze.
  function generateMaze() {
    // hop by 2 so as to allow space for walls
    function neighbors(x, y) {
      return [
        [x, y - 2],
        [x, y + 2],
        [x - 2, y],
        [x + 2, y],
      ];
    }

    function unvisited(x, y, w, h, cells) {
      return x >= 0 && x < w && y >= 0 && y < h && cells[y][x] === glyph.wall;
    }

    function recurse(x, y, w, h, cells) {
      cells[y][x] = glyph.floor; // clear current cell
      let next = shuffle(neighbors(x, y));
      for (let i = 0; i < next.length; i++) {
        let n = next[i];
        let nx = n[0];
        let ny = n[1];
        if (unvisited(nx, ny, w, h, cells)) {
          let wx = (x + n[0]) / 2;
          let wy = (y + n[1]) / 2;
          cells[wy][wx] = glyph.floor; // clear wall betwen cells
          cells = recurse(n[0], n[1], w, h, cells);
        }
      }
      return cells;
    }

    let w = width;
    let h = height - 2; // generate two fewer rows -- top and bottom will be static
    let startRow = arrayOf(width, function (i) {
      if (i === 1) {
        return glyph.floor;
      } else {
        return glyph.wall;
      }
    });
    let endRow = arrayOf(width, function (i) {
      if (i === width - 2) {
        return glyph.floor;
      } else {
        return glyph.wall;
      }
    });

    let cells = recurse(startX, startY, w, h, blankMaze(w, h));
    cells.unshift(startRow);
    cells.push(endRow);
    return {
      cells: cells,
      width: width,
      height: height,
    };
  }

  function mazeToString(maze) {
    return maze.cells
      .map(function (row) {
        return row.join("");
      })
      .join("\n");
  }

  function drawMaze(maze) {
    for (let j = 0; j < maze.height; j++) {
      // drawText(maze.cells[j].join(""), 10, drawOffsetX, drawOffsetY + j);
      for (let i = 0; i < maze.width; i++) {
        let cell = maze.cells[j][i];
        let color = 10;
        if (cell === glyph.floor) {
          color = 5;
        }
        drawText(cell, color, drawOffsetX + i, drawOffsetY + j);
      }
    }
  }

  function drawPlayer(player) {
    drawText(glyph.player, 17, drawOffsetX + player.x, drawOffsetY + player.y);
  }

  function initialPlayer() {
    return {
      x: startX,
      y: startY,
    };
  }

  function restart() {
    return {
      maze: generateMaze(),
      player: initialPlayer(),
    };
  }

  function tryMove(move, player, maze) {
    let nx = player.x;
    let ny = player.y;
    if (move === dir.up) {
      ny -= 1;
    } else if (move === dir.right) {
      nx += 1;
    } else if (move === dir.down) {
      ny += 1;
    } else if (move === dir.left) {
      nx -= 1;
    } else {
      // invalid direction
      return null;
    }
    if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) {
      // out of bounds
      return null;
    } else if (maze.cells[ny][nx] === glyph.wall) {
      // hit a wall
      return null;
    } else {
      // valid move
      return [nx, ny];
    }
  }

  function isWin(state) {
    return state.player.x === width - 2 && state.player.y === height - 1;
  }

  function drawUI() {
    let cttl = 11;
    let ctxt = 9;
    // terminal is 56x20
    drawBox(1, 0, 1, 56, 19);
    // Top info box.
    let title = " netMAZE - infinite mazes for your net by javadocmd ";
    drawBox(3, 1, 0, 54, 3);
    drawText(title, cttl, 2, 1);
    // Left info box.
    drawBox(3, 1, 4, 12, 15);
    drawText("KEYS:", ctxt, 2, 5);
    drawText("[k] up", ctxt, 2, 6);
    drawText("[j] down", ctxt, 2, 7);
    drawText("[h] left", ctxt, 2, 8);
    drawText("[l] right", ctxt, 2, 9);
    let goal = "you are a skull. get to exit at bottom right of maze.";
    drawText("GOAL:", ctxt, 2, 11);
    drawTextWrapped(goal, ctxt, 2, 12, 10);
    // Right info box.
    drawBox(3, 42, 4, 13, 15);
    drawText("WINS:", ctxt, 43, 5);
    drawText(profile.wins + "", ctxt, 43, 6);
  }

  function loadProfile() {
    let data = loadData();
    if (data === "") {
      return { wins: 0 };
    } else {
      return JSON.parse(data);
    }
  }

  function saveProfile(profile) {
    saveData(JSON.stringify(profile));
  }

  return {
    generateMaze: generateMaze,
    restart: restart,
    tryMove: tryMove,
    isWin: isWin,
    drawMaze: drawMaze,
    mazeToString: mazeToString,
    drawPlayer: drawPlayer,
    drawUI: drawUI,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
  };
}
