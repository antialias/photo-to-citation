import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { smokeEnv, smokePort } from "./smokeServer";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;

beforeAll(async () => {
  server = await startServer(smokePort, smokeEnv);
});

afterAll(async () => {
  await server.close();
});

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
  });
});
