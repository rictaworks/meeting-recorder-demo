"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";

interface SummaryPanelProps {
  summaryText: string;
}

function SummaryPanel({ summaryText }: SummaryPanelProps) {
  const { t } = useTranslation("common");

  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FontAwesomeIcon icon={faAlignLeft} />
        {t("summary.title")}
      </h2>
      <p style={{ margin: 0, whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "12px", borderRadius: "4px" }}>
        {summaryText}
      </p>
    </section>
  );
}

export default SummaryPanel;
