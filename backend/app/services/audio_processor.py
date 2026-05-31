import io
import json
import wave
import struct
import structlog
from pathlib import Path
from typing import Any
from app.config import settings

_ALLOWED_EXTENSIONS = frozenset([".wav", ".webm", ".ogg", ".mp3"])

# (extension, magic_bytes_options) — MP3 has multiple valid sync patterns
_MAGIC_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    ".wav": (b"RIFF",),
    ".webm": (b"\x1a\x45\xdf\xa3",),
    ".ogg": (b"OggS",),
    ".mp3": (b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2", b"\xff\xe3"),
}

logger = structlog.get_logger(__name__)

try:
    from vosk import Model, KaldiRecognizer
except ImportError as exc:
    raise ImportError("vosk パッケージが必要です: pip install vosk") from exc


class AudioProcessor:
    def __init__(self) -> None:
        self.model_path = Path(settings.VOSK_MODEL_PATH)
        self.sample_rate = 16000
        self.validate_model()
        self.model = Model(str(self.model_path))
        logger.info("vosk_model_loaded", path=str(self.model_path))

    def validate_model(self) -> None:
        if not self.model_path.exists():
            raise ValueError(
                f"Vosk モデルが見つかりません: {self.model_path}\n"
                "vosk-model-ja-0.22 を backend/models/ に配置してください。"
            )

    def process(self, file_bytes: bytes, filename: str) -> dict[str, Any]:
        suffix = self._validate_file(file_bytes, filename)
        wav_bytes = self._ensure_wav(file_bytes, suffix)
        result = self._transcribe_wav_bytes(wav_bytes)
        duration_sec = self._get_duration(wav_bytes)
        logger.info(
            "audio_processed",
            filename=filename,
            duration_sec=duration_sec,
            confidence=result["confidence"],
        )
        return {
            "raw_text": result["text"],
            "confidence": result["confidence"],
            "duration_sec": duration_sec,
        }

    def _validate_file(self, file_bytes: bytes, filename: str) -> str:
        suffix = Path(filename).suffix.lower()
        if suffix not in _ALLOWED_EXTENSIONS:
            raise ValueError(
                f"対応していないファイル形式です。対応形式: {', '.join(_ALLOWED_EXTENSIONS)}"
            )
        signatures = _MAGIC_SIGNATURES.get(suffix, ())
        if signatures and not any(file_bytes[:4].startswith(sig[:4]) for sig in signatures):
            raise ValueError("ファイルの内容が拡張子と一致しません。")
        return suffix

    def _ensure_wav(self, file_bytes: bytes, suffix: str) -> bytes:
        if suffix == ".wav":
            return file_bytes
        try:
            from pydub import AudioSegment
        except ImportError as exc:
            raise ImportError("pydub パッケージが必要です: pip install pydub") from exc

        fmt_map = {".mp3": "mp3", ".ogg": "ogg", ".webm": "webm"}
        fmt = fmt_map[suffix]
        audio = AudioSegment.from_file(io.BytesIO(file_bytes), format=fmt)
        audio = audio.set_frame_rate(self.sample_rate).set_channels(1).set_sample_width(2)
        buf = io.BytesIO()
        audio.export(buf, format="wav")
        return buf.getvalue()

    def _transcribe_wav_bytes(self, wav_bytes: bytes) -> dict[str, Any]:
        with wave.open(io.BytesIO(wav_bytes)) as wf:
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
                raise ValueError("WAV must be mono 16-bit PCM")
            rate = wf.getframerate()

        rec = KaldiRecognizer(self.model, rate)
        rec.SetWords(True)

        texts: list[str] = []
        confidences: list[float] = []

        with wave.open(io.BytesIO(wav_bytes)) as wf:
            while True:
                data = wf.readframes(4000)
                if not data:
                    break
                if rec.AcceptWaveform(data):
                    part = json.loads(rec.Result())
                    if part.get("text"):
                        texts.append(part["text"])
                    for w in part.get("result", []):
                        if "conf" in w:
                            confidences.append(w["conf"])

        final = json.loads(rec.FinalResult())
        if final.get("text"):
            texts.append(final["text"])
        for w in final.get("result", []):
            if "conf" in w:
                confidences.append(w["conf"])

        full_text = " ".join(texts)
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        return {"text": full_text, "confidence": avg_conf}

    def _get_duration(self, wav_bytes: bytes) -> int:
        with wave.open(io.BytesIO(wav_bytes)) as wf:
            return wf.getnframes() // wf.getframerate()
