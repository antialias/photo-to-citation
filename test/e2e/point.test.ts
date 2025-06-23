import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

declare const server: import("./startServer").TestServer;

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
  });
});
