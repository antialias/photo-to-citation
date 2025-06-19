import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getConfig } from "./config";
import { runMigrations } from "./migrate";

const cfg = getConfig();
const dbFile = cfg.CASE_STORE_FILE
  ? path.resolve(cfg.CASE_STORE_FILE)
  : path.join(process.cwd(), "data", "cases.sqlite");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

export const db = new Database(dbFile);

export const migrationsReady = runMigrations(db);
