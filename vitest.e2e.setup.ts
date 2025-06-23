import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";
import { type TestServer, startServer } from "./test/e2e/startServer";
import { createBaseEnv } from "./test/e2e/testEnv";

let server: TestServer;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-global-"));
  server = await startServer(3002, createBaseEnv(tmpDir));
  (globalThis as unknown as { server: TestServer }).server = server;
});

afterAll(async () => {
  await server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
