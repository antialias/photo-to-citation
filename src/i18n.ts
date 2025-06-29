import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "../public/locales/en/common.json";
import esCommon from "../public/locales/es/common.json";
import frCommon from "../public/locales/fr/common.json";

const instance = i18n.createInstance();

export async function initI18n(lang: string) {
  if (!instance.isInitialized) {
    const config = {
      resources: {
        en: { common: enCommon },
        es: { common: esCommon },
        fr: { common: frCommon },
      },
      lng: lang,
      fallbackLng: "en",
      defaultNS: "common",
      interpolation: { escapeValue: false },
      initImmediate: false,
    };
    instance.use(initReactI18next).init(config);
  } else if (instance.language !== lang) {
    instance.changeLanguage(lang);
  }
  return instance;
}

export default instance;
