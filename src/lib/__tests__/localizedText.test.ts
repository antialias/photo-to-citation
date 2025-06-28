import { describe, expect, it } from "vitest";
import { getLocalizedText } from "../localizedText";

describe("getLocalizedText", () => {
  it("returns string directly", () => {
    const result = getLocalizedText("hello", "en");
    expect(result).toEqual({ text: "hello", needsTranslation: false });
  });

  it("picks matching language", () => {
    const result = getLocalizedText({ en: "hi", es: "hola" }, "es");
    expect(result).toEqual({ text: "hola", needsTranslation: false });
  });

  it("falls back and marks translation needed", () => {
    const result = getLocalizedText({ en: "hi" }, "fr");
    expect(result).toEqual({ text: "hi", needsTranslation: true });
  });
});
