"use client";
import { useEffect } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "../i18n";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init();
}

export default function I18nProvider({
  children,
}: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.lang = i18n.language;
    localStorage.setItem("language", i18n.language);
    document.cookie = `language=${i18n.language}; path=/; max-age=31536000; sameSite=lax`;
    const handler = (lng: string) => {
      document.documentElement.lang = lng;
      localStorage.setItem("language", lng);
      document.cookie = `language=${lng}; path=/; max-age=31536000; sameSite=lax`;
    };
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
