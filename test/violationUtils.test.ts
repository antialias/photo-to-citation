import type { Case } from "@/lib/caseStore";
import {
  getBestViolationPhoto,
  hasCaseViolation,
  hasViolation,
} from "@/lib/caseUtils";
import { describe, expect, it } from "vitest";

describe("hasViolation", () => {
  it("detects violation from image flags", () => {
    expect(
      hasViolation({
        violationType: "",
        details: { en: "" },
        vehicle: {},
        images: { a: { representationScore: 1, violation: true } },
      }),
    ).toBe(true);
  });

  it("detects absence when all flags false", () => {
    expect(
      hasViolation({
        violationType: "",
        details: { en: "" },
        vehicle: {},
        images: { a: { representationScore: 1, violation: false } },
      }),
    ).toBe(false);
  });

  it("falls back to violationType when flags missing", () => {
    expect(
      hasViolation({
        violationType: "parking",
        details: { en: "" },
        vehicle: {},
        images: {},
      }),
    ).toBe(true);
    expect(
      hasViolation({
        violationType: "",
        details: { en: "" },
        vehicle: {},
        images: {},
      }),
    ).toBe(false);
  });
});

describe("hasCaseViolation", () => {
  it("uses override when present", () => {
    const c: Case = {
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
      violationOverride: true,
      violationOverrideReason: "",
      sentEmails: [],
      ownershipRequests: [],
      threadImages: [],
      closed: false,
      note: null,
      photoNotes: {},
      archived: false,
    };
    expect(hasCaseViolation(c)).toBe(true);
  });
});

describe("getBestViolationPhoto", () => {
  it("returns best matching photo and caption", () => {
    const result = getBestViolationPhoto({
      photos: ["/a.jpg", "/b.jpg"],
      analysis: {
        violationType: "parking",
        details: { en: "" },
        vehicle: {},
        images: {
          "a.jpg": {
            representationScore: 0.4,
            violation: true,
            highlights: { en: "a caption" },
          },
          "b.jpg": {
            representationScore: 0.9,
            violation: true,
            highlights: { en: "best caption" },
          },
        },
      },
    });
    expect(result).toEqual({ photo: "/b.jpg", caption: "best caption" });
  });

  it("returns null when no violation images", () => {
    const result = getBestViolationPhoto({
      photos: ["/a.jpg"],
      analysis: {
        violationType: "parking",
        details: { en: "" },
        vehicle: {},
        images: {
          "a.jpg": { representationScore: 0.5, violation: false },
        },
      },
    });
    expect(result).toBeNull();
  });
});
