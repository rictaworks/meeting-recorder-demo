"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

const LANGUAGE_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
  fr: "Français",
  zh: "中文",
  ru: "Русский",
  es: "Español",
  ar: "العربية",
};

function LanguageSelector() {
  const { i18n } = useTranslation("common");

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    i18n.changeLanguage(e.target.value);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <FontAwesomeIcon icon={faGlobe} aria-hidden="true" />
      <select
        value={i18n.language}
        onChange={handleChange}
        aria-label="language selector"
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontSize: "0.875rem",
          cursor: "pointer",
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang] ?? lang}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
