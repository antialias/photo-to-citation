import { deleteAnonymousCasesOlderThan } from "../src/lib/caseStore";
import { migrationsReady } from "../src/lib/db";

async function run() {
  await migrationsReady();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const count = deleteAnonymousCasesOlderThan(cutoff);
  console.log(
    `Deleted ${count} anonymous cases older than ${cutoff.toISOString()}`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
