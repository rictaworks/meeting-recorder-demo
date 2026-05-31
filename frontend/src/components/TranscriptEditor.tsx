"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

interface TranscriptEditorProps {
  meetingId: string;
  rawText: string;
  onGenerate: (editedText: string) => void;
  isProcessing: boolean;
}

function TranscriptEditor({ rawText, onGenerate, isProcessing }: TranscriptEditorProps) {
  const { t } = useTranslation("common");
  const [editedText, setEditedText] = useState(rawText);

  function handleGenerate() {
    onGenerate(editedText);
  }

  return (
    <section aria-labelledby="transcript-title">
      <h2 id="transcript-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FontAwesomeIcon icon={faFileLines} />
        {t("transcript.title")}
      </h2>
      <p style={{ color: "#666", fontSize: "0.875rem", margin: "0 0 8px" }}>{t("transcript.edit_hint")}</p>
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        aria-label={t("transcript.title")}
        style={{
          width: "100%",
          minHeight: "160px",
          padding: "12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontSize: "0.9rem",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleGenerate}
        disabled={isProcessing || editedText.trim().length === 0}
        style={{
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          borderRadius: "4px",
          border: "none",
          cursor: isProcessing ? "not-allowed" : "pointer",
          background: "#0070f3",
          color: "#fff",
          opacity: isProcessing ? 0.7 : 1,
        }}
      >
        <FontAwesomeIcon icon={faWandMagicSparkles} />
        {isProcessing ? t("status.processing") : t("transcript.generate")}
      </button>
    </section>
  );
}

export default TranscriptEditor;
