"""Recommendation endpoints for expert matching with intelligent ranking"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging
from typing import Optional

from app.models.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    AudioRecommendationRequest,
    AudioRecommendationResponse,
    AnalysisRecommendationRequest,
    ScoringWeightsRequest,
    ScoringWeightsResponse,
    ExplanationResponse,
    RecommendationError
)
from app.services.recommendation_service import recommendation_service
from app.services.ranking_service import ScoringWeights
from app.api.dependencies import api_key_required

logger = logging.getLogger(__name__)

# API key authentication for recommendations (enforce in production)
api_key_dependency = api_key_required(skip_api_key_endpoints=True)
router = APIRouter(dependencies=[Depends(api_key_dependency)])


@router.post(
    "/",
    response_model=RecommendationResponse,
    responses={
        400: {"model": RecommendationError},
        500: {"model": RecommendationError}
    },
    summary="Get expert recommendations from text",
    description="""
    Get intelligent expert recommendations from case description.
    
    **Complete Workflow:**
    1. **Analyze case** - Extract specialty, budget, urgency
    2. **Vector search** - Find semantically similar experts
    3. **Multi-factor scoring** - Score by similarity, rating, budget, reviews, experience
    4. **Intelligent ranking** - Rank by composite score
    5. **Generate explanations** - Explain why each expert matches
    
    **Scoring Factors:**
    - Similarity (40%) - How well expert matches case description
    - Rating (25%) - Expert's average rating
    - Budget (15%) - How well fee fits user's budget
    - Reviews (10%) - Social proof from review count
    - Experience (5%) - Years of experience
    - Specialty (5%) - Exact specialty match bonus
    
    **Example:**
    ```json
    {
        "query": "I have a land boundary dispute with my neighbor",
        "max_budget": 150000,
        "urgency": "MEDIUM",
        "limit": 10
    }
    ```
    
    Returns ranked experts with scores and explanations.
    """
)
async def get_recommendations(request: RecommendationRequest):
    """
    Get expert recommendations from case description text
    
    Returns ranked list of experts with scores and explanations
    """
    try:
        query = request.get_query()
        logger.info(
            f"Recommendation request: query='{query[:50]}...', "
            f"budget={request.max_budget}, urgency={request.urgency}"
        )
        
        # Get recommendations
        result = await recommendation_service.recommend_from_text(
            query=query,
            max_budget=request.max_budget,
            urgency=request.urgency.value if request.urgency else None,
            limit=request.limit
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recommendation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation failed: {str(e)}"
        )


@router.post(
    "/from-audio",
    response_model=AudioRecommendationResponse,
    responses={
        400: {"model": RecommendationError},
        500: {"model": RecommendationError}
    },
    summary="Get expert recommendations from audio",
    description="""
    Get expert recommendations from audio case description.
    
    **Complete Workflow:**
    1. **Transcribe audio** - Convert speech to text (Whisper)
    2. **Analyze case** - Extract case details
    3. **Search & rank** - Find and rank matching experts
    4. **Generate explanations** - Explain recommendations
    
    **Audio Support:**
    - Formats: MP3, WAV, M4A, WEBM, OGG
    - Languages: English, French, Kinyarwanda (auto-detect)
    - Max size: 25MB
    
    **Form Parameters:**
    - `audio`: Audio file (required)
    - `language`: Language code (optional, default: auto)
    - `max_budget`: Budget in RWF (optional)
    - `urgency`: LOW, MEDIUM, HIGH, CRITICAL (optional)
    - `limit`: Number of results (optional, default: 10)
    """
)
async def get_recommendations_from_audio(
    audio: UploadFile = File(..., description="Audio file with case description"),
    language: str = Form(default="auto", description="Audio language (auto, en, fr, rw)"),
    max_budget: Optional[int] = Form(None, description="Maximum budget in RWF"),
    urgency: Optional[str] = Form(None, description="Case urgency (LOW, MEDIUM, HIGH, CRITICAL)"),
    limit: int = Form(default=10, description="Number of recommendations", ge=1, le=50)
):
    """
    Get expert recommendations from audio case description
    
    Returns recommendations with transcription
    """
    try:
        logger.info(
            f"Audio recommendation request: filename={audio.filename}, "
            f"language={language}, budget={max_budget}"
        )
        
        # Read audio file
        audio_bytes = await audio.read()
        
        if len(audio_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file is empty"
            )
        
        if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file too large (max 25MB)"
            )
        
        # Get recommendations
        result = await recommendation_service.recommend_from_audio(
            audio_bytes=audio_bytes,
            language=language,
            max_budget=max_budget,
            urgency=urgency,
            limit=limit
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio recommendation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio recommendation failed: {str(e)}"
        )


@router.post(
    "/from-analysis",
    response_model=RecommendationResponse,
    responses={
        400: {"model": RecommendationError},
        500: {"model": RecommendationError}
    },
    summary="Get recommendations from case analysis",
    description="""
    Get expert recommendations from existing case analysis.
    
    **Use Case:**
    When you already have case analysis from `/analyze` endpoint,
    use this endpoint to get recommendations directly.
    
    **Workflow:**
    1. Call POST /api/v1/analyze/ to analyze case
    2. Get case_analysis output
    3. Call this endpoint with case_analysis
    
    **Benefits:**
    - Skip re-analysis if you already have it
    - Faster response time
    - Use custom analysis parameters
    """
)
async def get_recommendations_from_analysis(request: AnalysisRecommendationRequest):
    """
    Get expert recommendations from existing case analysis
    
    Returns ranked recommendations based on analysis
    """
    try:
        logger.info(
            f"Analysis-based recommendation: specialty={request.case_analysis.get('specialty')}"
        )
        
        # Get recommendations
        result = await recommendation_service.recommend_from_analysis(
            case_analysis=request.case_analysis,
            query=request.query or "",
            limit=request.limit
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis-based recommendation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis-based recommendation failed: {str(e)}"
        )


@router.get(
    "/{expert_id}/explain",
    response_model=ExplanationResponse,
    responses={
        400: {"model": RecommendationError},
        404: {"model": RecommendationError},
        500: {"model": RecommendationError}
    },
    summary="Explain expert recommendation",
    description="""
    Get detailed explanation of why an expert was recommended.
    
    **Use Case:**
    User wants to understand why a specific expert matches their case.
    
    **Query Parameters:**
    - `case_analysis`: JSON string with case analysis data (required)
    
    **Returns:**
    - Detailed score breakdown
    - Explanation of each scoring factor
    - Strengths and considerations
    """
)
async def explain_recommendation(
    expert_id: str,
    case_analysis: str
):
    """
    Generate detailed explanation for expert recommendation
    
    Explains scoring factors and why expert matches case
    """
    try:
        import json
        
        logger.info(f"Explanation request for expert: {expert_id}")
        
        # Parse case analysis
        try:
            analysis_dict = json.loads(case_analysis)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid case_analysis JSON"
            )
        
        # Generate explanation
        result = await recommendation_service.explain_recommendation(
            expert_id=expert_id,
            case_analysis=analysis_dict
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        logger.error(f"Explanation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explanation failed: {str(e)}"
        )


@router.post(
    "/weights",
    response_model=ScoringWeightsResponse,
    responses={
        400: {"model": RecommendationError},
        500: {"model": RecommendationError}
    },
    summary="Configure scoring weights (Admin)",
    description="""
    Configure scoring weights for recommendation algorithm.
    
    **Admin Operation** - Customize how experts are scored.
    
    **Scoring Factors:**
    - similarity: Semantic match to case (default: 0.40)
    - rating: Expert rating (default: 0.25)
    - budget: Budget fit (default: 0.15)
    - reviews: Review count (default: 0.10)
    - experience: Years of experience (default: 0.05)
    - specialty: Exact specialty match (default: 0.05)
    
    **Requirements:**
    - All weights must be between 0 and 1
    - Weights must sum to 1.0
    
    **Predefined Profiles:**
    - Balanced (default): 0.40, 0.25, 0.15, 0.10, 0.05, 0.05
    - Quality-first: 0.30, 0.40, 0.10, 0.15, 0.05, 0.00
    - Budget-conscious: 0.35, 0.15, 0.35, 0.10, 0.05, 0.00
    """
)
async def configure_weights(request: ScoringWeightsRequest):
    """
    Configure scoring weights (admin operation)
    
    Updates the weighting algorithm for recommendations
    """
    try:
        logger.info(f"Weight configuration request: {request}")
        
        # Validate weights sum
        if not request.validate_sum():
            total = (request.similarity + request.rating + request.budget + 
                    request.reviews + request.experience + request.specialty)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weights must sum to 1.0 (got {total:.3f})"
            )
        
        # Update weights in service (would typically save to config/database)
        from app.services.ranking_service import ranking_service
        
        new_weights = ScoringWeights(
            similarity=request.similarity,
            rating=request.rating,
            budget=request.budget,
            reviews=request.reviews,
            experience=request.experience,
            specialty=request.specialty
        )
        
        ranking_service.weights = new_weights
        
        logger.info(f"Weights updated successfully: {new_weights}")
        
        return ScoringWeightsResponse(
            similarity=new_weights.similarity,
            rating=new_weights.rating,
            budget=new_weights.budget,
            reviews=new_weights.reviews,
            experience=new_weights.experience,
            specialty=new_weights.specialty,
            profile_name="custom"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Weight configuration error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weight configuration failed: {str(e)}"
        )


@router.get(
    "/weights",
    response_model=ScoringWeightsResponse,
    summary="Get current scoring weights",
    description="Get the current scoring weights configuration",
)
async def get_weights():
    """Get current scoring weights"""
    try:
        from app.services.ranking_service import ranking_service
        
        weights = ranking_service.weights
        
        return ScoringWeightsResponse(
            similarity=weights.similarity,
            rating=weights.rating,
            budget=weights.budget,
            reviews=weights.reviews,
            experience=weights.experience,
            specialty=weights.specialty,
            profile_name="balanced"
        )
    
    except Exception as e:
        logger.error(f"Get weights error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get weights: {str(e)}"
        )


@router.get(
    "/health",
    summary="Check recommendation service health",
    description="Verify recommendation service and dependencies are ready",
)
async def recommendation_health():
    """Health check for recommendation service"""
    try:
        health = await recommendation_service.health_check()
        
        if health["status"] == "healthy":
            return health
        else:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=health
            )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "recommendation",
                "error": str(e)
            }
        )


