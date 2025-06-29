import LoggedOutLanding from "@/app/LoggedOutLanding";
import I18nProvider from "@/app/i18n-provider";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("i18n hydration smoke test", () => {
  it("hydrates LoggedOutLanding with I18nProvider without errors", async () => {
    const element = (
      <I18nProvider lang="en">
        <LoggedOutLanding />
      </I18nProvider>
    );
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
