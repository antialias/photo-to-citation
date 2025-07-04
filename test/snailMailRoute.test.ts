import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "smail-"));
  process.env.SNAIL_MAIL_FILE = path.join(tmpDir, "snailMail.json");
  vi.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.env.SNAIL_MAIL_FILE = undefined;
  vi.restoreAllMocks();
});

describe("snail mail API", () => {
  it("lists mails for current user with filters", async () => {
    const store = await import("@/lib/snailMailStore");
    store.addSentMail({
      id: "1",
      providerId: "mock",
      providerMessageId: "p1",
      caseId: "c1",
      userId: "u1",
      to: {
        address1: "a",
        city: "b",
        state: "c",
        postalCode: "1",
      },
      from: {
        address1: "a",
        city: "b",
        state: "c",
        postalCode: "1",
      },
      contents: "f.pdf",
      status: "queued",
      sentAt: new Date().toISOString(),
    });
    const mod = await import("@/app/api/snail-mail/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}) as Promise<Record<string, string>>,
      session: { user: { id: "u1", role: "user" } },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toHaveLength(1);

    const resFiltered = await mod.GET(new Request("http://test?caseId=other"), {
      params: Promise.resolve({}) as Promise<Record<string, string>>,
      session: { user: { id: "u1", role: "user" } },
    });
    expect(resFiltered.status).toBe(200);
    const dataFiltered = (await resFiltered.json()) as unknown[];
    expect(dataFiltered).toHaveLength(0);
  });
});
