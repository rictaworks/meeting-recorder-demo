import { uploadFile, getTranscript, patchTranscript, generate, getMeetings, patchTodo, createTodo } from "../../src/lib/api";

const BASE_URL = "http://localhost:8000";

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("api.ts", () => {
  describe("uploadFile", () => {
    test("posts to /api/upload with FormData", async () => {
      const mockResponse = { meeting_id: "abc123", raw_text: "hello" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const file = new File(["audio"], "test.webm", { type: "audio/webm" });
      const result = await uploadFile(file, "");
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/upload`,
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual(mockResponse);
    });

    test("throws on non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ detail: "maintenance" }),
      });

      const file = new File(["audio"], "test.webm", { type: "audio/webm" });
      await expect(uploadFile(file, "")).rejects.toThrow();
    });

    test("includes honeypot field empty in FormData", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ meeting_id: "x", raw_text: "" }),
      });

      const file = new File(["audio"], "test.wav", { type: "audio/wav" });
      await uploadFile(file, "");

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = callArgs[1].body as FormData;
      expect(body.get("website")).toBe("");
    });
  });

  describe("getTranscript", () => {
    test("calls GET /api/transcripts/{meeting_id}", async () => {
      const mockData = { raw_text: "hello", edited_text: "" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getTranscript("meeting123");
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/transcripts/meeting123`,
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockData);
    });

    test("throws on 503 (maintenance)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });
      await expect(getTranscript("meeting123")).rejects.toThrow();
    });
  });

  describe("patchTranscript", () => {
    test("calls PATCH /api/transcripts/{meeting_id}", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ edited_text: "edited" }),
      });

      await patchTranscript("meeting123", "edited text");
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/transcripts/meeting123`,
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  describe("generate", () => {
    test("calls POST /api/generate", async () => {
      const mockData = { minutes: [], todos: [], summary: "" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await generate("meeting123");
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/generate`,
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe("getMeetings", () => {
    test("calls GET /api/meetings", async () => {
      const mockData = [{ id: "abc", title: "test" }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getMeetings();
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/meetings`,
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe("patchTodo", () => {
    test("calls PATCH /api/todos/{id}", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "t1", is_checked: true }),
      });

      await patchTodo("t1", { is_checked: true });
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/todos/t1`,
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  describe("createTodo", () => {
    test("calls POST /api/todos", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "t2", todo_text: "new task" }),
      });

      await createTodo("meeting123", "new task");
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/todos`,
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
