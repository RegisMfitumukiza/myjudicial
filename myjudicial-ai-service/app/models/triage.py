"""Pydantic models for full triage requests and responses"""
from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.case_analysis import CaseAnalysis


class TriageRequest(BaseModel):
    """Request model for full triage"""
    input_type: str = Field(..., description="Input type: 'audio' or 'text'")
    text: Optional[str] = Field(None, description="Text input (if input_type='text')")
    language: str = Field(default="auto", description="Language code (en, fr, rw, auto)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "input_type": "text",
                "text": "I have a land dispute with my neighbor",
                "language": "en"
            }
        }


class TriageResponse(BaseModel):
    """Response model for full triage"""
    success: bool = Field(..., description="Whether triage was successful")
    transcription: Optional[str] = Field(None, description="Transcribed text (if audio input)")
    original_language: str = Field(..., description="Detected or specified language")
    analysis: CaseAnalysis = Field(..., description="Legal case analysis")
    processing_time: float = Field(..., description="Total processing time in seconds")
    steps_completed: List[str] = Field(..., description="List of processing steps completed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "transcription": None,
                "original_language": "en",
                "analysis": {
                    "specialty": "LAND_LAW",
                    "urgency_level": "MEDIUM",
                    "jurisdiction": "RWANDA",
                    "budget_range": {"min": 50000, "max": 200000, "currency": "RWF"},
                    "key_entities": ["land", "dispute", "neighbor"],
                    "suggested_documents": ["Title deed", "Survey report"],
                    "confidence_score": 0.87
                },
                "processing_time": 3.5,
                "steps_completed": ["text_analysis", "case_classification"]
            }
        }


class TriageError(BaseModel):
    """Error response for triage"""
    detail: str = Field(..., description="Error message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Triage failed: Invalid input type"
            }
        }
