import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.json");
  vi.resetModules();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("vinLookup", () => {
  it("parses vin from html", async () => {
    const { parseVinFromHtml } = await import("../src/lib/vinLookup");
    const html = "<div>VIN: 1HGCM82633A004352</div>";
    expect(parseVinFromHtml(html)).toBe("1HGCM82633A004352");
  });

  it("fetches vin from website", async () => {
    const html = "<span>VIN 1HGCM82633A004352</span>";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    });
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const globalAny: any = global;
    const originalFetch = globalAny.fetch;
    globalAny.fetch = fetchMock;
    const { lookupVin } = await import("../src/lib/vinLookup");
    const vin = await lookupVin("ABC123", "IL");
    expect(fetchMock).toHaveBeenCalled();
    expect(vin).toBe("1HGCM82633A004352");
    globalAny.fetch = originalFetch;
  });

  it("updates a case with the fetched vin", async () => {
    const caseStore = await import("../src/lib/caseStore");
    const { createCase, updateCase, getCase } = caseStore;
    const vinLookup = await import("../src/lib/vinLookup");
    const { fetchCaseVin } = vinLookup;
    const html = "<p>VIN 1HGCM82633A004352</p>";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
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
    globalAny.fetch = originalFetch;
  });
});
