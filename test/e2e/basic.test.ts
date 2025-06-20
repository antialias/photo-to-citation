import { beforeAll, describe, expect, it } from "vitest";

interface TestServer {
  url: string;
}

let server: TestServer;

beforeAll(() => {
  server = global.__E2E_SERVER__ as TestServer;
});

describe("end-to-end", () => {
  it("serves the homepage", async () => {
    const res = await fetch(`${server.url}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Photo To Citation");
  }, 30000);
});
