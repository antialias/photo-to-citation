import { parentPort, workerData } from "node:worker_threads";
import { migrationsReady } from "@/lib/db";
import { reviewProfile } from "@/lib/profileReview";

(async () => {
  await migrationsReady;
  const { jobData } = workerData as { jobData: { userId: string } };
  await reviewProfile(jobData.userId);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("reviewProfile job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
