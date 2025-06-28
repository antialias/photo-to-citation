"use client";
import type { ReactElement } from "react";

export default function TranslateIcon({
  lang,
  className = "",
}: {
  lang: string;
  className?: string;
}): ReactElement {
  const flags: Record<string, string> = {
    en: "\uD83C\uDDFA\uD83C\uDDF8", // 🇺🇸
    es: "\uD83C\uDDEA\uD83C\uDDF8", // 🇪🇸
    fr: "\uD83C\uDDEB\uD83C\uDDF7", // 🇫🇷
  };
  const flag = flags[lang] ?? "\uD83C\uDFF3\uFE0F"; // 🏳️
  return (
    <span
      className={`inline-flex items-center ${className}`}
      aria-hidden="true"
    >
      <span className="mr-0.5">\u2192</span>
      <span>{flag}</span>
    </span>
  );
}
