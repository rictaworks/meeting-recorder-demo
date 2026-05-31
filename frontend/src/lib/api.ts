const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.detail ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface UploadResult {
  meeting_id: string;
  raw_text: string;
}

export interface TranscriptResult {
  raw_text: string;
  edited_text: string;
  vosk_confidence?: number;
}

export interface MinuteSection {
  section_type: "decisions" | "next" | "body";
  content: string;
  sort_order: number;
}

export interface Todo {
  id: string;
  todo_text: string;
  due_keyword?: string;
  is_checked: boolean;
  is_manual: boolean;
  is_deleted: boolean;
}

export interface GenerateResult {
  minutes: MinuteSection[];
  todos: Todo[];
  summary: string;
}

export interface Meeting {
  id: string;
  title: string;
  recorded_at: string;
  status: "recording" | "processing" | "done" | "error";
  duration_sec?: number;
}

export function uploadFile(file: File, honeypotValue: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("website", honeypotValue);
  return request<UploadResult>("/api/upload", { method: "POST", body: formData });
}

export function getTranscript(meetingId: string): Promise<TranscriptResult> {
  return request<TranscriptResult>(`/api/transcripts/${meetingId}`, { method: "GET" });
}

export function patchTranscript(meetingId: string, editedText: string): Promise<TranscriptResult> {
  return request<TranscriptResult>(`/api/transcripts/${meetingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ edited_text: editedText }),
  });
}

export function generate(meetingId: string): Promise<GenerateResult> {
  return request<GenerateResult>("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meeting_id: meetingId }),
  });
}

export function getMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>("/api/meetings", { method: "GET" });
}

export function patchTodo(todoId: string, patch: Partial<Todo>): Promise<Todo> {
  return request<Todo>(`/api/todos/${todoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function createTodo(meetingId: string, todoText: string): Promise<Todo> {
  return request<Todo>("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meeting_id: meetingId, todo_text: todoText, is_manual: true }),
  });
}

export { ApiError };
