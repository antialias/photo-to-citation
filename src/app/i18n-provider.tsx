"use client";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { initI18n } from "../i18n";

export default function I18nProvider({
  children,
  lang,
}: { children: React.ReactNode; lang: string }) {
  const ssr = typeof window === "undefined";
  if (ssr && (!i18n.isInitialized || i18n.language !== lang)) {
    void initI18n(lang);
  }
  const [ready, setReady] = useState(ssr);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    setReady(false);
    void initI18n(lang).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    // Fallback to the browser's preferred languages if no cookie is set
    if (!document.cookie.includes("language=")) {
      const supported = ["en", "es", "fr"];
      for (const l of navigator.languages ?? []) {
        const code = l.toLowerCase().split("-")[0];
        if (supported.includes(code)) {
          void i18n.changeLanguage(code);
          break;
        }
      }
    }
    document.documentElement.lang = i18n.language;
    localStorage.setItem("language", i18n.language);
    document.cookie = `language=${i18n.language}; path=/; max-age=31536000`;
    const handler = (lng: string) => {
      document.documentElement.lang = lng;
      localStorage.setItem("language", lng);
      document.cookie = `language=${lng}; path=/; max-age=31536000`;
    };
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, [ready]);

  if (!ready) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
