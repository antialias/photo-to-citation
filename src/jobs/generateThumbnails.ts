import { parentPort, workerData } from "node:worker_threads";
import { generateThumbnails } from "@/lib/thumbnails";

(async () => {
  const { jobData } = workerData as {
    jobData: { buffer: ArrayBuffer; filename: string };
  };
  const buffer = Buffer.from(jobData.buffer);
  await generateThumbnails(buffer, jobData.filename);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("generateThumbnails job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
