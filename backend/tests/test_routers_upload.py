import pytest
import io
import wave
import struct
import tempfile
import os
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient


def make_wav_bytes(num_frames: int = 16000) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        path = f.name
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(struct.pack("<" + "h" * num_frames, *([0] * num_frames)))
    with open(path, "rb") as f:
        data = f.read()
    os.unlink(path)
    return data


@pytest.fixture
def client():
    mock_model = MagicMock()
    mock_model.exists.return_value = True

    with patch("app.services.audio_processor.Path") as mock_path_cls, \
         patch("app.services.audio_processor.Model") as mock_model_cls:
        mock_path_cls.return_value.exists.return_value = True
        mock_model_cls.return_value = MagicMock()

        from app.main import create_app
        app = create_app()
        with TestClient(app, raise_server_exceptions=True) as c:
            yield c


def test_upload_honeypot_returns_200_silently(client):
    wav = make_wav_bytes()
    resp = client.post(
        "/api/upload",
        files={"file": ("test.wav", io.BytesIO(wav), "audio/wav")},
        data={"honeypot_field": "spam"},
    )
    assert resp.status_code == 200


def test_upload_file_too_large_returns_400(client):
    large_data = b"x" * (104857600 + 1)
    resp = client.post(
        "/api/upload",
        files={"file": ("big.wav", io.BytesIO(large_data), "audio/wav")},
        data={"honeypot_field": ""},
    )
    assert resp.status_code == 400


def test_upload_valid_wav_returns_200(client):
    wav = make_wav_bytes()
    with patch("app.routers.upload.AudioProcessor") as mock_ap_cls:
        mock_ap = MagicMock()
        mock_ap.process.return_value = {
            "raw_text": "テスト文章",
            "confidence": 0.9,
            "duration_sec": 1,
        }
        mock_ap_cls.return_value = mock_ap
        resp = client.post(
            "/api/upload",
            files={"file": ("test.wav", io.BytesIO(wav), "audio/wav")},
            data={"honeypot_field": ""},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert "meeting_id" in body
    assert "transcript_id" in body
    assert "raw_text" in body
    assert "vosk_confidence" in body
