import { EventEmitter } from "node:events";

export interface Job<T = unknown> {
  id: number;
  data: T;
  priority: number;
}

export type Worker<T = unknown> = (job: Job<T>) => Promise<void> | void;

interface QueueEvents<T> {
  start: (job: Job<T>) => void;
  complete: (job: Job<T>) => void;
  error: (job: Job<T>, err: unknown) => void;
}

const emitter = new EventEmitter();

const queue: Job[] = [];
let processing = false;
let worker: Worker | null = null;
let nextId = 1;

function sortQueue() {
  queue.sort((a, b) => b.priority - a.priority);
}

async function processQueue() {
  if (processing || !worker) return;
  const job = queue.shift();
  if (!job) return;
  processing = true;
  emitter.emit("start", job);
  try {
    await worker(job);
    emitter.emit("complete", job);
  } catch (err) {
    emitter.emit("error", job, err);
  } finally {
    processing = false;
    processQueue();
  }
}

export function enqueue<T>(data: T, priority = 0): number {
  const job: Job<T> = { id: nextId++, data, priority };
  queue.push(job);
  sortQueue();
  processQueue();
  return job.id;
}

export function registerWorker<T>(fn: Worker<T>): void {
  worker = fn as Worker;
  processQueue();
}

export function on<T>(
  event: keyof QueueEvents<T>,
  cb: (...args: unknown[]) => void,
) {
  emitter.on(event, cb);
}
