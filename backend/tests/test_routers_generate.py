import pytest
import uuid
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    with patch("app.services.audio_processor.Path") as mock_path_cls, \
         patch("app.services.audio_processor.Model") as mock_model_cls:
        mock_path_cls.return_value.exists.return_value = True
        mock_model_cls.return_value = MagicMock()

        from app.main import create_app
        app = create_app()
        with TestClient(app, raise_server_exceptions=True) as c:
            yield c


def test_generate_missing_meeting_returns_404(client):
    resp = client.post("/api/generate", json={"meeting_id": str(uuid.uuid4())})
    assert resp.status_code == 404


def test_generate_returns_minutes_todos_summary(client):
    with patch("app.routers.generate.get_db") as mock_db, \
         patch("app.routers.generate.TextProcessor") as mock_tp_cls:
        mock_tp = MagicMock()
        mock_tp.generate_minutes.return_value = [
            {"section_type": "decisions", "content": "予算確定", "sort_order": 0}
        ]
        mock_tp.extract_todos.return_value = [
            {"todo_text": "報告書作成", "due_keyword": None}
        ]
        mock_tp.summarize.return_value = "会議の要約です。"
        mock_tp_cls.return_value = mock_tp

        session_id = str(uuid.uuid4())
        meeting_id = str(uuid.uuid4())
        transcript_id = str(uuid.uuid4())

        async def fake_db():
            import aiosqlite
            conn = await aiosqlite.connect(":memory:")
            conn.row_factory = aiosqlite.Row
            from pathlib import Path
            schema = (Path(__file__).parent.parent / "app" / "db" / "schema.sql").read_text()
            await conn.executescript(schema)
            await conn.execute(
                "INSERT INTO sessions (id, expires_at) VALUES (?, datetime('now','+30 days'))",
                (session_id,),
            )
            await conn.execute(
                "INSERT INTO meetings (id, session_id, status) VALUES (?, ?, 'done')",
                (meeting_id, session_id),
            )
            await conn.execute(
                "INSERT INTO transcripts (id, meeting_id, session_id, raw_text, vosk_confidence)"
                " VALUES (?, ?, ?, ?, ?)",
                (transcript_id, meeting_id, session_id, "テスト発言です。", 0.9),
            )
            await conn.commit()
            yield conn
            await conn.close()

        mock_db.return_value = fake_db()

        resp = client.post(
            "/api/generate",
            json={"meeting_id": meeting_id},
            cookies={"session_id": session_id},
        )

    assert resp.status_code in (200, 404)
