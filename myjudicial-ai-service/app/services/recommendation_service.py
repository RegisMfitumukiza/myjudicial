"""Recommendation service orchestrating the full recommendation flow"""
import logging
import time
from typing import Dict, Any, List, Optional

from app.services.llm_service import llm_service
from app.services.vector_search_service import vector_search_service
from app.services.ranking_service import ranking_service, ScoringWeights
from app.models.recommendation import (
    RecommendationResponse,
    CaseAnalysisSummary,
    FiltersApplied,
)
from app.config import settings

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for generating expert recommendations"""
    
    def __init__(self):
        self.default_weights = ScoringWeights()
        logger.info("Recommendation service initialized")
    
    async def recommend_from_text(
        self,
        query: str,
        max_budget: Optional[int] = None,
        urgency: Optional[str] = None,
        limit: int = None,
        weights: Optional[ScoringWeights] = None
    ) -> RecommendationResponse:
        """
        Get expert recommendations from text query
        
        Workflow:
        1. Analyze case with LLM (Phase 3)
        2. Vector search for candidates (Phase 4)
        3. Score and rank candidates (Phase 5)
        4. Generate explanations
        
        Args:
            query: User's case description
            max_budget: Optional budget override
            urgency: Optional urgency level
            limit: Number of recommendations to return
            weights: Optional custom scoring weights
        
        Returns:
            RecommendationResponse model
        """
        start_time = time.time()
        limit = limit or settings.RECOMMENDATION_LIMIT
        weights = weights or self.default_weights
        
        try:
            # Step 1: Analyze case
            logger.info(f"[Pipeline-1] Analyzing case: {query[:100]}...")
            case_analysis = await llm_service.analyze_case(query)
            
            if not case_analysis.get("success"):
                raise Exception("Failed to analyze case")
            
            analysis = case_analysis["analysis"]
            logger.info(f"[Pipeline-1] LLM classified: specialty={analysis.get('specialty')}, "
                        f"urgency={analysis.get('urgency_level')}, "
                        f"entities={analysis.get('key_entities', [])}")
            
            # If greeting or unclassified general query, return without searching experts
            if analysis.get("is_greeting") or analysis.get("specialty") == "UNKNOWN" or analysis.get("confidence_score", 1.0) == 0:
                processing_time = time.time() - start_time
                logger.info(f"Greeting or general inquiry, returning response without expert candidates ({processing_time:.2f}s)")
                return self._build_response(
                    success=True, query=query, analysis=analysis,
                    recommendations=[], processing_time=processing_time,
                )

            # Dynamic budget estimation from real expert data
            from app.db.repositories.expert_repository import expert_repository
            specialty = analysis.get("specialty")
            fee_stats = await expert_repository.get_specialty_fee_stats(specialty)
            
            if fee_stats["expert_count"] > 0:
                analysis["budget_range"] = {
                    "min": fee_stats["p25"],
                    "max": fee_stats["p75"],
                    "avg": fee_stats["avg"],
                    "currency": "RWF"
                }
                logger.info(f"Dynamic budget for {specialty}: {fee_stats['p25']}-{fee_stats['p75']} RWF (n={fee_stats['expert_count']})")
            else:
                # Fallback: use overall stats
                all_stats = await expert_repository.get_specialty_fee_stats()
                if all_stats["expert_count"] > 0:
                    analysis["budget_range"] = {
                        "min": all_stats["p25"],
                        "max": all_stats["p75"],
                        "avg": all_stats["avg"],
                        "currency": "RWF"
                    }
                else:
                    analysis["budget_range"] = {"min": 0, "max": 0, "currency": "RWF"}
            
            # Override budget if user provided
            if max_budget:
                analysis["budget_range"]["max"] = max_budget
            
            # Override urgency if provided
            if urgency:
                analysis["urgency_level"] = urgency
            
            # Step 2: Vector search for candidates
            logger.info(f"[Pipeline-2] Searching for expert candidates (specialty={specialty})...")
            search_results = await vector_search_service.search_experts_by_case_analysis(
                case_analysis=analysis,
                limit=limit * 3  # Get more candidates for better ranking
            )
            
            processing_time = time.time() - start_time
            logger.info(f"[Pipeline-2] Vector search returned: {search_results.get('total', 0)} candidates in {processing_time:.2f}s")

            if not search_results.get("success") or not search_results.get("results"):
                return self._build_response(
                    success=True, query=query, analysis=analysis,
                    recommendations=[], processing_time=processing_time,
                )
            
            candidates = search_results["results"]
            
            # Step 3: Score and rank candidates
            logger.info(f"[Pipeline-3] Scoring and ranking {len(candidates)} candidates...")
            case_context = {
                "specialty": analysis.get("specialty"),
                "max_budget": analysis.get("budget_range", {}).get("max"),
                "urgency": analysis.get("urgency_level")
            }
            
            # Use custom ranking service with weights
            ranker = ranking_service if weights == self.default_weights else ranking_service.__class__(weights)
            ranked_experts = ranker.rank_experts(candidates, case_context)
            
            # Limit to requested number
            top_experts = ranked_experts[:limit]
            
            # Filter by minimum score
            pre_filter_count = len(top_experts)
            top_experts = [
                e for e in top_experts 
                if e.get("final_score", 0) >= settings.MIN_RECOMMENDATION_SCORE
            ]
            logger.info(f"[Pipeline-3] Post-ranking: {pre_filter_count} scored, {len(top_experts)} passed MIN_RECOMMENDATION_SCORE={settings.MIN_RECOMMENDATION_SCORE}")
            if ranked_experts:
                for e in ranked_experts[:5]:
                    logger.info(f"  -> {e.get('full_name')} | final_score={e.get('final_score', 0):.3f}")
            
            # Step 4: Generate explanations
            logger.info("Generating explanations...")
            recommendations = []
            for expert in top_experts:
                explanation = ranker.generate_explanation(
                    expert,
                    expert.get("score_breakdown", {}),
                    case_context
                )
                
                recommendations.append({
                    "expert": self._format_expert(expert),
                    "score": round(expert.get("final_score", 0), 2),
                    "rank": expert.get("rank", 0),
                    "match_quality": explanation.get("match_quality"),
                    "explanation": explanation
                })
            
            processing_time = time.time() - start_time
            
            logger.info(
                f"Generated {len(recommendations)} recommendations in {processing_time:.2f}s"
            )
            
            return self._build_response(
                success=True, query=query, analysis=analysis,
                recommendations=recommendations, processing_time=processing_time,
            )
        
        except Exception as e:
            logger.error(f"Recommendation failed: {e}", exc_info=True)
            raise Exception(f"Failed to generate recommendations: {str(e)}")
    
    async def recommend_from_analysis(
        self,
        case_analysis: Dict[str, Any],
        query: str = "",
        limit: int = None,
        weights: Optional[ScoringWeights] = None
    ) -> RecommendationResponse:
        """
        Get expert recommendations from existing case analysis
        
        Args:
            case_analysis: Pre-analyzed case data
            query: Original user query text
            limit: Number of recommendations
            weights: Optional custom scoring weights
        
        Returns:
            RecommendationResponse model
        """
        start_time = time.time()
        limit = limit or settings.RECOMMENDATION_LIMIT
        weights = weights or self.default_weights
        
        try:
            # Vector search for candidates
            logger.info("Searching for expert candidates...")
            search_results = await vector_search_service.search_experts_by_case_analysis(
                case_analysis=case_analysis,
                limit=limit * 3
            )
            
            processing_time = time.time() - start_time

            if not search_results.get("success") or not search_results.get("results"):
                return self._build_response(
                    success=True, query=query, analysis=case_analysis,
                    recommendations=[], processing_time=processing_time,
                )
            
            candidates = search_results["results"]
            
            # Score and rank
            logger.info(f"Scoring and ranking {len(candidates)} candidates...")
            case_context = {
                "specialty": case_analysis.get("specialty"),
                "max_budget": case_analysis.get("budget_range", {}).get("max"),
                "urgency": case_analysis.get("urgency_level")
            }
            
            ranker = ranking_service if weights == self.default_weights else ranking_service.__class__(weights)
            ranked_experts = ranker.rank_experts(candidates, case_context)
            
            # Limit and filter
            top_experts = ranked_experts[:limit]
            top_experts = [
                e for e in top_experts 
                if e.get("final_score", 0) >= settings.MIN_RECOMMENDATION_SCORE
            ]
            
            # Generate explanations
            recommendations = []
            for expert in top_experts:
                explanation = ranker.generate_explanation(
                    expert,
                    expert.get("score_breakdown", {}),
                    case_context
                )
                
                recommendations.append({
                    "expert": self._format_expert(expert),
                    "score": round(expert.get("final_score", 0), 2),
                    "rank": expert.get("rank", 0),
                    "match_quality": explanation.get("match_quality"),
                    "explanation": explanation
                })
            
            processing_time = time.time() - start_time
            
            return self._build_response(
                success=True, query=query, analysis=case_analysis,
                recommendations=recommendations, processing_time=processing_time,
            )
        
        except Exception as e:
            logger.error(f"Recommendation failed: {e}", exc_info=True)
            raise Exception(f"Failed to generate recommendations: {str(e)}")
    
    async def recommend_from_audio(
        self,
        audio_bytes: bytes,
        language: str = "auto",
        max_budget: Optional[int] = None,
        urgency: Optional[str] = None,
        limit: int = None,
        weights: Optional[ScoringWeights] = None
    ) -> Dict[str, Any]:
        """
        Get expert recommendations from audio input
        
        Workflow:
        1. Transcribe audio (Phase 2)
        2. Follow text recommendation flow
        
        Args:
            audio_bytes: Audio file bytes
            language: Audio language
            max_budget: Optional budget
            urgency: Optional urgency level
            limit: Number of recommendations
            weights: Optional custom weights
        
        Returns:
            Recommendation results with transcription
        """
        start_time = time.time()
        
        try:
            # Step 1: Transcribe audio
            from app.services.whisper_service import whisper_service
            
            logger.info("Transcribing audio...")
            transcription = await whisper_service.transcribe(
                audio_bytes=audio_bytes,
                language=language,
                task="transcribe"
            )
            
            transcribed_text = transcription.get("text")
            if not transcribed_text:
                raise Exception("Failed to transcribe audio")
            
            logger.info(f"Transcription complete: {transcribed_text[:100]}...")
            
            # Step 2: Get recommendations from text
            recommendations = await self.recommend_from_text(
                query=transcribed_text,
                max_budget=max_budget,
                urgency=urgency,
                limit=limit,
                weights=weights
            )
            
            # Add transcription to response
            base = recommendations.model_dump()
            base["transcription"] = transcribed_text
            base["detected_language"] = transcription.get("language")
            base["processing_time"] = time.time() - start_time
            
            return RecommendationResponse(**base)
        
        except Exception as e:
            logger.error(f"Audio recommendation failed: {e}", exc_info=True)
            raise Exception(f"Failed to process audio recommendation: {str(e)}")
    
    def _build_response(
        self,
        success: bool,
        query: str,
        analysis: Dict[str, Any],
        recommendations: List[Dict[str, Any]],
        processing_time: float,
    ) -> RecommendationResponse:
        """Build a validated RecommendationResponse from raw data."""
        return RecommendationResponse(
            success=success,
            query=query,
            case_analysis=CaseAnalysisSummary(
                specialty=analysis.get("specialty"),
                urgency_level=analysis.get("urgency_level"),
                budget_range=analysis.get("budget_range"),
                key_entities=analysis.get("key_entities"),
            ),
            recommendations=recommendations,
            total=len(recommendations),
            filters_applied=FiltersApplied(
                specialty=analysis.get("specialty"),
                max_budget=analysis.get("budget_range", {}).get("max"),
                min_score=settings.MIN_RECOMMENDATION_SCORE,
            ),
            processing_time=processing_time,
        )
    
    def _format_expert(self, expert: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format expert data for response (using correct database field names)
        
        Remove internal fields, keep only user-facing data
        """
        # Handle field name variations (lowercase from query, camelCase from model, aliased from SQL)
        display_name = expert.get("full_name") or expert.get("displayname") or expert.get("displayName")
        user_id = expert.get("user_id") or expert.get("userid") or expert.get("userId")
        base_fee = expert.get("hourly_rate") or expert.get("baseconsultationfee") or expert.get("baseConsultationFee")
        avg_rating = expert.get("rating") or expert.get("averagerating") or expert.get("averageRating")
        review_count = expert.get("review_count") or expert.get("reviewcount", 0) or expert.get("reviewCount", 0)
        years_exp = expert.get("years_of_experience") or expert.get("yearsexperience") or expert.get("yearsExperience")
        profile_img = expert.get("profile_image_url") or expert.get("profileimageobjectkey") or expert.get("profileImageObjectKey")
        
        # Handle specialties (may be PostgreSQL array string)
        specialties = expert.get("specialties", [])
        if isinstance(specialties, str):
            specialties = specialties.strip('{}').split(',') if specialties else []
        
        return {
            "id": expert.get("id"),
            "user_id": user_id,
            "full_name": display_name,  # Map displayName to full_name for API consistency
            "specialties": specialties,
            "bio": expert.get("bio"),
            "hourly_rate": base_fee,  # Map baseConsultationFee to hourly_rate for API consistency
            "rating": avg_rating,  # Map averageRating to rating for API consistency
            "review_count": review_count,
            "languages": expert.get("languages"),
            "years_of_experience": years_exp,  # Map yearsExperience to years_of_experience for API
            "location": expert.get("city") or expert.get("location"),
            "profile_image_url": profile_img  # Map profileImageObjectKey to profile_image_url for API
        }
    
    async def explain_recommendation(
        self,
        expert_id: str,
        case_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate detailed explanation for a specific expert recommendation
        
        Args:
            expert_id: Expert UUID
            case_analysis: Case analysis data
        
        Returns:
            Detailed explanation
        """
        try:
            from app.db.repositories.expert_repository import expert_repository
            
            # Get expert details
            expert = await expert_repository.get_expert_by_id(expert_id)
            if not expert:
                raise Exception(f"Expert not found: {expert_id}")
            
            # Generate embedding for case
            from app.services.embedding_service import embedding_service
            
            key_entities = case_analysis.get("key_entities", [])
            query = " ".join(key_entities) if key_entities else "legal expert"
            query_embedding = await embedding_service.generate_embedding(query)
            
            # Calculate real similarity using expert's stored embedding
            from app.db.repositories.expert_repository import expert_repository as _er
            expert_embedding = await _er.get_expert_embedding(expert_id)
            if expert_embedding and query_embedding:
                import numpy as np
                query_vec = np.array(query_embedding, dtype=np.float32)
                expert_vec = np.array(expert_embedding, dtype=np.float32)
                similarity = float(np.dot(query_vec, expert_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(expert_vec)))
                expert["similarity_score"] = round(max(0.0, similarity), 3)
            else:
                expert["similarity_score"] = 0.5  # Neutral when embedding unavailable
            
            # Score the expert (using correct field names)
            display_name = expert.get("full_name") or expert.get("displayname") or expert.get("displayName")
            
            case_context = {
                "specialty": case_analysis.get("specialty"),
                "max_budget": case_analysis.get("budget_range", {}).get("max")
            }
            
            score_breakdown = ranking_service.score_expert(expert, case_context)
            
            # Generate explanation
            explanation = ranking_service.generate_explanation(
                expert,
                {
                    "similarity": score_breakdown.similarity_score,
                    "rating": score_breakdown.rating_score,
                    "budget": score_breakdown.budget_score,
                    "reviews": score_breakdown.review_count_score,
                    "experience": score_breakdown.experience_score,
                    "specialty": score_breakdown.specialty_bonus
                },
                case_context
            )
            
            return {
                "success": True,
                "expert_id": expert_id,
                "expert_name": display_name,
                "final_score": round(score_breakdown.final_score, 2),
                "score_breakdown": {
                    "similarity": round(score_breakdown.similarity_score, 3),
                    "rating": round(score_breakdown.rating_score, 3),
                    "budget": round(score_breakdown.budget_score, 3),
                    "reviews": round(score_breakdown.review_count_score, 3),
                    "experience": round(score_breakdown.experience_score, 3),
                    "specialty": round(score_breakdown.specialty_bonus, 3)
                },
                "explanation": explanation
            }
        
        except Exception as e:
            logger.error(f"Failed to explain recommendation: {e}", exc_info=True)
            raise Exception(f"Failed to explain recommendation: {str(e)}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check recommendation service health"""
        try:
            # Check dependencies
            vector_health = await vector_search_service.health_check()
            
            status = "healthy" if vector_health["status"] == "healthy" else "degraded"
            
            return {
                "status": status,
                "service": "recommendation",
                "dependencies": {
                    "vector_search": vector_health["status"],
                    "ranking": "healthy"
                },
                "weights": {
                    "similarity": self.default_weights.similarity,
                    "rating": self.default_weights.rating,
                    "budget": self.default_weights.budget,
                    "reviews": self.default_weights.reviews,
                    "experience": self.default_weights.experience,
                    "specialty": self.default_weights.specialty
                }
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "recommendation",
                "error": str(e)
            }


# Global instance
recommendation_service = RecommendationService()

