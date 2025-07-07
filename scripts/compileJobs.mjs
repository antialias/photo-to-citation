import { promises as fs } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const jobsDir = path.join("src", "jobs");
const files = (await fs.readdir(jobsDir)).filter(
  (f) => f.endsWith(".ts") && f !== "workerWrapper.js",
);
const entryPoints = files.map((f) => path.join(jobsDir, f));

// mark node_modules as external so they are not bundled
const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
const externals = [...Object.keys(pkg.dependencies || {})];

await build({
  entryPoints,
  outdir: path.join("dist", "jobs"),
  platform: "node",
  format: "cjs",
  target: "node22",
  sourcemap: false,
  bundle: true,
  external: externals,
  plugins: [
    {
      name: "ts-paths",
      setup(build) {
        const aliasPrefix = "@/";
        const srcPath = path.resolve("src");
        build.onResolve({ filter: /^@\// }, (args) => {
          const resolved = path.join(
            srcPath,
            args.path.slice(aliasPrefix.length),
          );
          return { path: `${resolved}.ts` };
        });
      },
    },
  ],
});
