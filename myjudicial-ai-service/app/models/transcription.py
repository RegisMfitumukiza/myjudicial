"""Transcription request/response models"""
from pydantic import BaseModel, Field
from typing import Optional, List


class TranscriptionRequest(BaseModel):
    """Request model for audio transcription"""
    language: Optional[str] = Field(
        default="en",
        description="Language code (en, fr, rw, auto for auto-detect)"
    )
    task: Optional[str] = Field(
        default="transcribe",
        description="Task type: 'transcribe' or 'translate'"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "language": "en",
                "task": "transcribe"
            }
        }


class TranscriptionSegment(BaseModel):
    """Individual segment of transcription"""
    id: int
    start: float = Field(description="Start time in seconds")
    end: float = Field(description="End time in seconds")
    text: str
    confidence: Optional[float] = Field(default=None, description="Confidence score 0-1")


class TranscriptionResponse(BaseModel):
    """Response model for transcription"""
    success: bool
    text: str = Field(description="Complete transcription text")
    language: str = Field(description="Detected/specified language")
    duration: Optional[float] = Field(default=None, description="Audio duration in seconds")
    segments: Optional[List[TranscriptionSegment]] = Field(
        default=None,
        description="Word-level segments with timestamps"
    )
    model_used: str = Field(description="Whisper model used")
    processing_time: Optional[float] = Field(
        default=None,
        description="Processing time in seconds"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "text": "I need legal advice about a property dispute.",
                "language": "en",
                "duration": 5.2,
                "model_used": "base",
                "processing_time": 1.3
            }
        }


class TranscriptionError(BaseModel):
    """Error response for transcription failures"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None
