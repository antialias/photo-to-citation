import { parentPort, workerData } from "node:worker_threads";
import { analyzeCase } from "../lib/caseAnalysis";

(async () => {
  await analyzeCase(workerData);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("analyzeCase job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
