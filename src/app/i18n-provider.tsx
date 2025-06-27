"use client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "../i18n";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init();
}

export default function I18nProvider({
  children,
}: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
