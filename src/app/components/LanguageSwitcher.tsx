"use client";
import i18n from "../../i18n";

const FLAGS: Record<string, string> = {
  en: "\u{1F1FA}\u{1F1F8}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
};
const LABELS: Record<string, string> = {
  en: "English",
  es: "Espa\u00f1ol",
  fr: "Fran\u00e7ais",
};

export default function LanguageSwitcher({
  id,
  value = i18n.language,
  onChange,
}: {
  id?: string;
  value?: string;
  onChange?: (lang: string) => void;
}) {
  return (
    <select
      id={id}
      className="border rounded p-1 text-sm bg-white dark:bg-gray-800"
      value={value}
      onChange={(e) => {
        const lang = e.target.value;
        document.cookie = `language=${lang}; path=/; max-age=31536000`;
        i18n.changeLanguage(lang);
        onChange?.(lang);
      }}
    >
      <option value="en" aria-label={LABELS.en}>
        {FLAGS.en}
      </option>
      <option value="es" aria-label={LABELS.es}>
        {FLAGS.es}
      </option>
      <option value="fr" aria-label={LABELS.fr}>
        {FLAGS.fr}
      </option>
    </select>
  );
}
