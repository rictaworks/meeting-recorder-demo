import jaCommon from "../../public/locales/ja/common.json";
import enCommon from "../../public/locales/en/common.json";
import frCommon from "../../public/locales/fr/common.json";
import zhCommon from "../../public/locales/zh/common.json";
import ruCommon from "../../public/locales/ru/common.json";
import esCommon from "../../public/locales/es/common.json";
import arCommon from "../../public/locales/ar/common.json";

const REQUIRED_KEYS = [
  "record.start",
  "record.stop",
  "upload.label",
  "upload.dragdrop",
  "transcript.title",
  "transcript.generate",
  "minutes.title",
  "minutes.decisions",
  "minutes.next",
  "minutes.body",
  "todos.title",
  "todos.add",
  "todos.placeholder",
  "summary.title",
  "history.title",
  "maintenance.message",
  "error.file_too_large",
  "error.unsupported_format",
  "modal.ok",
  "modal.cancel",
];

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

const locales: Record<string, Record<string, unknown>> = {
  ja: jaCommon as Record<string, unknown>,
  en: enCommon as Record<string, unknown>,
  fr: frCommon as Record<string, unknown>,
  zh: zhCommon as Record<string, unknown>,
  ru: ruCommon as Record<string, unknown>,
  es: esCommon as Record<string, unknown>,
  ar: arCommon as Record<string, unknown>,
};

describe("i18n locale files", () => {
  const languages = ["ja", "en", "fr", "zh", "ru", "es", "ar"];

  test("all 7 languages have locale files", () => {
    expect(Object.keys(locales)).toHaveLength(7);
    languages.forEach((lang) => {
      expect(locales[lang]).toBeDefined();
    });
  });

  languages.forEach((lang) => {
    describe(`${lang} locale`, () => {
      REQUIRED_KEYS.forEach((key) => {
        test(`has key: ${key}`, () => {
          const value = getNestedValue(locales[lang], key);
          expect(value).toBeDefined();
          expect(typeof value).toBe("string");
          expect((value as string).length).toBeGreaterThan(0);
        });
      });
    });
  });

  test("all locales have the same key structure", () => {
    const jaKeys = REQUIRED_KEYS.map((k) => getNestedValue(locales["ja"], k));
    languages.forEach((lang) => {
      REQUIRED_KEYS.forEach((key, i) => {
        const value = getNestedValue(locales[lang], key);
        expect(value).toBeDefined();
        expect(jaKeys[i]).toBeDefined();
      });
    });
  });
});
