"""Pytest configuration for MyJudicial AI service tests.

Ensures the repo root is on sys.path so `import app` works, and provides
minimal env vars so pydantic-settings can build Settings() without a .env file
(e.g. in CI).
"""
import os
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

os.environ.setdefault("API_KEY", "test-api-key")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
# Keep tests offline and provider-agnostic.
os.environ.setdefault("LLM_PROVIDER", "ollama")
os.environ.setdefault("DEBUG", "false")


@pytest.fixture(autouse=True)
def _no_network_calls(monkeypatch):
    """Block any accidental real network calls during tests."""
    import httpx

    async def _blocked(*args, **kwargs):
        raise RuntimeError("Network access is disabled during tests. Mock the service instead.")

    monkeypatch.setattr(httpx.AsyncClient, "post", _blocked)
    monkeypatch.setattr(httpx.AsyncClient, "get", _blocked)
    monkeypatch.setattr(httpx.AsyncClient, "request", _blocked)


@pytest.fixture
def api_headers():
    """Headers carrying the API key required by authenticated endpoints."""
    from app.config import settings

    return {"X-API-Key": settings.API_KEY}
