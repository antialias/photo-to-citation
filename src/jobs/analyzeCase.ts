import { parentPort, workerData } from "node:worker_threads";
import { analyzeCase } from "../lib/caseAnalysis";
import type { Case } from "../lib/caseStore";
import { migrationsReady } from "../lib/db";

(async () => {
  await migrationsReady;
  const { jobData } = workerData as { jobData: Case };
  await analyzeCase(jobData);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("analyzeCase job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
