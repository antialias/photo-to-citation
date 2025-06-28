"use client";
import { FaArrowRight } from "react-icons/fa";

const FLAGS: Record<string, string> = {
  en: "\u{1F1FA}\u{1F1F8}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
};

export default function TranslateIcon({ lang }: { lang: string }) {
  const flag = FLAGS[lang] ?? "\u{1F3F3}\u{FE0F}";
  return (
    <span className="inline-flex items-center text-xs">
      <FaArrowRight className="mr-0.5" />
      <span aria-label={lang}>{flag}</span>
    </span>
  );
}
