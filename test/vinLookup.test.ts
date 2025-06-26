import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Case } from "@/lib/caseStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  process.env.VIN_SOURCE_FILE = path.join(dataDir, "vinSources.json");
  const { defaultVinSources } = await import("@/lib/vinSources");
  const statuses = defaultVinSources.map((s) => ({
    id: s.id,
    enabled: true,
    failureCount: 0,
  }));
  fs.writeFileSync(process.env.VIN_SOURCE_FILE, JSON.stringify(statuses));
  vi.resetModules();
  const dbModule = await import("@/lib/db");
  await dbModule.migrationsReady;
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
  process.env.VIN_SOURCE_FILE = undefined;
});

describe("vinLookup", () => {
  it("parses vin from html", async () => {
    const { parseVinFromHtml } = await import("@/lib/vinLookup");
    const html = "<div><span id='v'>VIN: 1HGCM82633A004352</span></div>";
    expect(parseVinFromHtml(html, "#v")).toBe("1HGCM82633A004352");
  });

  it("fetches vin from website", async () => {
    const json = JSON.stringify({ vins: ["1HGCM82633A004352"] });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(json),
    });
    const globalWithFetch = global as typeof globalThis & {
      fetch: typeof fetch;
    };
    const originalFetch = globalWithFetch.fetch;
    globalWithFetch.fetch = fetchMock as unknown as typeof fetch;
    const { lookupVin } = await import("@/lib/vinLookup");
    const vin = await lookupVin("ABC123", "IL");
    expect(fetchMock).toHaveBeenCalled();
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1]?.method).toBe("POST");
    expect(vin).toBe("1HGCM82633A004352");
    globalWithFetch.fetch = originalFetch;
  });

  it("logs request and response", async () => {
    const json = JSON.stringify({ vins: ["1HGCM82633A004352"] });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(json),
    });
    const globalWithFetch = global as typeof globalThis & {
      fetch: typeof fetch;
    };
    const originalFetch = globalWithFetch.fetch;
    globalWithFetch.fetch = fetchMock as unknown as typeof fetch;
    const logSpy = vi.spyOn(console, "log");
    const { fetchCaseVin } = await import("@/lib/vinLookup");
    const caseStore = await import("@/lib/caseStore");
    const c = caseStore.createCase("/x.jpg");
    caseStore.updateCase(c.id, {
      analysis: {
        violationType: "",
        details: "",
        vehicle: { licensePlateNumber: "ABC123", licensePlateState: "IL" },
        images: {},
      },
    });
    const current = caseStore.getCase(c.id);
    await fetchCaseVin(current as Case);
    expect(logSpy).toHaveBeenCalledWith(
      "VIN fetch successful",
      "1HGCM82633A004352",
    );
    globalWithFetch.fetch = originalFetch;
    logSpy.mockRestore();
  });

  it("updates a case with the fetched vin", async () => {
    const caseStore = await import("@/lib/caseStore");
    const { createCase, updateCase, getCase } = caseStore;
    const vinLookup = await import("@/lib/vinLookup");
    const { fetchCaseVin } = vinLookup;
    const json = JSON.stringify({ vins: ["1HGCM82633A004352"] });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(json),
    });
    const globalWithFetch2 = global as typeof globalThis & {
      fetch: typeof fetch;
    };
    const originalFetch = globalWithFetch2.fetch;
    globalWithFetch2.fetch = fetchMock as unknown as typeof fetch;
    const c = createCase("/foo.jpg");
    updateCase(c.id, {
      analysis: {
        violationType: "", // minimal
        details: "",
        vehicle: { licensePlateNumber: "ABC123", licensePlateState: "IL" },
        images: {},
      },
    });
    const current = getCase(c.id) as typeof c;
    await fetchCaseVin(current);
    const final = getCase(c.id);
    expect(final?.vin).toBe("1HGCM82633A004352");
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1]?.method).toBe("POST");
    globalWithFetch2.fetch = originalFetch;
  });

  it("falls back to the next source", async () => {
    const html1 = "no vin here";
    const html2 = "<div id='vin'>1HGCM82633A004352</div>";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html1) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html2) });
    const globalWithFetch3 = global as typeof globalThis & {
      fetch: typeof fetch;
    };
    const originalFetch = globalWithFetch3.fetch;
    globalWithFetch3.fetch = fetchMock as unknown as typeof fetch;
    const { lookupVin } = await import("@/lib/vinLookup");
    const vin = await lookupVin("A", "B");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vin).toBe("1HGCM82633A004352");
    globalWithFetch3.fetch = originalFetch;
  });
});
