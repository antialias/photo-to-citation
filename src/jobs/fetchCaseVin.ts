import { parentPort, workerData } from "node:worker_threads";
import type { Case } from "@/lib/caseStore";
import { migrationsReady } from "@/lib/db";
import { fetchCaseVin } from "@/lib/vinLookup";

(async () => {
  await migrationsReady();
  const { jobData } = workerData as { jobData: Case };
  await fetchCaseVin(jobData);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("fetchCaseVin job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
