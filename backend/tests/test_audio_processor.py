import pytest
import os
import wave
import struct
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock
from app.services.audio_processor import AudioProcessor


def make_wav_bytes(num_frames: int = 16000) -> bytes:
    """16kHz mono 16bit WAV bytes in memory."""
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


def test_validate_model_raises_when_missing():
    with patch("app.services.audio_processor.Path") as mock_path:
        mock_path.return_value.exists.return_value = False
        proc = AudioProcessor.__new__(AudioProcessor)
        proc.model_path = Path("/nonexistent/model")
        proc.model = None
        with pytest.raises(ValueError, match="Vosk"):
            proc.validate_model()


def test_audio_processor_init_raises_when_model_missing(monkeypatch):
    monkeypatch.setenv("VOSK_MODEL_PATH", "/nonexistent/model")
    with pytest.raises(ValueError, match="Vosk"):
        AudioProcessor()


def test_transcribe_returns_dict_with_required_keys():
    proc = AudioProcessor.__new__(AudioProcessor)
    proc.sample_rate = 16000

    mock_model = MagicMock()
    mock_rec = MagicMock()
    mock_rec.AcceptWaveform.return_value = True
    mock_rec.Result.return_value = '{"text": "テスト発言", "result": []}'
    mock_rec.FinalResult.return_value = '{"text": ""}'

    with patch("app.services.audio_processor.KaldiRecognizer", return_value=mock_rec):
        proc.model = mock_model
        wav_bytes = make_wav_bytes()
        result = proc._transcribe_wav_bytes(wav_bytes)

    assert "text" in result
    assert "confidence" in result


def test_transcribe_raises_on_corrupt_wav():
    proc = AudioProcessor.__new__(AudioProcessor)
    proc.sample_rate = 16000
    proc.model = MagicMock()

    with pytest.raises(Exception):
        proc._transcribe_wav_bytes(b"not a valid wav file")
