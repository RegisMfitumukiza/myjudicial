"""Integration tests for the transcription endpoint using a mocked Whisper service."""
import io

import pytest

from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    # No context manager: avoids triggering the startup event (DB connect).
    return TestClient(app)


@pytest.fixture
def mock_whisper(monkeypatch):
    class FakeWhisper:
        model = None
        model_name = "base.en"
        device = "cpu"

        async def transcribe(self, audio_bytes, language="en", task="transcribe"):
            return {
                "success": True,
                "text": "This is a transcribed legal statement.",
                "language": language or "en",
                "segments": None,
                "model_used": self.model_name,
                "processing_time": 0.5,
            }

        def get_supported_languages(self):
            return [
                {"code": "en", "name": "English"},
                {"code": "fr", "name": "French"},
                {"code": "rw", "name": "Kinyarwanda"},
                {"code": "sw", "name": "Swahili"},
                {"code": "auto", "name": "Auto-detect"},
            ]

    monkeypatch.setattr("app.api.routes.transcribe.whisper_service", FakeWhisper())
    return FakeWhisper()


def _audio_file(content=b"fake audio bytes", name="audio.wav", content_type="audio/wav"):
    return {"audio": (name, content, content_type)}


class TestTranscribeValidation:
    def test_invalid_file_type(self, client, api_headers):
        files = _audio_file(content=b"not audio", name="notes.txt", content_type="text/plain")
        response = client.post("/api/v1/transcribe/", files=files, headers=api_headers)
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]

    def test_unsupported_language(self, client, api_headers):
        files = _audio_file()
        response = client.post("/api/v1/transcribe/", files=files, data={"language": "de"}, headers=api_headers)
        assert response.status_code == 400
        assert "Unsupported language" in response.json()["detail"]

    def test_unsupported_task(self, client, api_headers):
        files = _audio_file()
        response = client.post("/api/v1/transcribe/", files=files, data={"task": "summarize"}, headers=api_headers)
        assert response.status_code == 400
        assert "Task must be" in response.json()["detail"]

    def test_oversized_audio_rejected(self, client, api_headers):
        big = b"0" * (25 * 1024 * 1024 + 1)
        files = _audio_file(content=big)
        response = client.post("/api/v1/transcribe/", files=files, headers=api_headers)
        assert response.status_code == 400
        assert "too large" in response.json()["detail"]


class TestTranscribeSuccess:
    def test_valid_audio(self, client, mock_whisper, api_headers):
        files = _audio_file()
        response = client.post(
            "/api/v1/transcribe/", files=files, data={"language": "en", "task": "transcribe"}, headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["text"] == "This is a transcribed legal statement."

    def test_languages_endpoint(self, client, mock_whisper):
        response = client.get("/api/v1/transcribe/languages")
        assert response.status_code == 200
        codes = {lang["code"] for lang in response.json()["languages"]}
        assert codes == {"en", "fr", "rw", "sw", "auto"}

    def test_health_endpoint(self, client, mock_whisper):
        response = client.get("/api/v1/transcribe/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestTranscribeAuth:
    def test_missing_key_rejected(self, client):
        files = _audio_file()
        response = client.post("/api/v1/transcribe/", files=files)
        assert response.status_code == 401

    def test_invalid_key_rejected(self, client, mock_whisper):
        files = _audio_file()
        response = client.post(
            "/api/v1/transcribe/", files=files, headers={"X-API-Key": "wrong-key"}
        )
        assert response.status_code == 401
