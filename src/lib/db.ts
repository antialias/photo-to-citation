import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config";
import { runMigrations } from "./migrate";

const dbFile = config.CASE_STORE_FILE
  ? path.resolve(config.CASE_STORE_FILE)
  : path.join(process.cwd(), "data", "cases.sqlite");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

let db: Database;
let migrationsReady: undefined;

if ((globalThis as Record<string, unknown>).__db) {
  db = (globalThis as Record<string, Database>).__db;
  migrationsReady = (globalThis as Record<string, undefined>).__migrationsReady;
} else {
  db = new Database(dbFile);
  migrationsReady = runMigrations(db);
  (globalThis as Record<string, unknown>).__db = db;
  (globalThis as Record<string, unknown>).__migrationsReady = migrationsReady;
}

export { db, migrationsReady };

export function closeDb(): void {
  db.close();
  (globalThis as Record<string, unknown>).__db = undefined;
  (globalThis as Record<string, unknown>).__migrationsReady = undefined;
}
