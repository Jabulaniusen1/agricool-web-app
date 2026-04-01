"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import yo from "./locales/yo";
import ha from "./locales/ha";
import ig from "./locales/ig";
import pg from "./locales/pg";

const LANGUAGE_KEY = "agricool-language";

const savedLanguage =
  typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_KEY) ?? "en" : "en";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { en, yo, ha, ig, pg },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export { LANGUAGE_KEY };
export default i18n;
