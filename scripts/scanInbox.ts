import { migrationsReady } from "../src/lib/db";
import { scanInbox } from "../src/lib/inboxScanner";

async function run() {
  await migrationsReady();
  await scanInbox();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
