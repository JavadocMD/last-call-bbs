import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

const preamble = [
  "/**",
  " * Hobbit Home by @javadocmd (https://github.com/JavadocMD)",
  " * Copyright (C) 2022 Tyler Coles",
  " *",
  " * This program is free software: you can redistribute it and/or modify",
  " * it under the terms of the GNU General Public License as published by",
  " * the Free Software Foundation, either version 3 of the License, or",
  " * (at your option) any later version.",
  " *",
  " * This program is distributed in the hope that it will be useful,",
  " * but WITHOUT ANY WARRANTY; without even the implied warranty of",
  " * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the",
  " * GNU General Public License for more details.",
  " *",
  " * You should have received a copy of the GNU General Public License",
  " * along with this program.  If not, see <https://www.gnu.org/licenses/>.",
  " */",
  "",
  "// Hobbit Home by @javadocmd (https://github.com/JavadocMD)",
  "// An Axiom QuickServe server.",
  "// Dial us up on NETronics Connect!",
  "// See https://www.zachtronics.com/quickserve/ for instructions.",
  "",
];

// QuickServe doesn't like export statements.
// credit: https://github.com/leventea/lastcallbbs-typescript
const stripTopLevelExport = {
  async renderChunk(bundle) {
    return {
      code: bundle.replace(/^export.*/gm, ""),
      map: null,
    };
  },
};

export default {
  input: "src/index.ts",
  output: {
    // file: "out/hobbithome-ts.js",
    file: "../hobbithome-ts.js",
    format: "es",
    generatedCode: "es5",
  },
  plugins: [
    typescript(),
    stripTopLevelExport,
    // terser({
    //   module: false,
    //   format: {
    //     preamble: preamble.join("\n"),
    //   },
    // }),
  ],
};
