"""Case analysis endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging

from app.models.case_analysis import (
    CaseAnalysisRequest,
    CaseAnalysisResponse,
    CaseAnalysisError,
    CaseAnalysis
)
from app.services.llm_service import llm_service
from app.api.dependencies import api_key_required

logger = logging.getLogger(__name__)

# API key authentication for case analysis (enforce in production)
api_key_dependency = api_key_required(skip_api_key_endpoints=True)
router = APIRouter(dependencies=[Depends(api_key_dependency)])


@router.post(
    "/",
    response_model=CaseAnalysisResponse,
    responses={
        400: {"model": CaseAnalysisError},
        500: {"model": CaseAnalysisError}
    },
    summary="Analyze legal case from description",
    description="""
    Analyze a user's legal issue and extract structured information.
    
    **Extracts:**
    - Legal specialty (LAND_LAW, FAMILY_LAW, etc.)
    - Urgency level (LOW, MEDIUM, HIGH, CRITICAL)
    - Estimated budget range in RWF
    - Key legal entities and terms
    - Suggested documents to bring
    
    **Use cases:**
    - Legal case triage
    - Expert matching preparation
    - Client intake automation
    """
)
async def analyze_case(request: CaseAnalysisRequest):
    """
    Analyze legal case from user description
    
    Returns structured case analysis with specialty, urgency, budget, etc.
    """
    
    try:
        logger.info(
            f"Case analysis request: language={request.language}, "
            f"text length={len(request.text)}"
        )
        
        # Analyze case
        result = await llm_service.analyze_case(
            text=request.text,
            language=request.language
        )
        
        # Validate analysis structure
        analysis_data = result["analysis"]

        # Dynamic budget estimation from real database expert stats
        b_range = analysis_data.get("budget_range") or {}
        if not b_range.get("min") and not b_range.get("max"):
            try:
                from app.db.repositories.expert_repository import expert_repository
                specialty = analysis_data.get("specialty")
                fee_stats = await expert_repository.get_specialty_fee_stats(specialty)
                if fee_stats.get("expert_count", 0) > 0:
                    analysis_data["budget_range"] = {
                        "min": fee_stats["min"],
                        "max": fee_stats["max"],
                        "avg": fee_stats["avg"],
                        "currency": "RWF"
                    }
                else:
                    all_stats = await expert_repository.get_specialty_fee_stats()
                    if all_stats.get("expert_count", 0) > 0:
                        analysis_data["budget_range"] = {
                            "min": all_stats["p25"],
                            "max": all_stats["p75"],
                            "avg": all_stats["avg"],
                            "currency": "RWF"
                        }
            except Exception as fee_err:
                logger.warning(f"Failed to fetch dynamic fee stats: {fee_err}")

        analysis = CaseAnalysis(**analysis_data)
        
        return CaseAnalysisResponse(
            success=result["success"],
            analysis=analysis,
            llm_model=result["llm_model"],
            processing_time=result["processing_time"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Case analysis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Case analysis failed: {str(e)}"
        )


@router.get(
    "/specialties",
    summary="Get supported legal specialties",
    description="Returns list of legal specialties the system can identify"
)
async def get_legal_specialties():
    """Get list of supported legal specialties"""
    return {
        "success": True,
        "specialties": [
            {"code": "FAMILY_LAW", "name": "Family Law"},
            {"code": "COMMERCIAL_LAW", "name": "Commercial Law"},
            {"code": "EMPLOYMENT_LAW", "name": "Employment Law"},
            {"code": "LAND_LAW", "name": "Land Law"},
            {"code": "CRIMINAL_LAW", "name": "Criminal Law"},
            {"code": "TAX_LAW", "name": "Tax Law"},
            {"code": "IMMIGRATION_LAW", "name": "Immigration Law"},
            {"code": "CORPORATE_LAW", "name": "Corporate Law"},
            {"code": "CONTRACT_LAW", "name": "Contract Law"},
            {"code": "INTELLECTUAL_PROPERTY", "name": "Intellectual Property"},
            {"code": "OTHER", "name": "Other"}
        ]
    }


@router.get(
    "/health",
    summary="Check case analysis service health",
    description="Verify LLM service is ready for case analysis",
)
async def analysis_health():
    """Health check for case analysis service"""
    try:
        health = await llm_service.health_check()
        
        if health["status"] == "healthy":
            return {
                "status": "healthy",
                "service": "case_analysis",
                "llm_status": health
            }
        else:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "unhealthy",
                    "service": "case_analysis",
                    "error": "LLM service not available",
                    "llm_status": health
                }
            )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "case_analysis",
                "error": str(e)
            }
        )
