import { beforeAll, describe, expect, it } from "vitest";

interface TestServer {
  url: string;
}

let server: TestServer;

beforeAll(() => {
  server = global.__E2E_SERVER__ as TestServer;
});

describe("point and shoot", () => {
  it("serves the point page", async () => {
    const res = await fetch(`${server.url}/point`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Take Picture");
  }, 30000);
});
