"use client";
import { useMemo } from "react";
import { FaArrowRight, FaSyncAlt } from "react-icons/fa";

const FLAGS: Record<string, string> = {
  en: "\u{1F1FA}\u{1F1F8}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
};

export default function TranslateIcon({
  lang,
  loading = false,
  error = false,
}: {
  lang: string;
  loading?: boolean;
  error?: boolean;
}) {
  const flag = useMemo(() => FLAGS[lang] ?? "\u{1F3F3}\u{FE0F}", [lang]);
  const ArrowIcon = error ? FaSyncAlt : FaArrowRight;
  return (
    <span className="inline-flex items-center text-xs relative">
      <ArrowIcon
        className={`mr-0.5 ${loading ? "animate-translate-arrow" : ""}`}
      />
      <span
        aria-label={lang}
        className={`relative ${loading ? "animate-translate-flag" : ""}`}
      >
        {flag}
        {error ? (
          <span className="absolute inset-0 flex items-center justify-center text-red-600">
            ✖
          </span>
        ) : null}
      </span>
    </span>
  );
}
