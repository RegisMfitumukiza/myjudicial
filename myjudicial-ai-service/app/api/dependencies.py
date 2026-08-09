"""API authentication dependencies"""
from typing import Optional
from fastapi import Header, HTTPException, status, Request
from app.config import settings

PUBLIC_SUFFIXES = ("/health", "/languages", "/specialties", "/weights")


def _is_public_path(path: str) -> bool:
    return path.rstrip("/").endswith(PUBLIC_SUFFIXES)


def api_key_required(skip_api_key_endpoints: bool = False):
    """
    Dependency that enforces the X-API-Key header on all endpoints except
    public metadata/health routes (kept open for monitoring and the
    container healthcheck). In development (API_KEY starting with "dev-")
    the check is skipped so local tooling keeps working.
    """
    async def verify_api_key(
        request: Request,
        x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    ) -> str:
        if skip_api_key_endpoints and _is_public_path(request.url.path):
            return x_api_key or ""
        if settings.API_KEY.startswith("dev-"):
            return x_api_key or ""
        if x_api_key is None or x_api_key != settings.API_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "ApiKey"},
            )
        return x_api_key

    return verify_api_key