"use client";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import i18n from "../../i18n";

export const FLAGS: Record<string, string> = {
  en: "\u{1F1FA}\u{1F1F8}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
};
export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Espa\u00f1ol",
  fr: "Fran\u00e7ais",
};

export default function LanguageSwitcher({
  id,
  value = i18n.language,
  onChange,
  immediate = true,
}: {
  id?: string;
  value?: string;
  onChange?: (lang: string) => void;
  immediate?: boolean;
}) {
  return (
    <select
      id={id}
      className={cx(
        "border rounded p-1 text-sm",
        css({ bg: token("colors.surface") }),
      )}
      value={value}
      onChange={(e) => {
        const lang = e.target.value;
        if (immediate) {
          document.cookie = `language=${lang}; path=/; max-age=31536000`;
          i18n.changeLanguage(lang);
        }
        onChange?.(lang);
      }}
    >
      <option value="en" aria-label={LANGUAGE_NAMES.en}>
        {FLAGS.en}
      </option>
      <option value="es" aria-label={LANGUAGE_NAMES.es}>
        {FLAGS.es}
      </option>
      <option value="fr" aria-label={LANGUAGE_NAMES.fr}>
        {FLAGS.fr}
      </option>
    </select>
  );
}
