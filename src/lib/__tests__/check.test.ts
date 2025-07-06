import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(process.cwd(), "check-"));
  vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
  process.env.CHECK_ACCOUNT_NUMBER = "123456789";
  process.env.CHECK_ROUTING_NUMBER = "987654321";
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  process.env.CHECK_ACCOUNT_NUMBER = undefined;
  process.env.CHECK_ROUTING_NUMBER = undefined;
});

describe("createCheckPdf", () => {
  it("creates a PDF file", async () => {
    vi.resetModules();
    const { createCheckPdf } = await import("@/lib/check");
    const file = await createCheckPdf({
      payee: "State",
      amount: 12,
      checkNumber: "42",
    });
    expect(fs.existsSync(file)).toBe(true);
  });

  it("fails without config", async () => {
    process.env.CHECK_ACCOUNT_NUMBER = "";
    process.env.CHECK_ROUTING_NUMBER = "";
    vi.resetModules();
    await expect(
      (async () => {
        const { createCheckPdf } = await import("@/lib/check");
        await createCheckPdf({ payee: "x", amount: 1 });
      })(),
    ).rejects.toThrow();
  });
});
