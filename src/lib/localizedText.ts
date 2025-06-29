export function getLocalizedText(
  textMap: string | Record<string, string> | undefined,
  lang: string,
): { text: string; needsTranslation: boolean } {
  if (!textMap) return { text: "", needsTranslation: false };
  if (typeof textMap === "string")
    return { text: textMap, needsTranslation: false };
  const text = textMap[lang] ?? textMap.en ?? Object.values(textMap)[0] ?? "";
  return { text, needsTranslation: !(lang in textMap) };
}
export function normalizeLocalizedText(
  value: unknown,
  lang: string,
): Record<string, string> {
  if (!value) return {};
  if (typeof value === "string") return { [lang]: value };
  if (typeof value === "object") {
    const obj = value as Record<string, string>;
    const keys = Object.keys(obj);
    const known = ["en", "es", "fr"];
    if (keys.some((k) => known.includes(k))) return obj;
    if (keys.length === 1) return { [lang]: obj[keys[0]] };
    return obj;
  }
  return {};
}
