"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { patchTodo, createTodo } from "@/lib/api";
import type { Todo } from "@/lib/api";

interface TodoListProps {
  meetingId: string;
  todos: Todo[];
  onTodoChange: (todos: Todo[]) => void;
  onError: (errorKey: string) => void;
}

function TodoList({ meetingId, todos, onTodoChange, onError }: TodoListProps) {
  const { t } = useTranslation("common");
  const [newText, setNewText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const visibleTodos = todos.filter((todo) => !todo.is_deleted);

  async function handleCheck(todo: Todo) {
    try {
      const updated = await patchTodo(todo.id, { is_checked: !todo.is_checked });
      onTodoChange(todos.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      onError("error.generic");
    }
  }

  async function handleDelete(todo: Todo) {
    try {
      const updated = await patchTodo(todo.id, { is_deleted: true });
      onTodoChange(todos.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      onError("error.generic");
    }
  }

  async function handleAdd() {
    if (!newText.trim()) return;
    setIsAdding(true);
    try {
      const created = await createTodo(meetingId, newText.trim());
      onTodoChange([...todos, created]);
      setNewText("");
    } catch {
      onError("error.generic");
    } finally {
      setIsAdding(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAdd();
    }
  }

  return (
    <section aria-labelledby="todos-title">
      <h2 id="todos-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FontAwesomeIcon icon={faListCheck} />
        {t("todos.title")}
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
        {visibleTodos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <input
              type="checkbox"
              checked={todo.is_checked}
              onChange={() => handleCheck(todo)}
              aria-label={todo.todo_text}
              id={`todo-${todo.id}`}
            />
            <label
              htmlFor={`todo-${todo.id}`}
              style={{
                flex: 1,
                textDecoration: todo.is_checked ? "line-through" : "none",
                color: todo.is_checked ? "#999" : "inherit",
              }}
            >
              {todo.todo_text}
            </label>
            <button
              onClick={() => handleDelete(todo)}
              aria-label={`delete-${todo.id}`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                padding: "2px 6px",
              }}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("todos.placeholder")}
          aria-label={t("todos.placeholder")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "0.9rem",
          }}
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !newText.trim()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: isAdding ? "not-allowed" : "pointer",
            background: "#0070f3",
            color: "#fff",
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          {t("todos.add")}
        </button>
      </div>
    </section>
  );
}

export default TodoList;
