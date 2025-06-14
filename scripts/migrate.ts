import { db } from "../src/lib/db";
import { runMigrations } from "../src/lib/migrate";

try {
  runMigrations(db);
} catch (err) {
  console.error(err);
  process.exit(1);
}
