import { EventEmitter } from "node:events";
import { parentPort } from "node:worker_threads";

const globalStore = globalThis as unknown as {
  caseEvents?: EventEmitter;
};

const emitter: EventEmitter = globalStore.caseEvents ?? new EventEmitter();

if (parentPort) {
  emitter.on("update", (data) => {
    parentPort?.postMessage({ event: "update", data });
  });
}

if (!globalStore.caseEvents) {
  globalStore.caseEvents = emitter;
}

export const caseEvents = emitter;
