import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import type { Worker } from "node:worker_threads";

export type JobState =
  | "queued"
  | "running"
  | "complete"
  | "failed"
  | "canceled";

export interface Job {
  id: string;
  caseId: string;
  type: "analyzeCase" | "analyzePhoto";
  photo?: string;
  run: (job: Job) => Promise<void>;
  state: JobState;
  startedAt?: number;
  finishedAt?: number;
  worker?: Worker;
}

interface Queue {
  jobIds: string[];
  active?: string;
}

const queues = new Map<string, Queue>();
const jobs = new Map<string, Job>();
const jobCleanupTimers = new Map<string, NodeJS.Timeout>();

const JOB_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

function scheduleCleanup(id: string) {
  const existing = jobCleanupTimers.get(id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    jobs.delete(id);
    jobCleanupTimers.delete(id);
  }, JOB_RETENTION_MS);
  timer.unref();
  jobCleanupTimers.set(id, timer);
}

function pruneOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (job.finishedAt && now - job.finishedAt > JOB_RETENTION_MS) {
      jobs.delete(id);
      const t = jobCleanupTimers.get(id);
      if (t) clearTimeout(t);
      jobCleanupTimers.delete(id);
    }
  }
}

export const queueEvents = new EventEmitter();

function process(caseId: string) {
  const q = queues.get(caseId);
  if (!q || q.active || q.jobIds.length === 0) return;
  const jobId = q.jobIds.shift();
  if (!jobId) return;
  const job = jobs.get(jobId);
  if (!job) return;
  q.active = jobId;
  job.state = "running";
  job.startedAt = Date.now();
  queueEvents.emit("update", job);
  job
    .run(job)
    .then(() => {
      if (job.state === "running") job.state = "complete";
    })
    .catch((err) => {
      console.error("analysis task failed", err);
      job.state = "failed";
    })
    .finally(() => {
      job.worker = undefined;
      job.finishedAt = Date.now();
      queueEvents.emit("update", job);
      scheduleCleanup(job.id);
      q.active = undefined;
      process(caseId);
    });
}

export function enqueueJob(
  caseId: string,
  type: Job["type"],
  run: (job: Job) => Promise<void>,
  photo?: string,
): string {
  const id = crypto.randomUUID();
  const job: Job = {
    id,
    caseId,
    type,
    photo,
    run,
    state: "queued",
  };
  jobs.set(id, job);
  const q = queues.get(caseId) || { jobIds: [] };
  q.jobIds.push(id);
  queues.set(caseId, q);
  queueEvents.emit("update", job);
  process(caseId);
  return id;
}

export function removeQueuedPhoto(caseId: string, photo: string): boolean {
  const q = queues.get(caseId);
  if (!q) return false;
  const idx = q.jobIds.findIndex((jid) => jobs.get(jid)?.photo === photo);
  if (idx !== -1) {
    const [jid] = q.jobIds.splice(idx, 1);
    const j = jobs.get(jid);
    if (j) {
      j.state = "canceled";
      queueEvents.emit("update", j);
      scheduleCleanup(j.id);
    }
    return true;
  }
  return false;
}

export function clearQueue(caseId: string): void {
  const q = queues.get(caseId);
  if (!q) return;
  for (const jid of q.jobIds) {
    const j = jobs.get(jid);
    if (j) {
      j.state = "canceled";
      queueEvents.emit("update", j);
      scheduleCleanup(j.id);
    }
  }
  queues.delete(caseId);
}

export function isProcessing(caseId: string): boolean {
  pruneOldJobs();
  const q = queues.get(caseId);
  if (!q) return false;
  if (q.active) return true;
  return q.jobIds.some((jid) => jobs.get(jid)?.state === "queued");
}

export function listQueuedJobs(caseId?: string): Job[] {
  pruneOldJobs();
  const all = Array.from(jobs.values());
  return caseId ? all.filter((j) => j.caseId === caseId) : all;
}

export function getJob(id: string): Job | undefined {
  pruneOldJobs();
  return jobs.get(id);
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;
  if (job.state === "queued") {
    const q = queues.get(job.caseId);
    if (q) {
      const idx = q.jobIds.indexOf(id);
      if (idx !== -1) q.jobIds.splice(idx, 1);
    }
    job.state = "canceled";
    queueEvents.emit("update", job);
    scheduleCleanup(job.id);
    return true;
  }
  if (job.state === "running" && job.worker) {
    job.worker.terminate();
    job.state = "canceled";
    queueEvents.emit("update", job);
    scheduleCleanup(job.id);
    return true;
  }
  return false;
}
