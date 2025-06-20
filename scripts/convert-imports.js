const fs = require("node:fs");
const path = require("node:path");
const glob = require("glob");

const root = path.resolve(__dirname, "../src");

const files = glob.sync("src/**/*.{ts,tsx,js,jsx}");

for (const file of files) {
  const fullPath = path.resolve(file);
  let content = fs.readFileSync(fullPath, "utf8");
  let changed = false;
  content = content.replace(
    /from\s+(["'])((?:\.\.\/)+[^"']+?)\1/g,
    (match, quote, rel) => {
      const abs = path.resolve(path.dirname(fullPath), rel);
      if (!abs.startsWith(root)) return match; // skip outside src
      const relative = path.relative(root, abs).replace(/\\/g, "/");
      changed = true;
      return `from ${quote}@/${relative}${quote}`;
    },
  );
  if (changed) fs.writeFileSync(fullPath, content);
}
