export type LocalizedText = Record<string, string>;

export function getLocalizedText(
  map: LocalizedText,
  lang: string,
  fallback = "en",
): string | undefined {
  return map[lang] ?? map[fallback];
}

export function setLocalizedText(
  map: LocalizedText,
  lang: string,
  text: string,
): LocalizedText {
  return { ...map, [lang]: text };
}
