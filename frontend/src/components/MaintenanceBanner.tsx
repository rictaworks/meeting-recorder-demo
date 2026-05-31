"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

interface MaintenanceBannerProps {
  isVisible: boolean;
}

function MaintenanceBanner({ isVisible }: MaintenanceBannerProps) {
  const { t } = useTranslation("common");

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: "#fff3cd",
        border: "1px solid #ffc107",
        borderRadius: "6px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
        color: "#856404",
      }}
    >
      <FontAwesomeIcon icon={faTriangleExclamation} />
      <span>{t("maintenance.message")}</span>
    </div>
  );
}

export default MaintenanceBanner;
