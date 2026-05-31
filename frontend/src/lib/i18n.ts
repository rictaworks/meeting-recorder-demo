import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

const SUPPORTED_LANGUAGES = ["ja", "en", "fr", "zh", "ru", "es", "ar"];
const DEFAULT_LANGUAGE = "ja";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: "common",
    ns: ["common"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["querystring", "cookie", "navigator"],
      caches: ["cookie"],
    },
    interpolation: {
      // React が JSX を自動エスケープするため二重エスケープを避ける。
      // locale ファイルは静的バンドルのみ — ユーザー入力を含まない。
      escapeValue: false,
    },
  });

export default i18n;
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };
