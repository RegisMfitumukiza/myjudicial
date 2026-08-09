"""Pydantic models for translation requests and responses"""
from pydantic import BaseModel, Field
from typing import Optional


class TranslationRequest(BaseModel):
    """Request model for translation"""
    text: str = Field(..., description="Text to translate", min_length=1, max_length=10000)
    source_language: str = Field(..., description="Source language code (en, fr, rw)")
    target_language: str = Field(..., description="Target language code (en, fr, rw)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I need a legal expert about a property dispute.",
                "source_language": "en",
                "target_language": "fr"
            }
        }


class TranslationResponse(BaseModel):
    """Response model for translation"""
    success: bool = Field(..., description="Whether translation was successful")
    original_text: str = Field(..., description="Original text")
    translated_text: str = Field(..., description="Translated text")
    source_language: str = Field(..., description="Source language code")
    target_language: str = Field(..., description="Target language code")
    llm_model: str = Field(..., description="LLM model used for translation")
    processing_time: float = Field(..., description="Processing time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "original_text": "I need a legal expert about a property dispute.",
                "translated_text": "J'ai besoin d'un expert juridique pour un litige foncier.",
                "source_language": "en",
                "target_language": "fr",
                "llm_model": "qwen2.5:latest",
                "processing_time": 0.85
            }
        }


class TranslationError(BaseModel):
    """Error response for translation"""
    detail: str = Field(..., description="Error message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Translation failed: Unsupported language pair"
            }
        }
