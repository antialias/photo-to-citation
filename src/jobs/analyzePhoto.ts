import { parentPort, workerData } from "node:worker_threads";
import { reanalyzePhoto } from "@/lib/caseAnalysis";
import type { Case } from "@/lib/caseStore";
import { updateCase } from "@/lib/caseStore";
import { migrationsReady } from "@/lib/db";
import { getUnleash } from "@/lib/unleash";

(async () => {
  await migrationsReady;
  if (!getUnleash().isEnabled("photo-analysis")) {
    if (parentPort) parentPort.postMessage("done");
    const { jobData } = workerData as { jobData: { caseData: Case } };
    updateCase(jobData.caseData.id, {
      analysisStatus: "complete",
      analysisStatusCode: 204,
    });
    return;
  }
  const { jobData } = workerData as {
    jobData: { caseData: Case; photo: string; lang: string };
  };
  await reanalyzePhoto(jobData.caseData, jobData.photo, jobData.lang);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("analyzePhoto job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
