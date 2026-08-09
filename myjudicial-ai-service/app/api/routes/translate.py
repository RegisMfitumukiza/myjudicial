"""Translation endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging

from app.models.translation import (
    TranslationRequest,
    TranslationResponse,
    TranslationError
)
from app.services.llm_service import llm_service
from app.api.dependencies import api_key_required

logger = logging.getLogger(__name__)

# API key authentication for translation (enforce in production)
api_key_dependency = api_key_required(skip_api_key_endpoints=True)
router = APIRouter(dependencies=[Depends(api_key_dependency)])

# Supported language codes
SUPPORTED_LANGUAGES = {"en", "fr", "rw"}


@router.post(
    "/",
    response_model=TranslationResponse,
    responses={
        400: {"model": TranslationError},
        500: {"model": TranslationError}
    },
    summary="Translate text between languages",
    description="""
    Translate text between supported languages using LLM.
    
    **Supported languages:**
    - English (en)
    - French (fr)
    - Kinyarwanda (rw)
    
    **Common use cases:**
    - Translate case descriptions for multilingual support
    - Convert legal documents between languages
    - Translate user messages in chat
    """
)
async def translate_text(request: TranslationRequest):
    """
    Translate text from source language to target language
    
    Returns translated text with metadata
    """
    
    # Validate languages
    if request.source_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported source language '{request.source_language}'. "
                   f"Supported: {', '.join(SUPPORTED_LANGUAGES)}"
        )
    
    if request.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported target language '{request.target_language}'. "
                   f"Supported: {', '.join(SUPPORTED_LANGUAGES)}"
        )
    
    # Check if same language
    if request.source_language == request.target_language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and target languages must be different"
        )
    
    try:
        logger.info(
            f"Translation request: {request.source_language} -> {request.target_language}, "
            f"text length={len(request.text)}"
        )
        
        # Translate
        result = await llm_service.translate(
            text=request.text,
            source_language=request.source_language,
            target_language=request.target_language
        )
        
        return TranslationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}"
        )


@router.get(
    "/languages",
    summary="Get supported languages",
    description="Returns list of supported languages for translation"
)
async def get_supported_languages():
    """Get list of languages supported for translation"""
    return {
        "success": True,
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "fr", "name": "French"},
            {"code": "rw", "name": "Kinyarwanda"}
        ]
    }


@router.get(
    "/health",
    summary="Check translation service health",
    description="Verify LLM service is ready for translation",
)
async def translation_health():
    """Health check for translation service"""
    try:
        health = await llm_service.health_check()
        
        if health["status"] == "healthy":
            return {
                "status": "healthy",
                "service": "translation",
                "llm_status": health
            }
        else:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "unhealthy",
                    "service": "translation",
                    "error": "LLM service not available",
                    "llm_status": health
                }
            )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "translation",
                "error": str(e)
            }
        )
