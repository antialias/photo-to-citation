import LoggedOutLanding from "@/app/LoggedOutLanding";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("hydration smoke test", () => {
  it("hydrates LoggedOutLanding without errors", async () => {
    const element = <LoggedOutLanding />;
    const html = renderToString(element);
    document.body.innerHTML = `<div id="root">${html}</div>`;
    const root = document.getElementById("root");
    if (!root) throw new Error("missing root element");
    const errors: unknown[][] = [];
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };
    hydrateRoot(root, element);
    await Promise.resolve();
    console.error = orig;
    expect(errors.length).toBe(0);
  });
});
