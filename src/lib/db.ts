import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbFile = process.env.CASE_STORE_FILE
  ? path.resolve(process.env.CASE_STORE_FILE)
  : path.join(process.cwd(), "data", "cases.sqlite");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

export const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);
