"use client";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { LANGUAGE_NAMES } from "./LanguageSwitcher";

export default function SystemLanguageBanner({
  lang,
  onSwitch,
  onDismiss,
}: {
  lang: string;
  onSwitch: () => void;
  onDismiss: () => void;
}) {
  const { i18n } = useTranslation();
  const t = i18n.getFixedT(lang);
  const styles = {
    wrapper: css({
      bg: "blue.100",
      borderWidth: "1px",
      borderColor: "blue.300",
      color: "blue.800",
      p: "2",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }),
    actions: css({ display: "flex", alignItems: "center", gap: "2" }),
    switchButton: css({ textDecorationLine: "underline" }),
    dismissButton: css({ fontSize: "xl", lineHeight: "none" }),
  };
  return (
    <div className={styles.wrapper}>
      <span>
        {t("systemLanguagePrompt", { language: LANGUAGE_NAMES[lang] })}
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onSwitch}
          className={styles.switchButton}
        >
          {t("switch")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("claimBanner.dismiss")}
          className={styles.dismissButton}
        >
          ×
        </button>
      </div>
    </div>
  );
}
