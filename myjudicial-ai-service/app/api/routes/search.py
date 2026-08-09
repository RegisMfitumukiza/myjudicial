"""Vector search endpoints for expert matching"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging

from app.models.search import (
    ExpertSearchRequest,
    ExpertSearchResponse,
    CaseBasedSearchRequest,
    SimilarExpertsRequest,
    EmbeddingGenerationRequest,
    EmbeddingGenerationResponse,
    EmbeddingStats,
    SearchError
)
from app.services.vector_search_service import vector_search_service
from app.services.embedding_service import embedding_service
from app.db.repositories.expert_repository import expert_repository
from app.api.dependencies import api_key_required

logger = logging.getLogger(__name__)

# API key authentication for vector search (enforce in production)
api_key_dependency = api_key_required(skip_api_key_endpoints=True)
router = APIRouter(dependencies=[Depends(api_key_dependency)])


@router.post(
    "/experts",
    response_model=ExpertSearchResponse,
    responses={
        400: {"model": SearchError},
        500: {"model": SearchError}
    },
    summary="Search experts by semantic similarity",
    description="""
    Search for legal experts using semantic similarity based on query text.
    
    **How it works:**
    1. Converts your query to a vector embedding
    2. Searches database for experts with similar profile embeddings
    3. Returns ranked results by similarity score
    
    **Filters:**
    - Specialty: Filter by legal domain (LAND_LAW, FAMILY_LAW, etc.)
    - Max budget: Filter by hourly rate
    - Min rating: Filter by expert rating
    - Similarity threshold: Minimum similarity score (0-1)
    
    **Example queries:**
    - "I need help with a land boundary dispute"
    - "Looking for a divorce lawyer who speaks Kinyarwanda"
    - "Expert in commercial contract negotiation"
    """
)
async def search_experts(request: ExpertSearchRequest):
    """
    Search for experts using semantic similarity
    
    Returns experts ranked by similarity to the query
    """
    try:
        logger.info(
            f"Expert search request: query='{request.query[:50]}...', "
            f"specialty={request.specialty}, max_budget={request.max_budget}"
        )
        
        # Perform search
        result = await vector_search_service.search_experts(
            query=request.query,
            specialty=request.specialty,
            max_budget=request.max_budget,
            min_rating=request.min_rating,
            limit=request.limit,
            similarity_threshold=request.similarity_threshold
        )
        
        return ExpertSearchResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Expert search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Expert search failed: {str(e)}"
        )


@router.post(
    "/experts/by-case",
    response_model=ExpertSearchResponse,
    responses={
        400: {"model": SearchError},
        500: {"model": SearchError}
    },
    summary="Search experts based on case analysis",
    description="""
    Search for experts based on output from `/analyze` endpoint.
    
    **Workflow:**
    1. Analyze case: POST /api/v1/analyze/
    2. Get case analysis with specialty, budget, key entities
    3. Use this endpoint to find matching experts
    
    **Benefits:**
    - Automatic specialty filtering
    - Budget-aware recommendations
    - Query built from case keywords
    """
)
async def search_experts_by_case(request: CaseBasedSearchRequest):
    """
    Search experts based on case analysis output
    
    Returns experts matching the analyzed case requirements
    """
    try:
        logger.info(
            f"Case-based search: specialty={request.case_analysis.get('specialty')}"
        )
        
        result = await vector_search_service.search_experts_by_case_analysis(
            case_analysis=request.case_analysis,
            limit=request.limit
        )
        
        return ExpertSearchResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Case-based search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Case-based search failed: {str(e)}"
        )


@router.post(
    "/experts/similar",
    response_model=ExpertSearchResponse,
    responses={
        400: {"model": SearchError},
        404: {"model": SearchError},
        500: {"model": SearchError}
    },
    summary="Find similar experts",
    description="""
    Find experts similar to a given expert.
    
    **Use cases:**
    - "Show me experts like John Doe"
    - Alternative expert recommendations
    - Expert discovery
    """
)
async def find_similar_experts(request: SimilarExpertsRequest):
    """
    Find experts similar to a given expert
    
    Returns experts with similar profiles and specialties
    """
    try:
        logger.info(f"Similar expert search: expert_id={request.expert_id}")
        
        result = await vector_search_service.get_similar_experts_by_id(
            expert_id=request.expert_id,
            limit=request.limit
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
        logger.error(f"Similar expert search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similar expert search failed: {str(e)}"
        )


@router.post(
    "/embeddings/generate",
    response_model=EmbeddingGenerationResponse,
    responses={
        500: {"model": SearchError}
    },
    summary="Generate embeddings for experts (Admin)",
    description="""
    Generate or regenerate embeddings for expert profiles.
    
    **Admin operation** - Use this to:
    - Generate embeddings for new experts
    - Regenerate all embeddings after model change
    - Update embeddings for specific experts
    
    **Note:** This can take several minutes for many experts.
    """
)
async def generate_expert_embeddings(request: EmbeddingGenerationRequest):
    """
    Generate embeddings for expert profiles
    
    This is an admin operation to create or update expert embeddings
    """
    try:
        import time
        start_time = time.time()
        
        logger.info(
            f"Embedding generation request: expert_ids={request.expert_ids}, "
            f"force_regenerate={request.force_regenerate}"
        )
        
        # Get experts to process
        if request.expert_ids:
            # Specific experts
            experts = []
            for expert_id in request.expert_ids:
                expert = await expert_repository.get_expert_by_id(expert_id)
                if expert:
                    experts.append(expert)
        else:
            # All active experts
            experts = await expert_repository.get_all_experts(status="VERIFIED")
        
        total_experts = len(experts)
        generated = 0
        skipped = 0
        failed = 0
        
        logger.info(f"Processing {total_experts} experts...")
        
        # Process each expert
        for expert in experts:
            try:
                # Skip if already has embedding (unless force regenerate)
                if expert.get("has_embedding") and not request.force_regenerate:
                    skipped += 1
                    continue
                
                # Create profile text
                profile_text = await embedding_service.create_expert_profile_text(expert)
                
                # Generate embedding
                embedding = await embedding_service.generate_embedding(profile_text)
                
                # Update in database
                success = await expert_repository.update_expert_embedding(
                    expert_id=expert["id"],
                    embedding=embedding,
                    model_name=embedding_service.model_name
                )
                
                if success:
                    generated += 1
                    logger.info(f"Generated embedding for expert: {expert['full_name']}")
                else:
                    failed += 1
                    logger.error(f"Failed to save embedding for expert: {expert['full_name']}")
            
            except Exception as e:
                failed += 1
                logger.error(
                    f"Failed to process expert {expert.get('full_name', 'unknown')}: {e}",
                    exc_info=True
                )
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"Embedding generation complete: {generated} generated, "
            f"{skipped} skipped, {failed} failed in {processing_time:.2f}s"
        )
        
        return EmbeddingGenerationResponse(
            success=True,
            total_experts=total_experts,
            embeddings_generated=generated,
            embeddings_skipped=skipped,
            failed=failed,
            processing_time=processing_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding generation failed: {str(e)}"
        )


@router.get(
    "/embeddings/stats",
    response_model=EmbeddingStats,
    summary="Get embedding statistics",
    description="Get statistics about expert embeddings in the database"
)
async def get_embedding_stats():
    """Get statistics about expert embeddings"""
    try:
        stats = await expert_repository.get_embedding_stats()
        return EmbeddingStats(**stats)
    
    except Exception as e:
        logger.error(f"Failed to get embedding stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get embedding stats: {str(e)}"
        )


@router.get(
    "/health",
    summary="Check vector search service health",
    description="Verify vector search components are ready",
)
async def search_health():
    """Health check for vector search service"""
    try:
        health = await vector_search_service.health_check()
        
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
                "service": "vector_search",
                "error": str(e)
            }
        )

