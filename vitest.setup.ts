import "@testing-library/jest-dom";
import React, { type ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, vi } from "vitest";

if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (
    window as unknown as { ResizeObserver: typeof ResizeObserver }
  ).ResizeObserver = ResizeObserver;
  (
    globalThis as unknown as { ResizeObserver: typeof ResizeObserver }
  ).ResizeObserver = ResizeObserver;
}

// Ensure stable auth configuration during tests
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.VITEST = "1";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", props),
}));

let originalGetUserMedia:
  | ((constraints: MediaStreamConstraints) => Promise<MediaStream>)
  | undefined;

declare module "vitest" {
  interface TestContext {
    consoleIntercept?: {
      logs: unknown[][];
      warns: unknown[][];
      errors: unknown[][];
      originals: {
        log: typeof console.log;
        warn: typeof console.warn;
        error: typeof console.error;
      };
    };
  }
}

beforeEach((context) => {
  const originals = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  context.consoleIntercept = {
    logs: [],
    warns: [],
    errors: [],
    originals,
  };
  console.log = (...args: unknown[]) => {
    context.consoleIntercept?.logs.push(args);
  };
  console.warn = (...args: unknown[]) => {
    context.consoleIntercept?.warns.push(args);
  };
  console.error = (...args: unknown[]) => {
    context.consoleIntercept?.errors.push(args);
  };

  if (typeof navigator !== "undefined") {
    originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    if (!navigator.mediaDevices) {
      (navigator as unknown as { mediaDevices: MediaDevices }).mediaDevices =
        {} as MediaDevices;
    }
    navigator.mediaDevices.getUserMedia = vi.fn(async () => new MediaStream());
  }
});

afterEach((context) => {
  const intercept = context.consoleIntercept;
  if (!intercept) return;
  const { originals, logs, warns, errors } = intercept;
  console.log = originals.log;
  console.warn = originals.warn;
  console.error = originals.error;

  if (typeof navigator !== "undefined") {
    if (originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    } else if (navigator.mediaDevices) {
      (
        navigator.mediaDevices as unknown as Record<string, unknown>
      ).getUserMedia = undefined;
    }
  }

  if (context.task.result?.state === "fail") {
    for (const args of logs) originals.log(...args);
    for (const args of warns) originals.warn(...args);
    for (const args of errors) originals.error(...args);
  }
});
