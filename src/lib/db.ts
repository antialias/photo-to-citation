import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config";
import { runMigrations } from "./migrate";

const dbFile = config.CASE_STORE_FILE
  ? path.resolve(config.CASE_STORE_FILE)
  : path.join(process.cwd(), "data", "cases.sqlite");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

declare global {
  // biome-ignore lint/style/useSingleVarDeclarator: group globals
  var __db: Database.Database | undefined;
  var __migrationsReady: void | undefined;
}

let db: Database.Database;
let migrationsReady: void | undefined;

if (globalThis.__db) {
  db = globalThis.__db;
  migrationsReady = globalThis.__migrationsReady;
} else {
  db = new Database(dbFile);
  migrationsReady = runMigrations(db);
  globalThis.__db = db;
  globalThis.__migrationsReady = migrationsReady;
}

export { db, migrationsReady };

export function closeDb(): void {
  db.close();
  globalThis.__db = undefined;
  globalThis.__migrationsReady = undefined;
}
