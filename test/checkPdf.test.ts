import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let root: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;

vi.mock("pdf-lib", () => {
  class StubPage {
    drawText() {}
  }
  class StubPdf {
    pages: StubPage[] = [];
    static async create() {
      return new StubPdf();
    }
    addPage() {
      const p = new StubPage();
      this.pages.push(p);
      return p;
    }
    async embedFont() {
      return {};
    }
    async save() {
      return new Uint8Array();
    }
  }
  return { PDFDocument: StubPdf, StandardFonts: { Helvetica: "Helvetica" } };
});

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "check-"));
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);
  process.env.CHECK_ACCOUNT_NUMBER = "123456";
  process.env.CHECK_ROUTING_NUMBER = "987654";
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  cwdSpy.mockRestore();
  process.env.CHECK_ACCOUNT_NUMBER = undefined;
  process.env.CHECK_ROUTING_NUMBER = undefined;
  vi.restoreAllMocks();
});

describe("createCheckPdf", () => {
  it("writes a pdf file", async () => {
    const { createCheckPdf } = await import("@/lib/checkPdf");
    const out = await createCheckPdf({
      payee: "Test",
      amount: 1,
      checkNumber: "42",
    });
    expect(fs.existsSync(out)).toBe(true);
  });
});
