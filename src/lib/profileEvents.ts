import { EventEmitter } from "node:events";
import { parentPort } from "node:worker_threads";

const globalStore = globalThis as unknown as { profileEvents?: EventEmitter };

const emitter: EventEmitter = globalStore.profileEvents ?? new EventEmitter();

if (parentPort) {
  emitter.on("update", (data) => {
    parentPort?.postMessage({ event: "profileUpdate", data });
  });
}

if (!globalStore.profileEvents) {
  globalStore.profileEvents = emitter;
}

export const profileEvents = emitter;
