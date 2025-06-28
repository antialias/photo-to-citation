import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { config } from "@/lib/config";
import { sendSnailMail } from "@/lib/contactMethods";
import { snailMailProviders } from "@/lib/snailMail";

let tmpDir: string;
let root: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;
let createdPdf: { getPageCount(): number } | null;
let origUploadDir: string;

vi.mock("pdf-lib", () => {
  class StubPage {
    width = 600;
    height = 800;
    getSize() {
      return { width: this.width, height: this.height };
    }
    drawText() {}
    drawImage() {}
  }
  class StubImage {
    width = 100;
    height = 100;
    scale(f: number) {
      return { width: this.width * f, height: this.height * f };
    }
  }
  class StubPdf {
    pages: StubPage[] = [];
    static async create() {
      createdPdf = new StubPdf();
      return createdPdf;
    }
    addPage() {
      const p = new StubPage();
      this.pages.push(p);
      return p;
    }
    async embedFont() {
      return {
        widthOfTextAtSize() {
          return 50;
        },
      };
    }
    async embedPng() {
      return new StubImage();
    }
    async embedJpg() {
      return new StubImage();
    }
    getPageCount() {
      return this.pages.length;
    }
    async save() {
      return new Uint8Array();
    }
  }
  return { PDFDocument: StubPdf, StandardFonts: { Helvetica: "Helvetica" } };
});

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "snail-"));
  root = fs.mkdtempSync(path.join(os.tmpdir(), "snailroot-"));
  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);
  origUploadDir = config.UPLOAD_DIR;
  config.UPLOAD_DIR = path.join(root, "uploads");
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  const img = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/5+hHgAHggJ/P5V6XQAAAABJRU5ErkJggg==",
    "base64",
  );
  fs.writeFileSync(path.join(config.UPLOAD_DIR, "img.png"), img);
  process.env.RETURN_ADDRESS = "Me\n1 A St\nTown, ST 12345";
  process.env.SNAIL_MAIL_PROVIDER = "mock";
});

afterEach(() => {
  fs.rmSync(config.UPLOAD_DIR, {
    recursive: true,
    force: true,
  });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  cwdSpy.mockRestore();
  process.env.RETURN_ADDRESS = undefined;
  process.env.SNAIL_MAIL_PROVIDER = undefined;
  config.UPLOAD_DIR = origUploadDir;
  vi.restoreAllMocks();
});

describe("sendSnailMail attachments", () => {
  it("includes photo pages in generated PDF", async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: "1", status: "queued" });
    snailMailProviders.mock.send =
      mockSend as typeof snailMailProviders.mock.send;
    await sendSnailMail({
      address: "You\n2 B St\nSomewhere, ST 67890",
      subject: "Hello",
      body: "Body",
      attachments: ["/uploads/img.png"],
    });
    expect(mockSend).toHaveBeenCalled();
    expect(createdPdf?.getPageCount()).toBe(2);
  });
});
