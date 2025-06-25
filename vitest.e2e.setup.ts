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
    if (name === "migrations" || name === "casbin_rules") continue;
    db.prepare(`DELETE FROM ${name}`).run();
  }
});

afterAll(() => {
  db.close();
  fs.unlinkSync(dbFile);
});
