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
