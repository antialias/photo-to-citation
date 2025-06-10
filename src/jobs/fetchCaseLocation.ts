import { parentPort, workerData } from "node:worker_threads";
import { fetchCaseLocation } from "../lib/caseLocation";
import type { Case } from "../lib/caseStore";

(async () => {
  const { jobData } = workerData as { jobData: unknown };
  await fetchCaseLocation(jobData as Case);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("fetchCaseLocation job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
