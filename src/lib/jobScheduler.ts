import path from "node:path";
import { Worker } from "node:worker_threads";
import { caseEvents } from "./caseEvents";
import { jobEvents } from "./jobEvents";

interface TrackedJob {
  type: string;
  worker: Worker;
  startedAt: number;
  caseId?: string;
}

const globalStore = globalThis as unknown as {
  activeJobs?: Map<number, TrackedJob>;
  auditTimer?: NodeJS.Timer;
  lastAudit?: number;
  lastUpdate?: number;
};

export const activeJobs: Map<number, TrackedJob> =
  globalStore.activeJobs ?? new Map();

if (!globalStore.activeJobs) {
  globalStore.activeJobs = activeJobs;
}

let lastAudit = globalStore.lastAudit ?? 0;
let lastUpdate = globalStore.lastUpdate ?? Date.now();

function auditJobs() {
  lastAudit = Date.now();
  let changed = false;
  for (const [id, job] of activeJobs) {
    if (job.worker.threadId === -1) {
      activeJobs.delete(id);
      changed = true;
    }
  }
  if (changed) {
    lastUpdate = lastAudit;
    jobEvents.emit("update", listJobs(undefined, undefined, true));
  }
  globalStore.lastAudit = lastAudit;
  globalStore.lastUpdate = lastUpdate;
}

if (!globalStore.auditTimer) {
  globalStore.auditTimer = setInterval(auditJobs, 30_000);
  globalStore.auditTimer.unref();
}

export function listJobs(type?: string, caseId?: string, skipAudit = false) {
  if (!skipAudit) auditJobs();
  const jobs = Array.from(activeJobs.values()).map((j) => ({
    id: j.worker.threadId,
    type: j.type,
    startedAt: j.startedAt,
    caseId: j.caseId,
  }));
  let filtered = type ? jobs.filter((j) => j.type === type) : jobs;
  if (caseId) filtered = filtered.filter((j) => j.caseId === caseId);
  return {
    jobs: filtered,
    auditedAt: lastAudit,
    updatedAt: lastUpdate,
  };
}

export function runJob(
  name: string,
  jobData: unknown,
  opts?: { caseId?: string },
): Worker {
  const isProd = process.env.NODE_ENV === "production";
  const jobPath = isProd
    ? path.join(process.cwd(), "dist", "jobs", `${name}.js`)
    : path.join(process.cwd(), "src", "jobs", `${name}.ts`);
  const worker = isProd
    ? new Worker(jobPath, { workerData: { jobData } })
    : new Worker(path.join(process.cwd(), "src", "jobs", "workerWrapper.js"), {
        workerData: { path: jobPath, jobData },
      });
  activeJobs.set(worker.threadId, {
    type: name,
    worker,
    startedAt: Date.now(),
    caseId: opts?.caseId,
  });
  lastUpdate = Date.now();
  globalStore.lastUpdate = lastUpdate;
  jobEvents.emit("update", listJobs());
  worker.on("message", (msg) => {
    if (msg && msg.event === "update") {
      caseEvents.emit("update", msg.data);
    }
  });
  worker.on("error", (err) => {
    console.error(`${name} worker failed`, err);
  });
  const cleanup = () => {
    activeJobs.delete(worker.threadId);
    lastUpdate = Date.now();
    globalStore.lastUpdate = lastUpdate;
    jobEvents.emit("update", listJobs());
  };
  worker.once("exit", cleanup);
  worker.once("error", cleanup);
  return worker;
}

export { auditJobs, lastAudit, lastUpdate };
