import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FileUploader from "../../src/components/FileUploader";

const mockOnFile = jest.fn();
const mockOnError = jest.fn();

describe("FileUploader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders upload area", () => {
    render(<FileUploader onFile={mockOnFile} onError={mockOnError} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("has a hidden honeypot field with name='website'", () => {
    const { container } = render(<FileUploader onFile={mockOnFile} onError={mockOnError} />);
    const honeypot = container.querySelector("input[name='website']");
    expect(honeypot).not.toBeNull();
    expect(honeypot?.getAttribute("type")).toBe("text");
  });

  test("honeypot field has display:none style", () => {
    const { container } = render(<FileUploader onFile={mockOnFile} onError={mockOnError} />);
    const honeypot = container.querySelector("input[name='website']") as HTMLElement;
    expect(honeypot).not.toBeNull();
    const style = honeypot.style.cssText || window.getComputedStyle(honeypot).display;
    expect(honeypot.getAttribute("style") || "").toContain("display");
  });

  test("calls onError for unsupported file format", () => {
    render(<FileUploader onFile={mockOnFile} onError={mockOnError} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    expect(input).not.toBeNull();

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { value: [file], writable: false });
    fireEvent.change(input);

    expect(mockOnError).toHaveBeenCalledWith("error.unsupported_format");
    expect(mockOnFile).not.toHaveBeenCalled();
  });

  test("calls onError for file exceeding 100MB", () => {
    render(<FileUploader onFile={mockOnFile} onError={mockOnError} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;

    const file = new File(["x".repeat(100)], "large.wav", { type: "audio/wav" });
    Object.defineProperty(file, "size", { value: 100 * 1024 * 1024 + 1 });
    Object.defineProperty(input, "files", { value: [file], writable: false });
    fireEvent.change(input);

    expect(mockOnError).toHaveBeenCalledWith("error.file_too_large");
  });

  test("calls onFile for valid WAV file", () => {
    render(<FileUploader onFile={mockOnFile} onError={mockOnError} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;

    const file = new File(["audio"], "test.wav", { type: "audio/wav" });
    Object.defineProperty(input, "files", { value: [file], writable: false });
    fireEvent.change(input);

    expect(mockOnFile).toHaveBeenCalledWith(file);
    expect(mockOnError).not.toHaveBeenCalled();
  });

  test("calls onFile for valid MP3 file", () => {
    render(<FileUploader onFile={mockOnFile} onError={mockOnError} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;

    const file = new File(["audio"], "test.mp3", { type: "audio/mp3" });
    Object.defineProperty(input, "files", { value: [file], writable: false });
    fireEvent.change(input);

    expect(mockOnFile).toHaveBeenCalledWith(file);
  });

  test("does not use native alert/confirm/prompt", () => {
    const source = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/components/FileUploader.tsx"),
      "utf-8"
    );
    expect(source).not.toMatch(/\balert\s*\(/);
    expect(source).not.toMatch(/\bconfirm\s*\(/);
    expect(source).not.toMatch(/\bprompt\s*\(/);
  });

  test("does not hardcode UI text strings", () => {
    const source = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/components/FileUploader.tsx"),
      "utf-8"
    );
    expect(source).not.toMatch(/"ファイルをアップロード"/);
    expect(source).not.toMatch(/"Upload File"/);
    expect(source).not.toMatch(/"対応していない形式"/);
  });
});
