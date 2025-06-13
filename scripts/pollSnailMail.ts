import { pollAllProviders } from "../src/lib/snailMail";

pollAllProviders().catch((err) => {
  console.error(err);
  process.exit(1);
});
