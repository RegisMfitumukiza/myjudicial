"""Vector search service for expert matching"""
from typing import List, Dict, Any, Optional
import logging
import time

from app.services.embedding_service import embedding_service
from app.db.repositories.expert_repository import expert_repository
from app.config import settings

logger = logging.getLogger(__name__)


class VectorSearchService:
    """Service for vector-based expert search"""
    
    async def search_experts(
        self,
        query: str,
        specialty: Optional[str] = None,
        max_budget: Optional[int] = None,
        min_rating: Optional[float] = None,
        limit: int = 10,
        similarity_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Search for experts using semantic similarity
        
        Args:
            query: User's search query or case description
            specialty: Filter by legal specialty
            max_budget: Maximum hourly rate in RWF
            min_rating: Minimum expert rating (0-5)
            limit: Maximum number of results
            similarity_threshold: Minimum similarity score (0-1)
        
        Returns:
            Dictionary with search results and metadata
        """
        start_time = time.time()
        
        try:
            # Step 1: Generate embedding for query
            logger.info(f"Generating embedding for query: {query[:100]}...")
            query_embedding = await embedding_service.generate_embedding(query)
            
            # Step 2: Search similar experts in database
            logger.info("Searching for similar experts...")
            experts = await expert_repository.search_similar_experts(
                query_embedding=query_embedding,
                specialty=specialty,
                max_budget=max_budget,
                min_rating=min_rating,
                limit=limit,
                similarity_threshold=similarity_threshold
            )
            
            processing_time = time.time() - start_time
            
            logger.info(
                f"Found {len(experts)} experts in {processing_time:.3f}s "
                f"(specialty={specialty}, budget≤{max_budget}, rating≥{min_rating})"
            )
            
            return {
                "success": True,
                "query": query,
                "results": experts,
                "total": len(experts),
                "filters": {
                    "specialty": specialty,
                    "max_budget": max_budget,
                    "min_rating": min_rating,
                    "similarity_threshold": similarity_threshold or settings.SIMILARITY_THRESHOLD
                },
                "processing_time": processing_time
            }
        
        except Exception as e:
            logger.error(f"Expert search failed: {e}", exc_info=True)
            raise Exception(f"Expert search failed: {str(e)}")
    
    async def search_experts_by_case_analysis(
        self,
        case_analysis: Dict[str, Any],
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search experts based on case analysis output
        
        Args:
            case_analysis: Output from analyze_case (specialty, budget, etc.)
            limit: Maximum number of results
        
        Returns:
            Dictionary with search results
        """
        start_time = time.time()
        
        try:
            # Extract filters from case analysis
            specialties = case_analysis.get("specialty")  # Note: case analysis returns singular "specialty"
            budget_range = case_analysis.get("budget_range", {})
            max_budget = budget_range.get("max")
            
            # Create search query from key entities
            key_entities = case_analysis.get("key_entities", [])
            query = " ".join(key_entities) if key_entities else "legal expert"
            
            logger.info(
                f"Searching experts for case: specialty={specialties}, "
                f"budget={max_budget}, query='{query}'"
            )
            
            # Search experts — skip similarity threshold when specialty is a direct match
            effective_threshold = None if specialties else settings.SIMILARITY_THRESHOLD
            logger.info(f"[Pipeline-2a] Query text: '{query}'")
            logger.info(f"[Pipeline-2a] similarity_threshold={effective_threshold} "
                        f"({'skipped - specialty match' if specialties else 'applied'})")
            result = await self.search_experts(
                query=query,
                specialty=specialties,
                max_budget=max_budget,
                min_rating=None,
                similarity_threshold=effective_threshold,
                limit=limit
            )
            
            # Add case analysis context
            result["case_analysis"] = case_analysis
            result["processing_time"] = time.time() - start_time
            
            return result
        
        except Exception as e:
            logger.error(f"Case-based search failed: {e}", exc_info=True)
            raise Exception(f"Case-based search failed: {str(e)}")
    
    async def get_similar_experts_by_id(
        self,
        expert_id: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Find experts similar to a given expert
        
        Args:
            expert_id: Expert UUID
            limit: Maximum number of results
        
        Returns:
            Dictionary with similar experts
        """
        start_time = time.time()
        
        try:
            # Get the expert's profile
            expert = await expert_repository.get_expert_by_id(expert_id)
            
            if not expert:
                raise Exception(f"Expert not found: {expert_id}")
            
            if not expert.get("has_embedding"):
                raise Exception(f"Expert has no embedding: {expert_id}")
            
            # Create search query from expert's profile
            query_parts = []
            if expert.get("specialties"):
                # Handle specialties as array
                specialties = expert["specialties"]
                if isinstance(specialties, list):
                    query_parts.append(" ".join(specialties))
                else:
                    query_parts.append(str(specialties))
            if expert.get("bio"):
                query_parts.append(expert["bio"][:200])
            
            query = " ".join(query_parts)
            
            # Search for similar experts (use first specialty if array)
            search_specialty = None
            if expert.get("specialties"):
                specialties = expert["specialties"]
                if isinstance(specialties, list) and len(specialties) > 0:
                    search_specialty = specialties[0]
                else:
                    search_specialty = str(specialties)
            
            result = await self.search_experts(
                query=query,
                specialty=search_specialty,
                limit=limit + 1  # +1 to account for the expert itself
            )
            
            # Remove the expert itself from results
            result["results"] = [
                e for e in result["results"] 
                if e["id"] != expert_id
            ][:limit]
            
            result["reference_expert"] = {
                "id": expert["id"],
                "full_name": expert["full_name"],
                "specialties": expert["specialties"]
            }
            result["processing_time"] = time.time() - start_time
            
            return result
        
        except Exception as e:
            logger.error(f"Similar expert search failed: {e}", exc_info=True)
            raise Exception(f"Similar expert search failed: {str(e)}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check vector search service health"""
        try:
            # Check embedding service
            embedding_health = await embedding_service.health_check()
            
            # Check database stats
            stats = await expert_repository.get_embedding_stats()
            
            # Determine overall status
            status = "healthy"
            if embedding_health["status"] != "healthy":
                status = "degraded"
            elif stats.get("experts_with_embeddings", 0) == 0:
                status = "degraded"
            
            return {
                "status": status,
                "service": "vector_search",
                "embedding_service": embedding_health,
                "database_stats": stats
            }
        
        except Exception as e:
            logger.error(f"Vector search health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "vector_search",
                "error": str(e)
            }


# Global instance
vector_search_service = VectorSearchService()

