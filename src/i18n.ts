import i18n from "i18next";
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
    };
    if (typeof window !== "undefined") {
      const { initReactI18next } = await import("react-i18next");
      await instance.use(initReactI18next).init(config);
    } else {
      await instance.init(config);
    }
  } else if (instance.language !== lang) {
    await instance.changeLanguage(lang);
  }
  return instance;
}

export default instance;
