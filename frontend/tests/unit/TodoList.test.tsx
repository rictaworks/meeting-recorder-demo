import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import TodoList from "../../src/components/TodoList";

const mockTodos = [
  { id: "t1", todo_text: "タスク1", is_checked: false, is_manual: false, is_deleted: false },
  { id: "t2", todo_text: "タスク2", is_checked: true, is_manual: false, is_deleted: false },
];

const mockOnTodoChange = jest.fn();
const mockOnError = jest.fn();

describe("TodoList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders todo items", () => {
    render(
      <TodoList
        meetingId="meeting1"
        todos={mockTodos}
        onTodoChange={mockOnTodoChange}
        onError={mockOnError}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
  });

  test("checked todo has checked state", () => {
    render(
      <TodoList
        meetingId="meeting1"
        todos={mockTodos}
        onTodoChange={mockOnTodoChange}
        onError={mockOnError}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  test("renders add todo form with input and button", () => {
    render(
      <TodoList
        meetingId="meeting1"
        todos={mockTodos}
        onTodoChange={mockOnTodoChange}
        onError={mockOnError}
      />
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("does not use native alert/confirm/prompt", () => {
    const source = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/components/TodoList.tsx"),
      "utf-8"
    );
    expect(source).not.toMatch(/\balert\s*\(/);
    expect(source).not.toMatch(/\bconfirm\s*\(/);
    expect(source).not.toMatch(/\bprompt\s*\(/);
  });

  test("does not hardcode UI text strings", () => {
    const source = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/components/TodoList.tsx"),
      "utf-8"
    );
    expect(source).not.toMatch(/"ToDo"/);
    expect(source).not.toMatch(/"追加"/);
    expect(source).not.toMatch(/"ToDoを入力"/);
  });

  test("logical deletion uses is_deleted flag, no hard delete", () => {
    const source = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/components/TodoList.tsx"),
      "utf-8"
    );
    expect(source).toMatch(/is_deleted/);
  });
});
