import type { TestServer } from "./startServer";
import { startServer } from "./startServer";

export async function globalSetup() {
  const server = await startServer();
  (globalThis as { server?: TestServer }).server = server;
}

export async function globalTeardown() {
  const server = (globalThis as { server?: TestServer }).server;
  if (server) {
    await server.close();
  }
}

export async function setup() {
  await globalSetup();
  return globalTeardown;
}
