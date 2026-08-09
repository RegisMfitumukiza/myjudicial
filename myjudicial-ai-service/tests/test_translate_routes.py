"""Integration tests for the translation endpoint using a mocked LLM service."""
import pytest

from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    # No context manager: avoids triggering the startup event (DB connect).
    return TestClient(app)


@pytest.fixture
def mock_llm(monkeypatch):
    """Replace the llm_service singleton in the translate route module."""
    class FakeLLM:
        async def translate(self, text, source_language, target_language):
            return {
                "success": True,
                "original_text": text,
                "translated_text": "Bonjour le monde",
                "source_language": source_language,
                "target_language": target_language,
                "llm_model": "fake-model",
                "llm_provider": "fake",
                "processing_time": 0.01,
            }

        async def health_check(self):
            return {"status": "healthy", "provider": "fake"}

    monkeypatch.setattr("app.api.routes.translate.llm_service", FakeLLM())
    return FakeLLM()


class TestTranslateValidation:
    def test_unsupported_source_language(self, client, api_headers):
        response = client.post(
            "/api/v1/translate/",
            json={"text": "hello world", "source_language": "de", "target_language": "fr"},
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "Unsupported source language" in response.json()["detail"]

    def test_unsupported_target_language(self, client, api_headers):
        response = client.post(
            "/api/v1/translate/",
            json={"text": "hello world", "source_language": "en", "target_language": "de"},
            headers=api_headers,
        )
        assert response.status_code == 400

    def test_same_language_rejected(self, client, api_headers):
        response = client.post(
            "/api/v1/translate/",
            json={"text": "hello world", "source_language": "en", "target_language": "en"},
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "must be different" in response.json()["detail"]

    def test_missing_text_rejected(self, client, api_headers):
        response = client.post(
            "/api/v1/translate/",
            json={"source_language": "en", "target_language": "fr"},
            headers=api_headers,
        )
        assert response.status_code == 422


class TestTranslateSuccess:
    def test_valid_translation(self, client, mock_llm, api_headers):
        response = client.post(
            "/api/v1/translate/",
            json={"text": "Hello world", "source_language": "en", "target_language": "fr"},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["translated_text"] == "Bonjour le monde"
        assert data["source_language"] == "en"
        assert data["target_language"] == "fr"

    def test_languages_endpoint(self, client):
        response = client.get("/api/v1/translate/languages")
        assert response.status_code == 200
        assert response.json()["success"] is True
        codes = {lang["code"] for lang in response.json()["languages"]}
        assert codes == {"en", "fr", "rw"}


class TestTranslateAuth:
    def test_missing_key_rejected(self, client):
        response = client.post(
            "/api/v1/translate/",
            json={"text": "hello world", "source_language": "en", "target_language": "fr"},
        )
        assert response.status_code == 401

    def test_invalid_key_rejected(self, client):
        response = client.post(
            "/api/v1/translate/",
            json={"text": "hello world", "source_language": "en", "target_language": "fr"},
            headers={"X-API-Key": "wrong-key"},
        )
        assert response.status_code == 401
