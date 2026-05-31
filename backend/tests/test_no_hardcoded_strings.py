import ast
import re
from pathlib import Path

APP_DIR = Path(__file__).parent.parent / "app"

FORBIDDEN_PATTERNS = [
    r'sqlite://(?!.*\bos\.getenv\b)',
]

INLINE_SQL_PATTERN = re.compile(
    r'(?i)(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+',
)

KEYWORDS_WHITELIST = {
    "decisions",
    "next",
    "body",
    "recording",
    "processing",
    "done",
    "error",
    "maintenance_mode",
    "session_id",
    "meeting_id",
}


def collect_string_literals(source: str) -> list[str]:
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return []
    literals = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            literals.append(node.value)
    return literals


def test_no_hardcoded_api_keys():
    api_key_pattern = re.compile(r'(?i)(api_key|secret_key|password)\s*=\s*["\'][^"\']+["\']')
    for py_file in APP_DIR.rglob("*.py"):
        source = py_file.read_text(encoding="utf-8")
        matches = api_key_pattern.findall(source)
        assert not matches, f"Potential hardcoded secret in {py_file}: {matches}"


def test_keywords_loaded_from_json_not_hardcoded():
    keyword_lists_pattern = re.compile(
        r'(?i)(keywords_decision|keywords_todo|keywords_past|keywords_negation)\s*=\s*\['
    )
    for py_file in APP_DIR.rglob("*.py"):
        if py_file.name == "text_processor.py":
            source = py_file.read_text(encoding="utf-8")
            assert "keywords.json" in source or "json.load" in source, (
                f"text_processor.py must load keywords from JSON file, not hardcode them"
            )


def test_no_hardcoded_database_path_in_app_code():
    forbidden = re.compile(r'sqlite:///(?!.*env|.*getenv|.*config)')
    for py_file in APP_DIR.rglob("*.py"):
        if py_file.name in ("config.py",):
            continue
        source = py_file.read_text(encoding="utf-8")
        if forbidden.search(source):
            assert False, f"Hardcoded SQLite path found in {py_file}"
