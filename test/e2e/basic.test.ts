import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;

beforeAll(async () => {
  server = await startServer(3002, {
    NEXTAUTH_SECRET: "secret",
  });
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("end-to-end @smoke", () => {
  it("serves the homepage", async () => {
    const res = await fetch(`${server.url}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Photo To Citation");
  }, 30000);
});
