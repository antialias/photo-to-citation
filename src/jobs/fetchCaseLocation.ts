import { parentPort, workerData } from "node:worker_threads";
import { fetchCaseLocation } from "../lib/caseLocation";

(async () => {
  await fetchCaseLocation(workerData);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("fetchCaseLocation job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
