export interface LocalizedText {
  [lang: string]: string;
}

export function getLocalizedText(
  text: LocalizedText | undefined,
  lang: string,
  defaultLang = "en",
): string {
  if (!text) return "";
  return text[lang] ?? text[defaultLang] ?? "";
}

export function setLocalizedText(
  text: LocalizedText | undefined,
  lang: string,
  value: string,
): LocalizedText {
  return { ...(text ?? {}), [lang]: value };
}
