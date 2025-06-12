import { describe, expect, it } from "vitest";
import { hasViolation } from "../src/lib/caseUtils";

describe("hasViolation", () => {
  it("detects violation from image flags", () => {
    expect(
      hasViolation({
        violationType: "",
        images: { a: { representationScore: 1, violation: true } },
      }),
    ).toBe(true);
  });

  it("detects absence when all flags false", () => {
    expect(
      hasViolation({
        violationType: "",
        images: { a: { representationScore: 1, violation: false } },
      }),
    ).toBe(false);
  });

  it("falls back to violationType when flags missing", () => {
    expect(hasViolation({ violationType: "parking" })).toBe(true);
    expect(hasViolation({ violationType: "" })).toBe(false);
  });
});
