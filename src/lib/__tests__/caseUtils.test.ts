import { describe, expect, it } from "vitest";
import type { Case } from "../caseStore";
import { getViolationPhoto } from "../caseUtils";

describe("getViolationPhoto", () => {
  it("returns best violation photo and caption", () => {
    const caseData = {
      id: "1",
      photos: ["/a.jpg", "/b.jpg"],
      photoTimes: {},
      createdAt: "",
      analysis: {
        images: {
          "a.jpg": {
            representationScore: 0.5,
            violation: true,
            highlights: "a",
          },
          "b.jpg": {
            representationScore: 0.8,
            violation: true,
            highlights: "b",
          },
        },
      },
    } as unknown as Case;
    expect(getViolationPhoto(caseData)).toEqual({
      photo: "/b.jpg",
      caption: "b",
    });
  });

  it("returns null when no violation images", () => {
    const caseData = {
      id: "1",
      photos: ["/a.jpg"],
      photoTimes: {},
      createdAt: "",
      analysis: {
        images: { "a.jpg": { representationScore: 0.5, violation: false } },
      },
    } as unknown as Case;
    expect(getViolationPhoto(caseData)).toBeNull();
  });
});
