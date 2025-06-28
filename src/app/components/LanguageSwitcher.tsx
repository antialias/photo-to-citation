"use client";
import i18n from "../../i18n";

export default function LanguageSwitcher() {
  return (
    <select
      className="border rounded p-1 text-sm bg-white dark:bg-gray-800"
      value={i18n.language}
      onChange={(e) => {
        const lang = e.target.value;
        document.cookie = `language=${lang}; path=/; max-age=31536000`;
        i18n.changeLanguage(lang);
      }}
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="fr">FR</option>
    </select>
  );
}
