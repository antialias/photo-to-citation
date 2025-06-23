import { EventEmitter } from "node:events";
import { parentPort } from "node:worker_threads";

const globalStore = globalThis as unknown as {
  jobEvents?: EventEmitter;
};

const emitter: EventEmitter = globalStore.jobEvents ?? new EventEmitter();

if (parentPort) {
  emitter.on("update", (data) => {
    parentPort?.postMessage({ event: "jobUpdate", data });
  });
}

if (!globalStore.jobEvents) {
  globalStore.jobEvents = emitter;
}

export const jobEvents = emitter;
