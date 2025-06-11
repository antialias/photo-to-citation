import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.json");
  process.env.VIN_SOURCE_FILE = path.join(dataDir, "vinSources.json");
  const { defaultVinSources } = await import("../src/lib/vinSources");
  const statuses = defaultVinSources.map((s) => ({
    id: s.id,
    enabled: true,
    failureCount: 0,
  }));
  fs.writeFileSync(process.env.VIN_SOURCE_FILE, JSON.stringify(statuses));
  vi.resetModules();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
  process.env.VIN_SOURCE_FILE = undefined;
});

describe("vinLookup", () => {
  it("parses vin from html", async () => {
    const { parseVinFromHtml } = await import("../src/lib/vinLookup");
    const html = "<div><span id='v'>VIN: 1HGCM82633A004352</span></div>";
    expect(parseVinFromHtml(html, "#v")).toBe("1HGCM82633A004352");
  });

  it("fetches vin from website", async () => {
    const json = JSON.stringify({ vins: ["1HGCM82633A004352"] });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(json),
    });
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const globalAny: any = global;
    const originalFetch = globalAny.fetch;
    globalAny.fetch = fetchMock;
    const { lookupVin } = await import("../src/lib/vinLookup");
    const vin = await lookupVin("ABC123", "IL");
    expect(fetchMock).toHaveBeenCalled();
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1]?.method).toBe("POST");
    expect(vin).toBe("1HGCM82633A004352");
    globalAny.fetch = originalFetch;
  });

  it("logs request and response", async () => {
    const json = JSON.stringify({ vins: ["1HGCM82633A004352"] });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(json),
    });
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const globalAny: any = global;
    const originalFetch = globalAny.fetch;
    globalAny.fetch = fetchMock;
    const logSpy = vi.spyOn(console, "log");
    const { fetchCaseVin } = await import("../src/lib/vinLookup");
    const caseStore = await import("../src/lib/caseStore");
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
    await fetchCaseVin(current as caseStore.Case);
    expect(logSpy).toHaveBeenCalledWith(
      "VIN fetch successful",
      "1HGCM82633A004352",
    );
    globalAny.fetch = originalFetch;
    logSpy.mockRestore();
  });

  it("updates a case with the fetched vin", async () => {
    const caseStore = await import("../src/lib/caseStore");
    const { createCase, updateCase, getCase } = caseStore;
    const vinLookup = await import("../src/lib/vinLookup");
    const { fetchCaseVin } = vinLookup;
    const json = JSON.stringify({ vins: ["1HGCM82633A004352"] });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(json),
    });
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const globalAny: any = global;
    const originalFetch = globalAny.fetch;
    globalAny.fetch = fetchMock;
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
    globalAny.fetch = originalFetch;
  });

  it("falls back to the next source", async () => {
    const html1 = "no vin here";
    const html2 = "<div id='vin'>1HGCM82633A004352</div>";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html1) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(html2) });
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const globalAny: any = global;
    const originalFetch = globalAny.fetch;
    globalAny.fetch = fetchMock;
    const { lookupVin } = await import("../src/lib/vinLookup");
    const vin = await lookupVin("A", "B");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vin).toBe("1HGCM82633A004352");
    globalAny.fetch = originalFetch;
  });
});
