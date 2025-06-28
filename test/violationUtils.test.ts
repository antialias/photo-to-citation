import { getBestViolationPhoto, hasViolation } from "@/lib/caseUtils";
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
