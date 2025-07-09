"use client";
import { useMemo } from "react";
import { FaArrowRight, FaSyncAlt } from "react-icons/fa";
import { css, cx } from "styled-system/css";

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
  const styles = {
    wrapper: css({
      display: "inline-flex",
      alignItems: "center",
      fontSize: "xs",
      position: "relative",
    }),
    icon: css({
      mr: "0.5",
      animationName: loading ? "translate-arrow" : undefined,
    }),
    flagWrapper: css({
      position: "relative",
      animationName: loading ? "translate-flag" : undefined,
    }),
    errorIcon: css({
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "red.600",
    }),
  };
  return (
    <span className={styles.wrapper}>
      <ArrowIcon className={styles.icon} />
      <span aria-label={lang} className={styles.flagWrapper}>
        {flag}
        {error ? <span className={styles.errorIcon}>✖</span> : null}
      </span>
    </span>
  );
}
