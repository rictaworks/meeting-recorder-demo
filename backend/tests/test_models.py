import pytest
from app.models.meeting import MeetingStatus
from app.models.session import SessionModel
from app.models.transcript import TranscriptModel
from app.models.minutes import MinutesModel
from app.models.todo import TodoModel
from app.models.summary import SummaryModel


def test_meeting_status_values():
    assert MeetingStatus.RECORDING == "recording"
    assert MeetingStatus.PROCESSING == "processing"
    assert MeetingStatus.DONE == "done"
    assert MeetingStatus.ERROR == "error"


def test_session_model_fields():
    fields = SessionModel.model_fields
    assert "id" in fields
    assert "created_at" in fields
    assert "expires_at" in fields


def test_transcript_model_has_session_id():
    fields = TranscriptModel.model_fields
    assert "session_id" in fields
    assert "meeting_id" in fields
    assert "raw_text" in fields
    assert "vosk_confidence" in fields


def test_minutes_model_has_session_id():
    fields = MinutesModel.model_fields
    assert "session_id" in fields
    assert "section_type" in fields


def test_todo_model_has_session_id():
    fields = TodoModel.model_fields
    assert "session_id" in fields
    assert "is_checked" in fields
    assert "is_manual" in fields
    assert "is_deleted" in fields


def test_summary_model_has_session_id():
    fields = SummaryModel.model_fields
    assert "session_id" in fields
    assert "summary_text" in fields
