import "@testing-library/jest-dom";
import { type TestContext, afterEach, beforeEach } from "vitest";

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
});

afterEach((context) => {
  const intercept = context.consoleIntercept;
  if (!intercept) return;
  const { originals, logs, warns, errors } = intercept;
  console.log = originals.log;
  console.warn = originals.warn;
  console.error = originals.error;

  if (context.task.result?.state === "fail") {
    for (const args of logs) originals.log(...args);
    for (const args of warns) originals.warn(...args);
    for (const args of errors) originals.error(...args);
  }
});
