import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
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
    const html = await res.text();
    const dom = new JSDOM(html);
    const button = getByRole(dom.window.document, "button", {
      name: /take picture/i,
    });
    expect(button).toBeTruthy();
  }, 30000);
});
