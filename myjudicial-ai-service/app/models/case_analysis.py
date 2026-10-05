"""Pydantic models for case analysis requests and responses"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class LegalSpecialty(str, Enum):
    """Legal specialty enumeration — must match Prisma schema"""
    FAMILY_LAW = "FAMILY_LAW"
    COMMERCIAL_LAW = "COMMERCIAL_LAW"
    EMPLOYMENT_LAW = "EMPLOYMENT_LAW"
    LAND_LAW = "LAND_LAW"
    CRIMINAL_LAW = "CRIMINAL_LAW"
    TAX_LAW = "TAX_LAW"
    IMMIGRATION_LAW = "IMMIGRATION_LAW"
    CORPORATE_LAW = "CORPORATE_LAW"
    CONTRACT_LAW = "CONTRACT_LAW"
    INTELLECTUAL_PROPERTY = "INTELLECTUAL_PROPERTY"
    OTHER = "OTHER"


class UrgencyLevel(str, Enum):
    """Urgency level enumeration"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class BudgetRange(BaseModel):
    """Budget range in RWF"""
    min: int = Field(..., description="Minimum budget in RWF")
    max: int = Field(..., description="Maximum budget in RWF")
    currency: str = Field(default="RWF", description="Currency code")


class CaseAnalysisRequest(BaseModel):
    """Request model for case analysis"""
    text: str = Field(..., description="User's description of legal issue", min_length=1, max_length=10000)
    language: str = Field(default="en", description="Language of the input text")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I have a land dispute with my neighbor. They claim the boundary is on my property. I have the title deed.",
                "language": "en"
            }
        }


class SuggestedDocument(BaseModel):
    """A suggested document with explanation"""
    document: str = Field(..., description="Document name")
    reason: str = Field(..., description="Why this document is needed")


class CaseAnalysis(BaseModel):
    """Case analysis output"""
    specialty: str = Field(..., description="Identified legal specialty")
    urgency_level: str = Field(..., description="Urgency level assessment")
    jurisdiction: str = Field(default="RWANDA", description="Jurisdiction")
    budget_range: BudgetRange = Field(..., description="Estimated budget range")
    key_entities: List[str] = Field(..., description="Key legal terms and entities")
    suggested_documents: List[Any] = Field(..., description="Documents user should bring (strings or objects)")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Analysis confidence score")
    reasoning: Optional[str] = Field(None, description="Why this specialty was chosen")
    possible_legal_issues: Optional[List[str]] = Field(None, description="Specific legal issues identified")
    is_greeting: Optional[bool] = Field(default=False, description="Whether input was a conversational greeting")
    greeting_message: Optional[str] = Field(default=None, description="Conversational greeting message if applicable")


class CaseAnalysisResponse(BaseModel):
    """Response model for case analysis"""
    success: bool = Field(..., description="Whether analysis was successful")
    analysis: CaseAnalysis = Field(..., description="Structured case analysis")
    llm_model: str = Field(..., description="LLM model used for analysis")
    processing_time: float = Field(..., description="Processing time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "analysis": {
                    "specialty": "LAND_LAW",
                    "urgency_level": "MEDIUM",
                    "jurisdiction": "RWANDA",
                    "budget_range": {
                        "min": 50000,
                        "max": 200000,
                        "currency": "RWF"
                    },
                    "key_entities": ["land", "boundary dispute", "title deed", "neighbor"],
                    "suggested_documents": [
                        "Title deed (Certificate foncier)",
                        "Land survey report",
                        "Photos of boundary markers",
                        "Communication records with neighbor"
                    ],
                    "confidence_score": 0.89
                },
                "llm_model": "qwen2.5:latest",
                "processing_time": 1.25
            }
        }


class CaseAnalysisError(BaseModel):
    """Error response for case analysis"""
    detail: str = Field(..., description="Error message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Case analysis failed: Unable to determine legal specialty"
            }
        }
