import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;

beforeAll(async () => {
  server = await startServer(3005, {
    NEXTAUTH_SECRET: "secret",
  });
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("point and shoot", () => {
  it("serves the point page", async () => {
    const res = await fetch(`${server.url}/point`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Take Picture");
  }, 30000);
});
