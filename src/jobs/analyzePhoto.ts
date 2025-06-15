import { parentPort, workerData } from "node:worker_threads";
import { reanalyzePhoto } from "../lib/caseAnalysis";
import type { Case } from "../lib/caseStore";
import { migrationsReady } from "../lib/db";

(async () => {
  await migrationsReady;
  const { caseData, photo } = workerData as { caseData: Case; photo: string };
  await reanalyzePhoto(caseData, photo);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("analyzePhoto job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
