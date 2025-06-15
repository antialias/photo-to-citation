import crypto from "node:crypto";
import type { Worker } from "node:worker_threads";

interface Task {
  id: string;
  photo?: string;
  run: () => Promise<void>;
}

interface Queue {
  tasks: Task[];
  active?: Task;
  worker?: Worker;
}

const queues = new Map<string, Queue>();

function process(caseId: string) {
  const q = queues.get(caseId);
  if (!q || q.active || q.tasks.length === 0) return;
  const task = q.tasks.shift();
  if (!task) return;
  q.active = task;
  task
    .run()
    .catch((err) => console.error("analysis task failed", err))
    .finally(() => {
      q.active = undefined;
      process(caseId);
    });
}

export function enqueueTask(
  caseId: string,
  task: Omit<Task, "id"> & { photo?: string },
): string {
  const id = crypto.randomUUID();
  const q = queues.get(caseId) || { tasks: [] };
  q.tasks.push({ ...task, id });
  queues.set(caseId, q);
  process(caseId);
  return id;
}

export function removeQueuedPhoto(caseId: string, photo: string): boolean {
  const q = queues.get(caseId);
  if (!q) return false;
  const idx = q.tasks.findIndex((t) => t.photo === photo);
  if (idx !== -1) {
    q.tasks.splice(idx, 1);
    return true;
  }
  return false;
}

export function clearQueue(caseId: string): void {
  queues.delete(caseId);
}

export function isProcessing(caseId: string): boolean {
  const q = queues.get(caseId);
  return Boolean(q?.active);
}
