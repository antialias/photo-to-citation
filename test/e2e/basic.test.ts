import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

declare const server: import("./startServer").TestServer;

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
