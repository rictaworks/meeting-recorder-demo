"use client";

import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const SUPPORTED_TYPES = ["audio/wav", "audio/webm", "audio/ogg", "audio/mp3", "audio/mpeg"];
const SUPPORTED_EXTENSIONS = [".wav", ".webm", ".ogg", ".mp3"];

interface FileUploaderProps {
  onFile: (file: File) => void;
  onError: (errorKey: string) => void;
}

function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  const validType = SUPPORTED_TYPES.includes(file.type) || SUPPORTED_EXTENSIONS.includes(ext);
  if (!validType) {
    return "error.unsupported_format";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "error.file_too_large";
  }
  return null;
}

function FileUploader({ onFile, onError }: FileUploaderProps) {
  const { t } = useTranslation("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const error = validateFile(file);
    if (error) {
      onError(error);
      return;
    }
    onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${isDragging ? "#0070f3" : "#ccc"}`,
          borderRadius: "8px",
          padding: "32px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragging ? "#f0f7ff" : "#fafafa",
        }}
      >
        <FontAwesomeIcon icon={faUpload} style={{ fontSize: "2rem", marginBottom: "12px", color: "#999" }} />
        <p style={{ margin: "0 0 8px" }}>{t("upload.dragdrop")}</p>
        <p style={{ margin: "0 0 16px", color: "#666", fontSize: "0.875rem" }}>{t("upload.or")}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            padding: "8px 20px",
            borderRadius: "4px",
            border: "1px solid #0070f3",
            cursor: "pointer",
            background: "#fff",
            color: "#0070f3",
          }}
        >
          {t("upload.click")}
        </button>
        <p style={{ margin: "12px 0 0", fontSize: "0.75rem", color: "#999" }}>{t("upload.formats")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".wav,.webm,.ogg,.mp3,audio/wav,audio/webm,audio/ogg,audio/mp3,audio/mpeg"
        onChange={handleChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {/* honeypot field for bot detection */}
      <input
        type="text"
        name="website"
        defaultValue=""
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        style={{ display: "none" }}
      />
    </div>
  );
}

export default FileUploader;
