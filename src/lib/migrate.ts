import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";

export function runMigrations(db: Database): void {
  const migrationsDir = path.join(process.cwd(), "migrations");
  fs.mkdirSync(migrationsDir, { recursive: true });

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY
    );
  `);

  const executedRows = db
    .prepare("SELECT name FROM migrations ORDER BY name")
    .all() as Array<{ name: string }>;
  const executed = new Set(executedRows.map((r) => r.name));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    if (executed.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    db.exec(sql);
    db.prepare("INSERT INTO migrations (name) VALUES (?)").run(file);
  }
}
