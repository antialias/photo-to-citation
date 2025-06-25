import fs from "node:fs";
import Database from "better-sqlite3";
import { afterAll, afterEach, beforeAll } from "vitest";
import { runMigrations } from "./src/lib/migrate";
import { casesDb } from "./test/e2e/smokeServer";

const dbFile = casesDb();
process.env.CASE_STORE_FILE = dbFile;

let db: Database.Database;

beforeAll(() => {
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  db = new Database(dbFile);
  runMigrations(db);
});

afterEach(() => {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .all() as Array<{ name: string }>;
  for (const { name } of tables) {
    if (name === "migrations") continue;
    db.prepare(`DELETE FROM ${name}`).run();
  }
  const stmt = db.prepare(
    "INSERT INTO casbin_rules (ptype, v0, v1, v2) VALUES (?, ?, ?, ?)",
  );
  const rules: Array<[string, string, string, string | null]> = [
    ["p", "user", "upload", "create"],
    ["g", "admin", "user", null],
    ["g", "superadmin", "admin", null],
    ["p", "anonymous", "public_cases", "read"],
  ];
  for (const r of rules) stmt.run(...r);
});

afterAll(() => {
  db.close();
  fs.unlinkSync(dbFile);
});
