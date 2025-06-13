import { scanInbox } from "../src/lib/inboxScanner";

scanInbox().catch((err) => {
  console.error(err);
  process.exit(1);
});
