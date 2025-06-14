import fs from "node:fs/promises";
import path from "node:path";
import type Database from "better-sqlite3";
import { Umzug } from "umzug";

interface MigrationContext {
  db: Database;
}

export async function runMigrations(db: Database): Promise<void> {
  const migrationsDir = path.join(process.cwd(), "migrations");
  await fs.mkdir(migrationsDir, { recursive: true });

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY
    );
  `);

  const storage = {
    async executed() {
      const rows = db
        .prepare("SELECT name FROM migrations ORDER BY name")
        .all() as Array<{ name: string }>;
      return rows.map((r) => r.name);
    },
    async logMigration({ name }: { name: string }) {
      db.prepare("INSERT INTO migrations (name) VALUES (?)").run(name);
    },
    async unlogMigration({ name }: { name: string }) {
      db.prepare("DELETE FROM migrations WHERE name = ?").run(name);
    },
  };

  const umzug = new Umzug<MigrationContext>({
    migrations: {
      glob: path.join(migrationsDir, "*.sql"),
      resolve: ({ name, path: filepath }) => ({
        name,
        async up({ context }) {
          const sql = await fs.readFile(filepath as string, "utf8");
          context.db.exec(sql);
        },
      }),
    },
    context: { db },
    storage,
    logger: console,
  });

  await umzug.up();
}
