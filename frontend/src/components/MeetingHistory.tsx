"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import type { Meeting } from "@/lib/api";

interface MeetingHistoryProps {
  meetings: Meeting[];
  onSelect: (meeting: Meeting) => void;
}

function MeetingHistory({ meetings, onSelect }: MeetingHistoryProps) {
  const { t } = useTranslation("common");

  return (
    <section aria-labelledby="history-title">
      <h2 id="history-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FontAwesomeIcon icon={faClockRotateLeft} />
        {t("history.title")}
      </h2>
      {meetings.length === 0 ? (
        <p style={{ color: "#999", fontSize: "0.875rem" }}>{t("history.empty")}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {meetings.map((meeting) => (
            <li key={meeting.id} style={{ borderBottom: "1px solid #eee" }}>
              <button
                onClick={() => onSelect(meeting)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "12px 0",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ fontWeight: 600 }}>{meeting.title || meeting.id}</span>
                <span style={{ marginLeft: "12px", color: "#999", fontSize: "0.8rem" }}>
                  {new Date(meeting.recorded_at).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MeetingHistory;
