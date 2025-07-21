import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

interface Job<T> {
  id: string;
  data: T;
  priority: number;
}

type Worker<T> = (data: T) => Promise<void> | void;

const emitter = new EventEmitter();
const queue: Job<unknown>[] = [];
let worker: Worker<unknown> | undefined;
let running = false;

function processQueue(): void {
  if (running || !worker) return;
  const job = queue.shift();
  if (!job) {
    emitter.emit("idle");
    return;
  }
  running = true;
  emitter.emit("start", job.data);
  Promise.resolve(worker(job.data))
    .then(() => {
      emitter.emit("done", job.data);
    })
    .catch((err) => {
      emitter.emit("error", err);
    })
    .finally(() => {
      running = false;
      processQueue();
    });
}

export function enqueue<T>(data: T, priority = 0): string {
  const job: Job<T> = { id: randomUUID(), data, priority };
  const idx = queue.findIndex((j) => priority > j.priority);
  if (idx === -1) queue.push(job);
  else queue.splice(idx, 0, job);
  emitter.emit("enqueue", data);
  processQueue();
  return job.id;
}

export function registerWorker<T>(fn: Worker<T>): void {
  worker = fn as Worker<unknown>;
  processQueue();
}

export function on(
  event: string,
  listener: (...args: unknown[]) => void,
): void {
  emitter.on(event, listener);
}
