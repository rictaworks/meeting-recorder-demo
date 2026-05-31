"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

function Modal({ isOpen, title, message, onConfirm, onCancel, showCancel = false }: ModalProps) {
  const { t } = useTranslation("common");

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 id="modal-title" style={{ margin: 0, fontSize: "1.1rem" }}>
            {title}
          </h2>
          <button
            onClick={onCancel ?? onConfirm}
            aria-label="close"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <p id="modal-message" style={{ margin: "0 0 20px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              {t("modal.cancel")}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              background: "#0070f3",
              color: "#fff",
            }}
          >
            {t("modal.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
