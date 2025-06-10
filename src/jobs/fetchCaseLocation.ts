import { parentPort, workerData } from "node:worker_threads";
import { fetchCaseLocation } from "../lib/caseLocation";

(async () => {
  const { jobData } = workerData as { jobData: unknown };
  await fetchCaseLocation(jobData as any);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("fetchCaseLocation job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
