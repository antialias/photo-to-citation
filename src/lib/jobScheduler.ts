import path from "node:path";
import { Worker } from "node:worker_threads";
import { caseEvents } from "./caseEvents";

export function runJob(name: string, jobData: unknown): Worker {
  const jobPath = path.join(process.cwd(), "src", "jobs", `${name}.ts`);
  const wrapper = path.join(process.cwd(), "src", "jobs", "workerWrapper.js");
  const worker = new Worker(wrapper, {
    workerData: { path: jobPath, jobData },
  });
  worker.on("message", (msg) => {
    if (msg && msg.event === "update") {
      caseEvents.emit("update", msg.data);
    }
  });
  worker.on("error", (err) => {
    console.error(`${name} worker failed`, err);
  });
  return worker;
}
