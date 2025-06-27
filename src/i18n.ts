import i18n from "i18next";
import enCommon from "../public/locales/en/common.json";
import esCommon from "../public/locales/es/common.json";

const instance = i18n.createInstance();

void instance.init({
  resources: {
    en: { common: enCommon },
    es: { common: esCommon },
  },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default instance;
