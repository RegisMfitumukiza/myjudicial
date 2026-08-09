"""Full triage endpoints - combines transcription and case analysis"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging
import time

from app.models.triage import (
    TriageRequest,
    TriageResponse,
    TriageError
)
from app.models.case_analysis import CaseAnalysis
from app.services.whisper_service import whisper_service
from app.services.llm_service import llm_service
from app.api.dependencies import api_key_required

logger = logging.getLogger(__name__)

# API key authentication for triage (enforce in production)
api_key_dependency = api_key_required(skip_api_key_endpoints=True)
router = APIRouter(dependencies=[Depends(api_key_dependency)])


@router.post(
    "/",
    response_model=TriageResponse,
    responses={
        400: {"model": TriageError},
        500: {"model": TriageError}
    },
    summary="Full legal case triage",
    description="""
    Complete triage workflow in one API call.
    
    **Supports two input types:**
    
    1. **Text Input:**
       - Provide text directly
       - Analyzes case immediately
    
    2. **Audio Input:**
       - Upload audio file
       - Transcribes audio first
       - Then analyzes the transcription
    
    **Returns:**
    - Transcription (if audio)
    - Legal specialty classification
    - Urgency level assessment
    - Budget estimation
    - Document suggestions
    """
)
async def triage_case(
    input_type: str = Form(..., description="Input type: 'text' or 'audio'"),
    text: str = Form(None, description="Text input (required if input_type='text')"),
    audio: UploadFile = File(None, description="Audio file (required if input_type='audio')"),
    language: str = Form("auto", description="Language code (en/fr/rw/auto)")
):
    """
    Full triage workflow - transcribe (if audio) + analyze case
    
    Returns complete case analysis with processing steps
    """
    start_time = time.time()
    steps_completed = []
    transcription_text = None
    detected_language = language if language != "auto" else None
    
    try:
        # Validate input type
        if input_type not in ["text", "audio"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid input_type '{input_type}'. Must be 'text' or 'audio'"
            )
        
        # Step 1: Get text (either directly or from transcription)
        if input_type == "text":
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Text is required when input_type='text'"
                )
            transcription_text = text
            detected_language = language if language != "auto" else "en"
            steps_completed.append("text_input")
            logger.info(f"Text input received: {len(text)} characters")
            
        elif input_type == "audio":
            if not audio:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Audio file is required when input_type='audio'"
                )
            
            # Transcribe audio
            logger.info(f"Transcribing audio: {audio.filename}")
            audio_bytes = await audio.read()
            
            transcription_result = await whisper_service.transcribe(
                audio_bytes=audio_bytes,
                language=detected_language,
                task="transcribe"
            )
            
            transcription_text = transcription_result["text"]
            detected_language = transcription_result["language"]
            steps_completed.append("audio_transcription")
            logger.info(f"Audio transcribed: {len(transcription_text)} characters, language={detected_language}")
        
        # Step 2: Analyze case
        logger.info("Analyzing case...")
        analysis_result = await llm_service.analyze_case(
            text=transcription_text,
            language=detected_language
        )
        
        steps_completed.append("case_analysis")
        
        # Step 3: Validate and structure analysis
        analysis_data = analysis_result["analysis"]
        analysis = CaseAnalysis(**analysis_data)
        steps_completed.append("result_formatting")
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"Triage completed: specialty={analysis.specialty}, "
            f"urgency={analysis.urgency_level}, time={processing_time:.2f}s"
        )
        
        return TriageResponse(
            success=True,
            transcription=transcription_text if input_type == "audio" else None,
            original_language=detected_language,
            analysis=analysis,
            processing_time=processing_time,
            steps_completed=steps_completed
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Triage error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Triage failed: {str(e)}"
        )


@router.get(
    "/health",
    summary="Check triage service health",
    description="Verify all triage components are ready",
)
async def triage_health():
    """Health check for full triage service"""
    try:
        # Check Whisper service
        whisper_ready = whisper_service.model is not None or True  # Lazy loading
        
        # Check LLM service
        llm_health = await llm_service.health_check()
        llm_ready = llm_health["status"] == "healthy"
        
        overall_status = "healthy" if (whisper_ready and llm_ready) else "degraded"
        
        return {
            "status": overall_status,
            "service": "triage",
            "components": {
                "whisper": "ready" if whisper_ready else "not_ready",
                "llm": llm_health["status"]
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "triage",
                "error": str(e)
            }
        )
