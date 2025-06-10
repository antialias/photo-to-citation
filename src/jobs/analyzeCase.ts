import { parentPort, workerData } from "node:worker_threads";
import { analyzeCase } from "../lib/caseAnalysis";

(async () => {
  const { jobData } = workerData as { jobData: unknown };
  await analyzeCase(jobData as any);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("analyzeCase job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
