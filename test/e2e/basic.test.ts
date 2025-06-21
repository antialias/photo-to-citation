import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
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
    const html = await res.text();
    const dom = new JSDOM(html);
    const heading = getByRole(dom.window.document, "heading", {
      name: /photo to citation/i,
    });
    expect(heading).toBeTruthy();
  }, 30000);
});
