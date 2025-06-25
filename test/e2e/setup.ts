import { afterEach } from "vitest";

afterEach(async () => {
  const server = (
    globalThis as unknown as { testServer?: { reset: () => Promise<void> } }
  ).testServer;
  if (server) await server.reset();
});
