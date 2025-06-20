const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "src");

function processFile(file) {
  let content = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);
  let changed = false;
  function toAlias(rel) {
    const abs = path.resolve(dir, rel);
    const relToRoot = path.relative(root, abs).replace(/\\/g, "/");
    changed = true;
    return `@/${relToRoot}`;
  }
  const regexes = [
    /from "(\.\.\/[^"']+)"/g,
    /import\("(\.\.\/[^"']+)"/g,
    /require\("(\.\.\/[^"']+)"/g,
    /vi\.mock\("(\.\.\/[^"']+)"/g,
    /"(\.\.\/[^"']+)"/g,
    /'(\.\.\/[^']+)'/g,
  ];
  for (const regex of regexes) {
    content = content.replace(regex, (match, rel) =>
      match.replace(rel, toAlias(rel)),
    );
  }
  if (changed) fs.writeFileSync(file, content);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(res);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      processFile(res);
    }
  }
}

walk(path.resolve(__dirname, "..", "src"));
walk(path.resolve(__dirname, "..", "test"));
