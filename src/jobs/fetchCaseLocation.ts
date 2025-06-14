import { parentPort, workerData } from "node:worker_threads";
import { fetchCaseLocation } from "../lib/caseLocation";
import type { Case } from "../lib/caseStore";
import { migrationsReady } from "../lib/db";

(async () => {
  await migrationsReady;
  const { jobData } = workerData as { jobData: Case };
  await fetchCaseLocation(jobData);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("fetchCaseLocation job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
