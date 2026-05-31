"use client";

import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faStop, faCircle } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

interface RecorderPanelProps {
  onRecordingComplete: (blob: Blob) => void;
  onError: (errorKey: string) => void;
}

function RecorderPanel({ onRecordingComplete, onError }: RecorderPanelProps) {
  const { t } = useTranslation("common");
  const [isRecording, setIsRecording] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (blob.size > MAX_FILE_SIZE_BYTES) {
        setShowSizeModal(true);
        return;
      }
      onRecordingComplete(blob);
    };

    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function handleClick() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording().catch(() => onError("error.generic"));
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        aria-label={isRecording ? t("record.stop") : t("record.start")}
        aria-pressed={isRecording}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          fontSize: "1rem",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          background: isRecording ? "#e53e3e" : "#0070f3",
          color: "#fff",
        }}
      >
        {isRecording ? (
          <>
            <FontAwesomeIcon icon={faStop} />
            {t("record.stop")}
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faMicrophone} />
            {t("record.start")}
          </>
        )}
      </button>

      {isRecording && (
        <span aria-live="polite" style={{ marginLeft: "12px", color: "#e53e3e" }}>
          <FontAwesomeIcon icon={faCircle} style={{ marginRight: "4px" }} />
          {t("record.recording")}
        </span>
      )}

      <Modal
        isOpen={showSizeModal}
        title={t("error.file_too_large")}
        message={t("error.file_too_large")}
        onConfirm={() => setShowSizeModal(false)}
      />
    </div>
  );
}

export default RecorderPanel;
