import { describe, expect, it } from "vitest";

describe("citationStatusModules", () => {
  it("returns a mock status", async () => {
    const { citationStatusModules } = await import(
      "@/lib/citationStatusModules"
    );
    const result = await citationStatusModules.mock.lookupCitationStatus(
      "IL",
      "Cook",
      "12345",
    );
    expect(result?.status).toContain("pending");
  });
});
