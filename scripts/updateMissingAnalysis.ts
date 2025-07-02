import { analyzeCase } from "../src/lib/caseAnalysis";
import { getCases } from "../src/lib/caseStore";
import { migrationsReady } from "../src/lib/db";

async function run() {
  await migrationsReady();
  const cases = getCases();
  for (const c of cases) {
    const status = c.analysisStatusCode;
    const shouldRetry =
      !c.analysis ||
      status === 429 ||
      (status !== null && status !== undefined && status >= 500);
    if (shouldRetry) {
      console.log(`Reanalyzing case ${c.id}`);
      await analyzeCase(c, "en");
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
