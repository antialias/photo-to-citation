import { getModelYearFromVin } from "@/lib/vin";
import { describe, expect, it } from "vitest";

describe("getModelYearFromVin", () => {
  it("decodes model year", () => {
    expect(getModelYearFromVin("1HGCM82633A004352")).toBe("2003");
    expect(getModelYearFromVin("1HGCM8263AA004352")).toBe("2010");
  });
});
