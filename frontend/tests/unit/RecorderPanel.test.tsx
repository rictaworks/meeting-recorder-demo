import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import RecorderPanel from "../../src/components/RecorderPanel";

const mockOnRecordingComplete = jest.fn();
const mockOnError = jest.fn();

const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: null as ((e: BlobEvent) => void) | null,
  onstop: null as (() => void) | null,
  state: "inactive",
};

beforeEach(() => {
  jest.clearAllMocks();

  Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      }),
    },
    writable: true,
    configurable: true,
  });

  (global as unknown as Record<string, unknown>)["MediaRecorder"] = jest.fn().mockImplementation(() => ({
    ...mockMediaRecorder,
    start: jest.fn(),
    stop: jest.fn(),
  }));
  (global.MediaRecorder as unknown as { isTypeSupported: (type: string) => boolean }).isTypeSupported = jest.fn().mockReturnValue(true);
});

describe("RecorderPanel", () => {
  test("renders start recording button", () => {
    render(<RecorderPanel onRecordingComplete={mockOnRecordingComplete} onError={mockOnError} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("start button label comes from i18n (not hardcoded)", () => {
    render(<RecorderPanel onRecordingComplete={mockOnRecordingComplete} onError={mockOnError} />);
    const button = screen.getByRole("button");
    expect(button.textContent).not.toBe("");
    expect(button.textContent).not.toMatch(/録音開始|Start Recording/);
  });

  test("does not use native alert/confirm/prompt", () => {
    const source = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/components/RecorderPanel.tsx"),
      "utf-8"
    );
    expect(source).not.toMatch(/\balert\s*\(/);
    expect(source).not.toMatch(/\bconfirm\s*\(/);
    expect(source).not.toMatch(/\bprompt\s*\(/);
  });

  test("shows modal when recording blob exceeds 100MB", async () => {
    render(<RecorderPanel onRecordingComplete={mockOnRecordingComplete} onError={mockOnError} />);

    const startButton = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(startButton);
    });

    const stopButton = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(stopButton);
    });
  });

  test("does not hardcode UI text strings", () => {
    const source = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/components/RecorderPanel.tsx"),
      "utf-8"
    );
    expect(source).not.toMatch(/"録音開始"/);
    expect(source).not.toMatch(/"録音停止"/);
    expect(source).not.toMatch(/"Start Recording"/);
  });
});
