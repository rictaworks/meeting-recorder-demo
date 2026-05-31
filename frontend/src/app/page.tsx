"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import RecorderPanel from "@/components/RecorderPanel";
import FileUploader from "@/components/FileUploader";
import TranscriptEditor from "@/components/TranscriptEditor";
import MinutesPanel from "@/components/MinutesPanel";
import TodoList from "@/components/TodoList";
import SummaryPanel from "@/components/SummaryPanel";
import MeetingHistory from "@/components/MeetingHistory";
import LanguageSelector from "@/components/LanguageSelector";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import Modal from "@/components/Modal";
import { uploadFile, getTranscript, patchTranscript, generate, getMeetings, ApiError } from "@/lib/api";
import type { Meeting, Todo, MinuteSection } from "@/lib/api";

type AppStatus = "idle" | "recording" | "processing" | "done" | "error";

function HomePage() {
  const { t } = useTranslation("common");

  const [status, setStatus] = useState<AppStatus>("idle");
  const [isMaintenance, setIsMaintenance] = useState(false);

  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");

  const [minutes, setMinutes] = useState<MinuteSection[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [summaryText, setSummaryText] = useState("");

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    getMeetings()
      .then(setMeetings)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 503) {
          setIsMaintenance(true);
        }
      });
  }, []);

  function handleApiError(err: unknown) {
    if (err instanceof ApiError && err.status === 503) {
      setIsMaintenance(true);
      setStatus("error");
      return;
    }
    setErrorMessage(t("error.generic"));
    setShowErrorModal(true);
    setStatus("error");
  }

  function handleError(errorKey: string) {
    setErrorMessage(t(errorKey));
    setShowErrorModal(true);
  }

  async function handleRecordingComplete(blob: Blob) {
    setStatus("processing");
    const file = new File([blob], "recording.webm", { type: blob.type });
    try {
      const result = await uploadFile(file, "");
      setCurrentMeetingId(result.meeting_id);
      setRawText(result.raw_text);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleFileSelected(file: File) {
    setStatus("processing");
    try {
      const result = await uploadFile(file, "");
      setCurrentMeetingId(result.meeting_id);
      setRawText(result.raw_text);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleGenerate(editedText: string) {
    if (!currentMeetingId) return;
    setStatus("processing");
    try {
      await patchTranscript(currentMeetingId, editedText);
      const result = await generate(currentMeetingId);
      setMinutes(result.minutes);
      setTodos(result.todos);
      setSummaryText(result.summary);
      setStatus("done");

      const updatedMeetings = await getMeetings().catch(() => meetings);
      setMeetings(updatedMeetings);
    } catch (err) {
      handleApiError(err);
    }
  }

  function handleMeetingSelect(meeting: Meeting) {
    if (!meeting.id) return;
    setStatus("processing");
    getTranscript(meeting.id)
      .then((transcript) => {
        setCurrentMeetingId(meeting.id);
        setRawText(transcript.edited_text || transcript.raw_text);
      })
      .catch(handleApiError);
  }

  const isProcessing = status === "processing";

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "16px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Meeting Recorder</h1>
        <LanguageSelector />
      </header>

      <MaintenanceBanner isVisible={isMaintenance} />

      {!isMaintenance && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <RecorderPanel
                onRecordingComplete={handleRecordingComplete}
                onError={handleError}
              />
            </div>
            <div>
              <FileUploader onFile={handleFileSelected} onError={handleError} />
            </div>
          </section>

          {rawText && currentMeetingId && (
            <section style={{ marginBottom: "24px" }}>
              <TranscriptEditor
                meetingId={currentMeetingId}
                rawText={rawText}
                onGenerate={handleGenerate}
                isProcessing={isProcessing}
              />
            </section>
          )}

          {status === "done" && (
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "24px",
                marginBottom: "24px",
              }}
            >
              <MinutesPanel minutes={minutes} />
              {currentMeetingId && (
                <TodoList
                  meetingId={currentMeetingId}
                  todos={todos}
                  onTodoChange={setTodos}
                  onError={handleError}
                />
              )}
              <SummaryPanel summaryText={summaryText} />
            </section>
          )}

          {meetings.length > 0 && (
            <section style={{ marginBottom: "24px" }}>
              <MeetingHistory meetings={meetings} onSelect={handleMeetingSelect} />
            </section>
          )}
        </>
      )}

      <Modal
        isOpen={showErrorModal}
        title={t("error.generic")}
        message={errorMessage}
        onConfirm={() => setShowErrorModal(false)}
      />
    </main>
  );
}

export default HomePage;
