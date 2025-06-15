import fs from "node:fs";
import path from "node:path";
type Database = unknown;

export function runMigrations(db: Database): void {
  const anyDb = db as {
    exec: (sql: string) => void;
    prepare: (sql: string) => {
      run: (...args: unknown[]) => void;
      all: () => unknown;
    };
  };
  const migrationsDir = path.join(process.cwd(), "migrations");
  fs.mkdirSync(migrationsDir, { recursive: true });

  anyDb.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY
    );
  `);

  const executedRows = anyDb
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
    anyDb.exec(sql);
    anyDb.prepare("INSERT INTO migrations (name) VALUES (?)").run(file);
  }
}
