import { describe, expect, it } from "vitest";
import { getBestViolationPhoto, hasViolation } from "../src/lib/caseUtils";

describe("hasViolation", () => {
  it("detects violation from image flags", () => {
    expect(
      hasViolation({
        violationType: "",
        details: "",
        vehicle: {},
        images: { a: { representationScore: 1, violation: true } },
      }),
    ).toBe(true);
  });

  it("detects absence when all flags false", () => {
    expect(
      hasViolation({
        violationType: "",
        details: "",
        vehicle: {},
        images: { a: { representationScore: 1, violation: false } },
      }),
    ).toBe(false);
  });

  it("falls back to violationType when flags missing", () => {
    expect(
      hasViolation({ violationType: "parking", details: "", vehicle: {} }),
    ).toBe(true);
    expect(hasViolation({ violationType: "", details: "", vehicle: {} })).toBe(
      false,
    );
  });
});

describe("getBestViolationPhoto", () => {
  it("returns best matching photo and caption", () => {
    const result = getBestViolationPhoto({
      photos: ["/a.jpg", "/b.jpg"],
      analysis: {
        violationType: "parking",
        details: "",
        vehicle: {},
        images: {
          "a.jpg": {
            representationScore: 0.4,
            violation: true,
            highlights: "a caption",
          },
          "b.jpg": {
            representationScore: 0.9,
            violation: true,
            highlights: "best caption",
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
        details: "",
        vehicle: {},
        images: {
          "a.jpg": { representationScore: 0.5, violation: false },
        },
      },
    });
    expect(result).toBeNull();
  });
});
