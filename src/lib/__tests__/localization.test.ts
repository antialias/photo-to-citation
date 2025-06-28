import { describe, expect, it } from "vitest";
import { getLocalizedText, setLocalizedText } from "../localization";

describe("localization helpers", () => {
  it("falls back to default language", () => {
    const t = { en: "hi" };
    expect(getLocalizedText(t, "es", "en")).toBe("hi");
  });

  it("updates localized text", () => {
    const t = setLocalizedText({ en: "hi" }, "es", "hola");
    expect(t.es).toBe("hola");
  });
});
