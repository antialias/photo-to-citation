"use client";
import i18n from "../../i18n";

export default function LanguageSwitcher() {
  return (
    <select
      className="border rounded p-1 text-sm bg-white dark:bg-gray-800"
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="fr">FR</option>
    </select>
  );
}
