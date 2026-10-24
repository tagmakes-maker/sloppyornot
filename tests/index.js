// Entry point so that `node --test tests/` runs every *.test.mjs file in this folder.
// Node resolves a directory argument to its index.js, so this file loads the real tests.
// Node built-ins only. No npm packages.
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort();

(async () => {
  for (const file of files) {
    await import(path.join(__dirname, file));
  }
})();
