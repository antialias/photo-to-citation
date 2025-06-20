import { parentPort, workerData } from "node:worker_threads";
import { sendSnailMail } from "@/lib/snailMail";
import type { SnailMailOptions } from "@/lib/snailMail";

(async () => {
  const { jobData } = workerData as {
    jobData: {
      providerId: string;
      opts: SnailMailOptions;
      config?: Record<string, unknown>;
    };
  };
  await sendSnailMail(jobData.providerId, jobData.opts, jobData.config);
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("sendSnailMail worker failed", err);
  if (parentPort) parentPort.postMessage("error");
});
