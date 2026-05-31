import json
import re
import structlog
from pathlib import Path
from typing import Any

logger = structlog.get_logger(__name__)

KEYWORDS_PATH = Path(__file__).parent.parent / "config" / "keywords.json"


class TextProcessor:
    def __init__(self) -> None:
        keywords = self._load_keywords()
        self.keywords_decision: list[str] = keywords["decision"]
        self.keywords_todo: list[str] = keywords["todo"]
        self.keywords_past: list[str] = keywords["past"]
        self.keywords_negation: list[str] = keywords["negation"]
        self.keywords_next_agenda: list[str] = keywords["next_agenda"]

    def _load_keywords(self) -> dict[str, list[str]]:
        with open(KEYWORDS_PATH, encoding="utf-8") as f:
            data = json.load(f)
        required = {"decision", "todo", "past", "negation", "next_agenda"}
        missing = required - data.keys()
        if missing:
            raise KeyError(f"keywords.json に必要なキーがありません: {missing}")
        return data

    def split_sentences(self, text: str) -> list[str]:
        parts = re.split(r"[。！？\n]", text)
        return [p.strip() for p in parts if p.strip()]

    def generate_minutes(self, text: str) -> list[dict[str, Any]]:
        sentences = self.split_sentences(text)
        result: list[dict[str, Any]] = []
        sort_order = 0

        for sentence in sentences:
            section = self._classify_sentence(sentence)
            result.append({
                "section_type": section,
                "content": sentence,
                "sort_order": sort_order,
            })
            sort_order += 1

        if not result:
            result.append({
                "section_type": "body",
                "content": text,
                "sort_order": 0,
            })

        logger.info("minutes_generated", section_count=len(result))
        return result

    def _classify_sentence(self, sentence: str) -> str:
        for kw in self.keywords_next_agenda:
            if kw in sentence:
                return "next"
        for kw in self.keywords_decision:
            if kw in sentence:
                return "decisions"
        return "body"

    def extract_todos(self, text: str) -> list[dict[str, Any]]:
        sentences = self.split_sentences(text)
        candidates = self._filter_past(sentences)
        candidates = self._filter_negation(candidates)
        todos: list[dict[str, Any]] = []

        for sentence in candidates:
            for kw in self.keywords_todo:
                if kw in sentence:
                    due = self._detect_due_keyword(sentence)
                    todos.append({
                        "todo_text": sentence,
                        "due_keyword": due,
                    })
                    break

        deduped = self._deduplicate(todos)
        logger.info("todos_extracted", count=len(deduped))
        return deduped

    def _detect_due_keyword(self, sentence: str) -> str | None:
        patterns = [r"来週", r"今週", r"明日", r"今日", r"\d+月\d+日", r"次回"]
        for pat in patterns:
            m = re.search(pat, sentence)
            if m:
                return m.group()
        return None

    def _filter_past(self, sentences: list[str]) -> list[str]:
        result = []
        for s in sentences:
            is_past = any(kw in s for kw in self.keywords_past)
            if not is_past:
                result.append(s)
        return result

    def _filter_negation(self, sentences: list[str]) -> list[str]:
        result = []
        for s in sentences:
            is_negative = any(kw in s for kw in self.keywords_negation)
            if not is_negative:
                result.append(s)
        return result

    def _deduplicate(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[str] = set()
        result: list[dict[str, Any]] = []
        for item in items:
            key = item["todo_text"]
            if key not in seen:
                seen.add(key)
                result.append(item)
        return result

    def summarize(self, text: str) -> str:
        sentences = self.split_sentences(text)
        if not sentences:
            return text

        scores = self.score_sentences(sentences)
        target_count = max(1, round(len(sentences) * 0.175))

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        selected_indices = sorted([idx for idx, _ in ranked[:target_count]])

        summary = "。".join(sentences[i] for i in selected_indices)
        if summary:
            summary += "。"

        logger.info(
            "summary_generated",
            original_sentences=len(sentences),
            summary_sentences=len(selected_indices),
        )
        return summary

    def score_sentences(self, sentences: list[str]) -> dict[int, float]:
        scores: dict[int, float] = {}
        for i, s_i in enumerate(sentences):
            words_i = set(s_i)
            score = 0.0
            for j, s_j in enumerate(sentences):
                if i == j:
                    continue
                words_j = set(s_j)
                common = words_i & words_j
                denom = (len(words_i) + len(words_j))
                if denom > 0:
                    score += len(common) / denom
            scores[i] = score
        return scores
