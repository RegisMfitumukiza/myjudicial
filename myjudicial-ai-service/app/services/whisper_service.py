"""Whisper audio transcription service"""
import tempfile
import time
from pathlib import Path
from typing import Optional, Tuple
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class WhisperService:
    """
    Service for transcribing audio using OpenAI Whisper
    
    Supports multiple languages including English, French, and Kinyarwanda
    """
    
    def __init__(self):
        self.model = None
        self.model_name = settings.WHISPER_MODEL
        self.device = settings.WHISPER_DEVICE
        
    def _load_model(self):
        """Lazy load Whisper model (only when first needed)"""
        if self.model is None:
            try:
                import whisper
                logger.info(f"Loading Whisper model: {self.model_name}")
                self.model = whisper.load_model(
                    self.model_name,
                    device=self.device
                )
                logger.info(f"Whisper model loaded successfully on {self.device}")
            except Exception as e:
                logger.error(f"Failed to load Whisper model: {e}")
                raise
        return self.model
    
    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = "en",
        task: str = "transcribe"
    ) -> dict:
        """
        Transcribe audio bytes to text
        
        Args:
            audio_bytes: Raw audio file bytes (wav, mp3, m4a, etc.)
            language: Language code (en, fr, rw) or None for auto-detect
            task: 'transcribe' or 'translate' (translate to English)
            
        Returns:
            dict with transcription results
            
        Raises:
            Exception if transcription fails
        """
        start_time = time.time()
        
        # Save audio to temporary file
        temp_path = None
        try:
            # Create temp file with appropriate extension
            with tempfile.NamedTemporaryFile(
                suffix=".wav",
                delete=False
            ) as tmp_file:
                tmp_file.write(audio_bytes)
                temp_path = tmp_file.name
            
            logger.info(f"Transcribing audio file: {temp_path} (language={language})")
            
            # Load model (lazy loading)
            model = self._load_model()
            
            # Prepare Whisper options
            options = {
                "task": task,
                "fp16": False,  # Disable FP16 for CPU
            }
            
            # Add language if specified (not auto-detect)
            if language and language != "auto":
                # Map language codes
                lang_map = {
                    "en": "english",
                    "fr": "french",
                    "rw": "kinyarwanda",
                    "sw": "swahili"
                }
                whisper_lang = lang_map.get(language, language)
                options["language"] = whisper_lang
            
            # Transcribe
            result = model.transcribe(
                temp_path,
                **options
            )
            
            processing_time = time.time() - start_time
            
            # Extract segments with timestamps
            segments = []
            if "segments" in result:
                for seg in result["segments"]:
                    segments.append({
                        "id": seg["id"],
                        "start": seg["start"],
                        "end": seg["end"],
                        "text": seg["text"].strip(),
                        "confidence": seg.get("no_speech_prob", None)
                    })
            
            logger.info(
                f"Transcription completed in {processing_time:.2f}s. "
                f"Language: {result.get('language', 'unknown')}"
            )
            
            return {
                "success": True,
                "text": result["text"].strip(),
                "language": result.get("language", language or "unknown"),
                "segments": segments if segments else None,
                "model_used": self.model_name,
                "processing_time": round(processing_time, 2)
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Transcription failed after {processing_time:.2f}s: {e}")
            raise Exception(f"Transcription failed: {str(e)}")
            
        finally:
            # Clean up temp file
            if temp_path and Path(temp_path).exists():
                try:
                    Path(temp_path).unlink()
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {temp_path}: {e}")
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return [
            {"code": "en", "name": "English"},
            {"code": "fr", "name": "French"},
            {"code": "rw", "name": "Kinyarwanda"},
            {"code": "sw", "name": "Swahili"},
            {"code": "auto", "name": "Auto-detect"}
        ]


# Singleton instance
whisper_service = WhisperService()
