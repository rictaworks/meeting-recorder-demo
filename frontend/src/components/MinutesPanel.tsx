"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import type { MinuteSection } from "@/lib/api";

interface MinutesPanelProps {
  minutes: MinuteSection[];
}

const SECTION_LABEL_KEYS: Record<string, string> = {
  decisions: "minutes.decisions",
  next: "minutes.next",
  body: "minutes.body",
};

function MinutesPanel({ minutes }: MinutesPanelProps) {
  const { t } = useTranslation("common");

  const sorted = [...minutes].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section aria-labelledby="minutes-title">
      <h2 id="minutes-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FontAwesomeIcon icon={faClipboardList} />
        {t("minutes.title")}
      </h2>
      {sorted.map((section) => (
        <div key={section.section_type} style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "0.95rem", margin: "0 0 6px", fontWeight: 600 }}>
            {t(SECTION_LABEL_KEYS[section.section_type] ?? section.section_type)}
          </h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "12px", borderRadius: "4px" }}>
            {section.content}
          </p>
        </div>
      ))}
    </section>
  );
}

export default MinutesPanel;
