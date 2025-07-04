import { getCaseActionStatus } from "@/lib/caseActions";
import type { Case } from "@/lib/caseStore";
import { describe, expect, it } from "vitest";

const baseCase: Case = {
  id: "1",
  photos: [],
  photoTimes: {},
  photoGps: {},
  createdAt: "0",
  updatedAt: "0",
  public: false,
  sessionId: null,
  gps: null,
  streetAddress: null,
  intersection: null,
  vin: null,
  vinOverride: null,
  analysis: null,
  analysisOverrides: null,
  analysisStatus: "complete",
  analysisStatusCode: null,
  analysisError: null,
  analysisProgress: null,
  sentEmails: [],
  ownershipRequests: [],
  threadImages: [],
  closed: false,
  note: null,
  photoNotes: {},
  archived: false,
  violationOverride: null,
  violationOverrideReason: null,
};

describe("getCaseActionStatus", () => {
  it("disables ownership action after request", () => {
    const c: Case = {
      ...baseCase,
      ownershipRequests: [
        {
          moduleId: "il",
          requestedAt: "2024-01-01T00:00:00Z",
          checkNumber: null,
        },
      ],
    };
    const statuses = getCaseActionStatus(c);
    const ownership = statuses.find((s) => s.id === "ownership");
    const viewReq = statuses.find((s) => s.id === "view-ownership-request");
    expect(ownership?.applicable).toBe(false);
    expect(viewReq?.applicable).toBe(true);
  });
});
