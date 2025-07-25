// @vitest-environment node
import { EventEmitter } from "node:events";
import type { Worker } from "node:worker_threads";
import type { Case } from "@/lib/caseStore";
import { beforeEach, describe, expect, it, vi } from "vitest";

const worker = new EventEmitter() as unknown as Worker;

const runJobMock = vi.fn(() => worker);
vi.mock("@/lib/jobScheduler", () => ({ runJob: runJobMock }));

describe("analyzeCaseInBackground", () => {
  beforeEach(() => {
    runJobMock.mockClear();
  });

  it("does not start a new worker when analysis is active", async () => {
    const mod = await import("@/lib/caseAnalysis");
    const { analyzeCaseInBackground, isCaseAnalysisActive } = mod;
    const c: Case = {
      id: "1",
      photos: ["/a.jpg"],
      photoTimes: { "/a.jpg": null },
      photoGps: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gps: null,
      streetAddress: null,
      intersection: null,
      vin: null,
      vinOverride: null,
      analysis: null,
      analysisOverrides: null,
      analysisStatus: "pending",
      analysisStatusCode: null,
      analysisError: null,
      analysisProgress: null,
      public: false,
      sentEmails: [],
      ownershipRequests: [],
      threadImages: [],
      note: null,
      photoNotes: { "/a.jpg": null },
    };
    analyzeCaseInBackground(c, "en");
    expect(runJobMock).toHaveBeenCalledTimes(1);
    expect(isCaseAnalysisActive(c.id)).toBe(true);

    analyzeCaseInBackground(c, "en");
    expect(runJobMock).toHaveBeenCalledTimes(1);

    worker.emit("exit");
    expect(isCaseAnalysisActive(c.id)).toBe(false);
  });
});
