"use client";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className="bg-blue-100 border border-blue-300 text-blue-800 p-2 flex items-center justify-between">
      <span>
        {t("systemLanguagePrompt", { language: LANGUAGE_NAMES[lang] })}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSwitch} className="underline">
          {t("switch")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("claimBanner.dismiss")}
          className="text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
