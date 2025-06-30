import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config";
import { runMigrations } from "./migrate";

const dbFile = config.CASE_STORE_FILE
  ? path.resolve(config.CASE_STORE_FILE)
  : path.join(process.cwd(), "data", "cases.sqlite");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

export const db = new Database(dbFile);

export const migrationsReady: Promise<void> =
  process.env.NEXT_PHASE === "phase-production-build"
    ? Promise.resolve()
    : Promise.resolve(runMigrations(db));
