"""Audio transcription endpoints"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging

from app.models.transcription import (
    TranscriptionResponse,
    TranscriptionError
)
from app.services.whisper_service import whisper_service
from app.api.dependencies import api_key_required

logger = logging.getLogger(__name__)

# API key authentication for transcription (enforce in production)
api_key_dependency = api_key_required(skip_api_key_endpoints=True)
router = APIRouter(dependencies=[Depends(api_key_dependency)])


@router.post(
    "/",
    response_model=TranscriptionResponse,
    responses={
        400: {"model": TranscriptionError},
        500: {"model": TranscriptionError}
    },
    summary="Transcribe audio to text",
    description="""
    Upload an audio file and get transcription using Whisper AI.
    
    **Supported formats:** WAV, MP3, M4A, OGG, FLAC, WebM
    
    **Supported languages:**
    - English (en)
    - French (fr)
    - Kinyarwanda (rw)
    - Auto-detect (auto)
    
    **Max file size:** 25MB
    """
)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Form("en", description="Language code (en/fr/rw/auto)"),
    task: str = Form("transcribe", description="Task: 'transcribe' or 'translate'")
):
    """
    Transcribe audio file to text using Whisper
    
    Returns transcription with timestamps, detected language, and confidence scores
    """
    
    # Validate file
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        # Also accept common audio types that might not have correct content-type
        allowed_extensions = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".webm"}
        file_ext = audio.filename.lower().split(".")[-1] if audio.filename else ""
        if f".{file_ext}" not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Please upload an audio file."
            )
    
    # Validate language
    supported_languages = ["en", "fr", "rw", "sw", "auto"]
    if language not in supported_languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language '{language}'. Use: {', '.join(supported_languages)}"
        )
    
    # Validate task
    if task not in ["transcribe", "translate"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task must be 'transcribe' or 'translate'"
        )
    
    try:
        # Read audio bytes
        audio_bytes = await audio.read()
        
        # Check file size (25MB limit)
        max_size = 25 * 1024 * 1024  # 25MB
        if len(audio_bytes) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file too large. Maximum size is 25MB."
            )
        
        logger.info(
            f"Received transcription request: "
            f"file={audio.filename}, size={len(audio_bytes)} bytes, "
            f"language={language}, task={task}"
        )
        
        # Transcribe
        result = await whisper_service.transcribe(
            audio_bytes=audio_bytes,
            language=language if language != "auto" else None,
            task=task
        )
        
        return TranscriptionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )


@router.get(
    "/languages",
    summary="Get supported languages",
    description="Returns list of supported languages for transcription",
)
async def get_supported_languages():
    """Get list of languages supported by Whisper"""
    return {
        "success": True,
        "languages": whisper_service.get_supported_languages()
    }


@router.get(
    "/health",
    summary="Check transcription service health",
    description="Verify Whisper service is ready"
)
async def transcription_health():
    """Health check for transcription service"""
    try:
        # Check if we can load the model
        model_loaded = whisper_service.model is not None
        
        return {
            "status": "healthy",
            "service": "transcription",
            "model": whisper_service.model_name,
            "device": whisper_service.device,
            "model_loaded": model_loaded
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )
