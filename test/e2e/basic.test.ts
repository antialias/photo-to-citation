import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;

beforeAll(async () => {
  server = await startServer();
}, 30000);

afterAll(async () => {
  await server.close();
}, 30000);

describe.skip("end-to-end", () => {
  it("serves the homepage", async () => {
    const res = await fetch(`${server.url}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Cases");
  }, 30000);
});
