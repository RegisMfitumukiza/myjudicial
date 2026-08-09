"""Pydantic models for expert recommendation requests and responses"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class UrgencyLevel(str, Enum):
    """Case urgency levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RecommendationRequest(BaseModel):
    """Request model for expert recommendations"""
    query: Optional[str] = Field(None, description="Case description text", min_length=10, max_length=2000)
    text: Optional[str] = Field(None, description="Case description text (alias for query)", min_length=10, max_length=2000)
    max_budget: Optional[int] = Field(None, description="Maximum budget in RWF", ge=0)
    urgency: Optional[UrgencyLevel] = Field(None, description="Case urgency level")
    limit: int = Field(default=10, description="Number of recommendations", ge=1, le=50)
    
    def get_query(self) -> str:
        """Return query from either field"""
        return self.query or self.text or ""
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "text": "I have a land boundary dispute with my neighbor. They claim part of my property.",
                "max_budget": 150000,
                "urgency": "MEDIUM",
                "limit": 10
            }
        }


class AudioRecommendationRequest(BaseModel):
    """Request model for audio-based recommendations"""
    language: str = Field(default="auto", description="Audio language (auto, en, fr, rw)")
    max_budget: Optional[int] = Field(None, description="Maximum budget in RWF", ge=0)
    urgency: Optional[UrgencyLevel] = Field(None, description="Case urgency level")
    limit: int = Field(default=10, description="Number of recommendations", ge=1, le=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "language": "auto",
                "max_budget": 150000,
                "urgency": "MEDIUM",
                "limit": 10
            }
        }


class AnalysisRecommendationRequest(BaseModel):
    """Request model for recommendations from case analysis"""
    case_analysis: Dict[str, Any] = Field(..., description="Case analysis output")
    query: Optional[str] = Field(None, description="Original user query text")
    limit: int = Field(default=10, description="Number of recommendations", ge=1, le=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "case_analysis": {
                    "specialty": "LAND_LAW",
                    "urgency_level": "MEDIUM",
                    "budget_range": {"min": 50000, "max": 200000, "currency": "RWF"},
                    "key_entities": ["land", "boundary", "dispute"]
                },
                "limit": 10
            }
        }


class ScoringWeightsRequest(BaseModel):
    """Request model for configuring scoring weights (Admin)"""
    similarity: float = Field(..., description="Similarity weight", ge=0, le=1)
    rating: float = Field(..., description="Rating weight", ge=0, le=1)
    budget: float = Field(..., description="Budget weight", ge=0, le=1)
    reviews: float = Field(..., description="Review count weight", ge=0, le=1)
    experience: float = Field(..., description="Experience weight", ge=0, le=1)
    specialty: float = Field(..., description="Specialty match weight", ge=0, le=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "similarity": 0.40,
                "rating": 0.25,
                "budget": 0.15,
                "reviews": 0.10,
                "experience": 0.05,
                "specialty": 0.05
            }
        }
    
    def validate_sum(self) -> bool:
        """Validate weights sum to 1.0"""
        total = (self.similarity + self.rating + self.budget + 
                self.reviews + self.experience + self.specialty)
        return 0.99 <= total <= 1.01  # Allow small floating point errors


class ScoringWeightsResponse(BaseModel):
    """Response model for scoring weights"""
    similarity: float
    rating: float
    budget: float
    reviews: float
    experience: float
    specialty: float
    profile_name: str = Field(default="custom", description="Weight profile name")
    
    class Config:
        json_schema_extra = {
            "example": {
                "similarity": 0.40,
                "rating": 0.25,
                "budget": 0.15,
                "reviews": 0.10,
                "experience": 0.05,
                "specialty": 0.05,
                "profile_name": "balanced"
            }
        }


class ScoreBreakdown(BaseModel):
    """Detailed score breakdown"""
    similarity: float = Field(..., description="Similarity score (0-1)")
    rating: float = Field(..., description="Rating score (0-1)")
    budget: float = Field(..., description="Budget fit score (0-1)")
    reviews: float = Field(..., description="Review count score (0-1)")
    experience: float = Field(..., description="Experience score (0-1)")
    specialty: float = Field(..., description="Specialty match score (0.5-1.0)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "similarity": 0.89,
                "rating": 0.96,
                "budget": 0.90,
                "reviews": 0.75,
                "experience": 0.80,
                "specialty": 1.0
            }
        }


class ExplanationDetail(BaseModel):
    """Detailed explanation of recommendation"""
    summary: str = Field(..., description="One-sentence summary")
    match_quality: str = Field(..., description="Match quality: excellent, very good, good, fair")
    strengths: List[str] = Field(..., description="Expert's strengths for this case")
    considerations: Optional[List[str]] = Field(None, description="Things to consider")
    fit_score: float = Field(..., description="Overall fit score (0-1)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "summary": "Highly rated property law expert with excellent match to your case",
                "match_quality": "excellent",
                "strengths": [
                    "Specializes in land boundary disputes",
                    "4.8/5 rating from 45 clients",
                    "Well within your budget (120,000 RWF)",
                    "12 years of experience"
                ],
                "considerations": None,
                "fit_score": 0.87
            }
        }


class ExpertSummary(BaseModel):
    """Summary of expert for recommendation"""
    id: str = Field(..., description="Expert UUID")
    user_id: Optional[str] = Field(None, description="Associated user UUID")
    full_name: str = Field(..., description="Expert's full name")
    specialties: Optional[List[str]] = Field(None, description="Legal specialties")
    bio: Optional[str] = Field(None, description="Expert biography")
    hourly_rate: Optional[int] = Field(None, description="Hourly rate in RWF")
    rating: Optional[float] = Field(None, description="Expert rating (0-5)")
    review_count: int = Field(default=0, description="Number of reviews")
    languages: Optional[List[str]] = Field(None, description="Languages spoken")
    years_of_experience: Optional[int] = Field(None, description="Years of experience")
    location: Optional[str] = Field(None, description="Location/city")
    profile_image_url: Optional[str] = Field(None, description="Profile image URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "full_name": "John Doe",
                "specialties": ["LAND_LAW"],
                "bio": "Experienced property law attorney specializing in land disputes",
                "hourly_rate": 120000,
                "rating": 4.8,
                "review_count": 45,
                "languages": ["English", "French", "Kinyarwanda"],
                "years_of_experience": 12,
                "location": "Kigali",
                "profile_image_url": "https://example.com/profile.jpg"
            }
        }


class ExpertRecommendation(BaseModel):
    """Single expert recommendation with score and explanation"""
    expert: ExpertSummary = Field(..., description="Expert information")
    score: float = Field(..., description="Final recommendation score (0-1)", ge=0, le=1)
    rank: int = Field(..., description="Rank in recommendation list", ge=1)
    match_quality: str = Field(..., description="Match quality assessment")
    explanation: ExplanationDetail = Field(..., description="Detailed explanation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "expert": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "full_name": "John Doe",
                    "specialties": ["LAND_LAW"],
                    "hourly_rate": 120000,
                    "rating": 4.8,
                    "review_count": 45
                },
                "score": 0.87,
                "rank": 1,
                "match_quality": "excellent",
                "explanation": {
                    "summary": "Highly rated property law expert",
                    "match_quality": "excellent",
                    "strengths": ["Specializes in land disputes", "4.8/5 rating"],
                    "fit_score": 0.87
                }
            }
        }


class CaseAnalysisSummary(BaseModel):
    """Summary of case analysis"""
    specialty: Optional[str] = Field(None, description="Identified legal specialty")
    urgency_level: Optional[str] = Field(None, description="Case urgency")
    budget_range: Optional[Dict[str, Any]] = Field(None, description="Budget range")
    key_entities: Optional[List[str]] = Field(None, description="Key entities extracted")


class FiltersApplied(BaseModel):
    """Filters applied during recommendation"""
    specialty: Optional[str] = Field(None, description="Specialty filter")
    max_budget: Optional[int] = Field(None, description="Budget filter")
    min_score: float = Field(..., description="Minimum score threshold")


class RecommendationResponse(BaseModel):
    """Response model for expert recommendations"""
    success: bool = Field(..., description="Whether recommendation was successful")
    query: str = Field(..., description="Original query")
    case_analysis: CaseAnalysisSummary = Field(..., description="Case analysis summary")
    recommendations: List[ExpertRecommendation] = Field(..., description="Ranked recommendations")
    total: int = Field(..., description="Total recommendations returned")
    filters_applied: FiltersApplied = Field(..., description="Filters used")
    processing_time: float = Field(..., description="Processing time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "I have a land boundary dispute",
                "case_analysis": {
                    "specialty": "LAND_LAW",
                    "urgency_level": "MEDIUM",
                    "budget_range": {"min": 50000, "max": 200000, "currency": "RWF"},
                    "key_entities": ["land", "boundary", "dispute"]
                },
                "recommendations": [
                    {
                        "expert": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "full_name": "John Doe",
                            "specialties": ["LAND_LAW"],
                            "hourly_rate": 120000,
                            "rating": 4.8,
                            "review_count": 45
                        },
                        "score": 0.87,
                        "rank": 1,
                        "match_quality": "excellent",
                        "explanation": {
                            "summary": "Highly rated property law expert",
                            "match_quality": "excellent",
                            "strengths": ["Specializes in land disputes"],
                            "fit_score": 0.87
                        }
                    }
                ],
                "total": 3,
                "filters_applied": {
                    "specialty": "LAND_LAW",
                    "max_budget": 200000,
                    "min_score": 0.5
                },
                "processing_time": 0.35
            }
        }


class AudioRecommendationResponse(RecommendationResponse):
    """Response model for audio-based recommendations"""
    transcription: str = Field(..., description="Transcribed text")
    detected_language: Optional[str] = Field(None, description="Detected audio language")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "I have a land boundary dispute with my neighbor",
                "transcription": "I have a land boundary dispute with my neighbor. They claim...",
                "detected_language": "en",
                "case_analysis": {
                    "specialty": "LAND_LAW",
                    "urgency_level": "MEDIUM"
                },
                "recommendations": [],
                "total": 3,
                "filters_applied": {
                    "specialty": "LAND_LAW",
                    "min_score": 0.5
                },
                "processing_time": 8.5
            }
        }


class ExplanationResponse(BaseModel):
    """Detailed explanation for a specific expert recommendation"""
    success: bool = Field(..., description="Whether explanation was successful")
    expert_id: str = Field(..., description="Expert UUID")
    expert_name: str = Field(..., description="Expert name")
    final_score: float = Field(..., description="Final recommendation score")
    score_breakdown: ScoreBreakdown = Field(..., description="Detailed score breakdown")
    explanation: ExplanationDetail = Field(..., description="Human-readable explanation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "expert_id": "123e4567-e89b-12d3-a456-426614174000",
                "expert_name": "John Doe",
                "final_score": 0.87,
                "score_breakdown": {
                    "similarity": 0.89,
                    "rating": 0.96,
                    "budget": 0.90,
                    "reviews": 0.75,
                    "experience": 0.80,
                    "specialty": 1.0
                },
                "explanation": {
                    "summary": "Highly rated property law expert",
                    "match_quality": "excellent",
                    "strengths": ["Specializes in land disputes", "4.8/5 rating"],
                    "fit_score": 0.87
                }
            }
        }


class RecommendationError(BaseModel):
    """Error response for recommendations"""
    detail: str = Field(..., description="Error message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Recommendation failed: No matching experts found"
            }
        }


