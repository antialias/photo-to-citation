import { describe, expect, it } from "vitest";
import { getViolationTime } from "../src/lib/caseReport";
import type { Case } from "../src/lib/caseStore";

const baseCase: Case = {
  id: "1",
  photos: ["/a.jpg", "/b.jpg"],
  photoTimes: {
    "/a.jpg": "2020-01-01T00:00:00.000Z",
    "/b.jpg": "2020-01-02T00:00:00.000Z",
  },
  createdAt: "2020-01-03T00:00:00.000Z",
  gps: null,
  streetAddress: null,
  intersection: null,
  analysis: null,
  analysisOverrides: null,
  analysisStatus: "complete",
  analysisStatusCode: null,
};

describe("getViolationTime", () => {
  it("returns time from highest scoring photo", () => {
    const c: Case = {
      ...baseCase,
      analysis: {
        violationType: "foo",
        details: "bar",
        location: "",
        vehicle: {},
        images: {
          "a.jpg": { representationScore: 0.4 },
          "b.jpg": { representationScore: 0.9 },
        },
      },
    };
    const t = getViolationTime(c);
    expect(t).toBe("2020-01-02T00:00:00.000Z");
  });

  it("returns null when photo time missing", () => {
    const c: Case = {
      ...baseCase,
      photoTimes: {},
      analysis: {
        violationType: "foo",
        details: "bar",
        location: "",
        vehicle: {},
        images: { "a.jpg": { representationScore: 0.5 } },
      },
    };
    const t = getViolationTime(c);
    expect(t).toBeNull();
  });
});
