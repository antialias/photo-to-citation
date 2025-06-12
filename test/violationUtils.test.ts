import { describe, expect, it } from "vitest";
import { hasViolation } from "../src/lib/caseUtils";

describe("hasViolation", () => {
  it("returns false for empty type", () => {
    expect(hasViolation({ violationType: "" })).toBe(false);
  });

  it("returns false for no violation phrases", () => {
    expect(hasViolation({ violationType: "none" })).toBe(false);
    expect(hasViolation({ violationType: "no violation detected" })).toBe(
      false,
    );
  });

  it("returns true for a real violation", () => {
    expect(hasViolation({ violationType: "parking" })).toBe(true);
  });
});
