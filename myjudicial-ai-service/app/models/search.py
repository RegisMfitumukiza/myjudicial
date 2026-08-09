"""Pydantic models for vector search requests and responses"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ExpertSearchRequest(BaseModel):
    """Request model for expert search"""
    query: str = Field(..., description="Search query or case description", min_length=3, max_length=1000)
    specialty: Optional[str] = Field(None, description="Filter by legal specialty")
    max_budget: Optional[int] = Field(None, description="Maximum hourly rate in RWF", ge=0)
    min_rating: Optional[float] = Field(None, description="Minimum expert rating (0-5)", ge=0, le=5)
    limit: int = Field(default=10, description="Maximum number of results", ge=1, le=50)
    similarity_threshold: Optional[float] = Field(None, description="Minimum similarity score (0-1)", ge=0, le=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "I need help with a land boundary dispute",
                "specialty": "LAND_LAW",
                "max_budget": 200000,
                "min_rating": 4.0,
                "limit": 10,
                "similarity_threshold": 0.5
            }
        }


class ExpertResult(BaseModel):
    """Expert search result"""
    id: str = Field(..., description="Expert UUID")
    user_id: Optional[str] = Field(None, description="Associated user UUID")
    full_name: str = Field(..., description="Expert's full name")
    specialties: Optional[List[str]] = Field(None, description="Legal specialties array")
    bio: Optional[str] = Field(None, description="Expert biography")
    hourly_rate: Optional[int] = Field(None, description="Hourly rate in RWF")
    rating: Optional[float] = Field(None, description="Expert rating (0-5)")
    languages: Optional[List[str]] = Field(None, description="Languages spoken")
    skills: Optional[List[str]] = Field(None, description="Professional skills")
    education: Optional[str] = Field(None, description="Education background")
    years_of_experience: Optional[int] = Field(None, description="Years of experience")
    location: Optional[str] = Field(None, description="Location/city")
    availability: Optional[str] = Field(None, description="Availability status")
    profile_image_url: Optional[str] = Field(None, description="Profile image URL")
    similarity_score: float = Field(..., description="Similarity score (0-1)", ge=0, le=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "full_name": "John Doe",
                "specialties": "LAND_LAW",
                "bio": "Experienced property law attorney specializing in land disputes",
                "hourly_rate": 50000,
                "rating": 4.5,
                "languages": ["English", "French", "Kinyarwanda"],
                "skills": ["Land law", "Contract negotiation", "Court representation"],
                "education": "LLB, University of Rwanda",
                "years_of_experience": 10,
                "location": "Kigali",
                "availability": "AVAILABLE",
                "profile_image_url": "https://example.com/profile.jpg",
                "similarity_score": 0.89
            }
        }


class SearchFilters(BaseModel):
    """Search filters applied"""
    specialty: Optional[str] = Field(None, description="Specialty filter")
    max_budget: Optional[int] = Field(None, description="Budget filter")
    min_rating: Optional[float] = Field(None, description="Rating filter")
    similarity_threshold: float = Field(..., description="Similarity threshold")


class ExpertSearchResponse(BaseModel):
    """Response model for expert search"""
    success: bool = Field(..., description="Whether search was successful")
    query: str = Field(..., description="Original search query")
    results: List[ExpertResult] = Field(..., description="List of matching experts")
    total: int = Field(..., description="Total number of results")
    filters: SearchFilters = Field(..., description="Filters applied")
    processing_time: float = Field(..., description="Processing time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "I need help with a land dispute",
                "results": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "full_name": "John Doe",
                        "specialty": "LAND_LAW",
                        "bio": "Expert in land disputes",
                        "hourly_rate": 50000,
                        "rating": 4.5,
                        "similarity_score": 0.89
                    }
                ],
                "total": 5,
                "filters": {
                    "specialty": "LAND_LAW",
                    "max_budget": 200000,
                    "min_rating": 4.0,
                    "similarity_threshold": 0.5
                },
                "processing_time": 0.15
            }
        }


class CaseBasedSearchRequest(BaseModel):
    """Request model for case-based expert search"""
    case_analysis: Dict[str, Any] = Field(..., description="Case analysis output from /analyze endpoint")
    limit: int = Field(default=10, description="Maximum number of results", ge=1, le=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "case_analysis": {
                    "specialty": "LAND_LAW",
                    "urgency_level": "MEDIUM",
                    "budget_range": {"min": 50000, "max": 200000, "currency": "RWF"},
                    "key_entities": ["land", "dispute", "boundary"]
                },
                "limit": 10
            }
        }


class SimilarExpertsRequest(BaseModel):
    """Request model for finding similar experts"""
    expert_id: str = Field(..., description="Expert UUID to find similar experts for")
    limit: int = Field(default=10, description="Maximum number of results", ge=1, le=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "expert_id": "123e4567-e89b-12d3-a456-426614174000",
                "limit": 10
            }
        }


class EmbeddingGenerationRequest(BaseModel):
    """Request model for generating embeddings (admin only)"""
    expert_ids: Optional[List[str]] = Field(None, description="Specific expert IDs (optional, null = all)")
    force_regenerate: bool = Field(default=False, description="Regenerate even if embedding exists")
    
    class Config:
        json_schema_extra = {
            "example": {
                "expert_ids": None,
                "force_regenerate": False
            }
        }


class EmbeddingGenerationResponse(BaseModel):
    """Response model for embedding generation"""
    success: bool = Field(..., description="Whether generation was successful")
    total_experts: int = Field(..., description="Total experts processed")
    embeddings_generated: int = Field(..., description="Number of embeddings generated")
    embeddings_skipped: int = Field(..., description="Number skipped (already had embeddings)")
    failed: int = Field(..., description="Number of failures")
    processing_time: float = Field(..., description="Total processing time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "total_experts": 100,
                "embeddings_generated": 95,
                "embeddings_skipped": 5,
                "failed": 0,
                "processing_time": 45.3
            }
        }


class EmbeddingStats(BaseModel):
    """Statistics about embeddings"""
    total_experts: int = Field(..., description="Total approved experts")
    experts_with_embeddings: int = Field(..., description="Experts with embeddings")
    experts_without_embeddings: int = Field(..., description="Experts without embeddings")
    embedding_coverage_percentage: float = Field(..., description="Coverage percentage")
    first_embedding_generated: Optional[datetime] = Field(None, description="First embedding timestamp")
    last_embedding_generated: Optional[datetime] = Field(None, description="Last embedding timestamp")
    embedding_models_used: int = Field(..., description="Number of different models used")


class SearchError(BaseModel):
    """Error response for search"""
    detail: str = Field(..., description="Error message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Search failed: Invalid query"
            }
        }

