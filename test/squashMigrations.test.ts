// @vitest-environment node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const nodeBin = process.execPath;
const scriptPath = path.resolve("scripts/squashMigrations.ts");

const tsNodeReg = require.resolve("ts-node/register/transpile-only");
const tsconfig = path.resolve("tsconfig.json");

function run(args: string[], cwd: string) {
  return spawnSync(nodeBin, ["-r", tsNodeReg, scriptPath, ...args], {
    cwd,
    env: { ...process.env, TS_NODE_PROJECT: tsconfig },
    encoding: "utf8",
  });
}

describe("squashMigrations script", () => {
  it("squashes older migrations into a baseline", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-"));
    const migDir = path.join(dir, "migrations");
    fs.mkdirSync(migDir);
    for (let i = 0; i < 5; i++) {
      const fname = `${String(i).padStart(4, "0")}_m${i}.sql`;
      fs.writeFileSync(path.join(migDir, fname), `SELECT ${i};\n`);
    }

    const result = run(["--keep", "2"], dir);
    expect(result.status).toBe(0);

    const files = fs.readdirSync(migDir).sort();
    expect(files).toEqual(["0000_baseline.sql", "0003_m3.sql", "0004_m4.sql"]);
    const baseline = fs.readFileSync(
      path.join(migDir, "0000_baseline.sql"),
      "utf8",
    );
    expect(baseline).toContain("-- 0000_m0.sql");
    expect(baseline).toContain("-- 0002_m2.sql");
  });

  it("shows help with --help", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-"));
    const { status, stdout } = run(["--help"], dir);
    expect(status).toBe(0);
    expect(stdout).toMatch(/Usage:/);
  });
});
