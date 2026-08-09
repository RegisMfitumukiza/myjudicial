"""Ranking service for expert recommendations"""
import math
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ScoringWeights:
    """Weights for multi-factor scoring"""
    similarity: float = settings.SCORE_WEIGHT_SIMILARITY
    rating: float = settings.SCORE_WEIGHT_RATING
    budget: float = settings.SCORE_WEIGHT_BUDGET
    reviews: float = settings.SCORE_WEIGHT_REVIEWS
    experience: float = settings.SCORE_WEIGHT_EXPERIENCE
    specialty: float = settings.SCORE_WEIGHT_SPECIALTY
    
    def __post_init__(self):
        """Validate weights sum to 1.0"""
        total = (self.similarity + self.rating + self.budget + 
                self.reviews + self.experience + self.specialty)
        if not (0.99 <= total <= 1.01):  # Allow small floating point errors
            logger.warning(f"Weights sum to {total}, expected 1.0")


@dataclass
class ScoreBreakdown:
    """Detailed breakdown of expert score"""
    similarity_score: float
    rating_score: float
    budget_score: float
    review_count_score: float
    experience_score: float
    specialty_bonus: float
    
    # Weighted contributions
    similarity_contribution: float
    rating_contribution: float
    budget_contribution: float
    review_contribution: float
    experience_contribution: float
    specialty_contribution: float
    
    # Final score
    final_score: float


class RankingService:
    """Service for ranking and scoring expert recommendations"""
    
    def __init__(self, weights: Optional[ScoringWeights] = None):
        self.weights = weights or ScoringWeights()
        logger.info(f"Ranking service initialized with weights: {self.weights}")
    
    def calculate_similarity_score(self, similarity: float) -> float:
        """
        Calculate similarity score (already normalized 0-1)
        
        Args:
            similarity: Cosine similarity from vector search
        
        Returns:
            Normalized score (0-1)
        """
        return max(0.0, min(1.0, similarity))
    
    def calculate_rating_score(self, rating: Optional[float]) -> float:
        """
        Calculate rating score
        
        Args:
            rating: Expert rating (0-5 scale)
        
        Returns:
            Normalized score (0-1)
        """
        if rating is None or rating == 0:
            return 0.5  # Neutral score for no rating
        
        # Normalize to 0-1 scale
        normalized = rating / 5.0
        return max(0.0, min(1.0, normalized))
    
    def calculate_budget_score(
        self,
        expert_fee: Optional[float],
        user_budget: Optional[float]
    ) -> float:
        """
        Calculate budget fit score
        
        Scoring logic:
        - Perfect fit (fee = budget): 1.0
        - Within budget: Higher score for closer match
        - Over budget: Penalized based on overage
        
        Args:
            expert_fee: Expert's consultation fee
            user_budget: User's budget
        
        Returns:
            Normalized score (0-1)
        """
        if expert_fee is None:
            return 0.7  # Assume reasonable fee if not specified
        
        if user_budget is None or user_budget == 0:
            return 0.7  # Neutral score if no budget specified
        
        if expert_fee <= user_budget:
            # Within budget - score based on how well it fits
            # Perfect match at 90% of budget
            ideal_ratio = 0.9
            actual_ratio = expert_fee / user_budget
            
            if actual_ratio <= ideal_ratio:
                # Excellent fit
                return 1.0
            else:
                # Good fit, but could be pricey
                return 1.0 - (actual_ratio - ideal_ratio) * 0.5
        else:
            # Over budget - penalize based on overage
            overage_ratio = (expert_fee - user_budget) / user_budget
            
            # Allow up to 20% overage with reduced score
            if overage_ratio <= 0.20:
                return 0.7 - (overage_ratio * 2)  # 0.7 to 0.3
            elif overage_ratio <= 0.50:
                return 0.3 - (overage_ratio - 0.2)  # 0.3 to 0.0
            else:
                return 0.0  # Way over budget
    
    def calculate_review_count_score(self, review_count: int) -> float:
        """
        Calculate review count score (social proof)
        
        Uses logarithmic scale to avoid over-weighting very popular experts
        
        Args:
            review_count: Number of reviews
        
        Returns:
            Normalized score (0-1)
        """
        if review_count == 0:
            return 0.3  # Give new experts a chance
        
        # Logarithmic scale: 100+ reviews = max score
        score = math.log(review_count + 1) / math.log(100)
        return max(0.0, min(1.0, score))
    
    def calculate_experience_score(self, years_experience: Optional[int]) -> float:
        """
        Calculate experience score
        
        Args:
            years_experience: Years of experience
        
        Returns:
            Normalized score (0-1)
        """
        if years_experience is None or years_experience == 0:
            return 0.3  # Give new lawyers a chance
        
        # Plateau at 15 years
        score = min(years_experience, 15) / 15.0
        return max(0.0, min(1.0, score))
    
    def calculate_specialty_bonus(
        self,
        expert_specialties: List[str],
        case_specialty: Optional[str],
        primary_specialty: Optional[str] = None
    ) -> float:
        """
        Calculate specialty match bonus
        
        Args:
            expert_specialties: Expert's specialties array
            case_specialty: Required specialty from case analysis
            primary_specialty: Expert's primary specialty (from DB column)
        
        Returns:
            Bonus score (0.5-1.0)
        """
        if not case_specialty:
            return 0.8  # Neutral if no specialty specified
        
        if not expert_specialties and not primary_specialty:
            return 0.5  # Low score if expert has no specialties
        
        # Exact match in specialties array
        if case_specialty in expert_specialties:
            return 1.0
        
        # Exact match on primary specialty
        if primary_specialty and primary_specialty == case_specialty:
            return 1.0
        
        # Related specialty (will be caught by vector similarity)
        return 0.6
    
    def score_expert(
        self,
        expert: Dict[str, Any],
        case_context: Optional[Dict[str, Any]] = None
    ) -> ScoreBreakdown:
        """
        Calculate comprehensive score for an expert
        
        Args:
            expert: Expert data including similarity_score
            case_context: Optional case context with budget, specialty, etc.
        
        Returns:
            ScoreBreakdown with detailed scoring information
        """
        # Extract expert data — SQL aliases to snake_case, but also check raw DB names
        similarity = expert.get("similarity_score", 0.5)
        rating = expert.get("rating") or expert.get("averagerating") or expert.get("averageRating")
        fee = expert.get("hourly_rate") or expert.get("baseconsultationfee") or expert.get("baseConsultationFee")
        review_count = expert.get("review_count") or expert.get("reviewcount", 0) or expert.get("reviewCount", 0)
        years_exp = expert.get("years_of_experience") or expert.get("yearsexperience") or expert.get("yearsExperience")
        specialties = expert.get("specialties", [])
        primary_specialty = expert.get("primary_specialty") or expert.get("primarySpecialty")
        
        # Convert specialties if it's a string (from database array)
        if isinstance(specialties, str):
            # PostgreSQL array format: {LAND_LAW,FAMILY_LAW}
            specialties = specialties.strip('{}').split(',') if specialties else []
        
        # Extract case context
        budget = None
        case_specialty = None
        if case_context:
            budget = case_context.get("max_budget")
            case_specialty = case_context.get("specialty")
        
        # Calculate individual scores
        similarity_score = self.calculate_similarity_score(similarity)
        rating_score = self.calculate_rating_score(rating)
        budget_score = self.calculate_budget_score(fee, budget)
        review_score = self.calculate_review_count_score(review_count)
        experience_score = self.calculate_experience_score(years_exp)
        specialty_bonus = self.calculate_specialty_bonus(specialties, case_specialty, primary_specialty)
        
        # Calculate weighted contributions
        similarity_contrib = similarity_score * self.weights.similarity
        rating_contrib = rating_score * self.weights.rating
        budget_contrib = budget_score * self.weights.budget
        review_contrib = review_score * self.weights.reviews
        experience_contrib = experience_score * self.weights.experience
        specialty_contrib = specialty_bonus * self.weights.specialty
        
        # Calculate final score
        final_score = (
            similarity_contrib +
            rating_contrib +
            budget_contrib +
            review_contrib +
            experience_contrib +
            specialty_contrib
        )
        
        return ScoreBreakdown(
            similarity_score=similarity_score,
            rating_score=rating_score,
            budget_score=budget_score,
            review_count_score=review_score,
            experience_score=experience_score,
            specialty_bonus=specialty_bonus,
            similarity_contribution=similarity_contrib,
            rating_contribution=rating_contrib,
            budget_contribution=budget_contrib,
            review_contribution=review_contrib,
            experience_contribution=experience_contrib,
            specialty_contribution=specialty_contrib,
            final_score=final_score
        )
    
    def rank_experts(
        self,
        experts: List[Dict[str, Any]],
        case_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Score and rank a list of experts
        
        Args:
            experts: List of expert dictionaries
            case_context: Optional case context
        
        Returns:
            Sorted list of experts with scores added
        """
        scored_experts = []
        
        for expert in experts:
            # Calculate score
            score_breakdown = self.score_expert(expert, case_context)
            
            # Add score to expert data
            expert_with_score = expert.copy()
            expert_with_score["final_score"] = score_breakdown.final_score
            expert_with_score["score_breakdown"] = {
                "similarity": round(score_breakdown.similarity_score, 3),
                "rating": round(score_breakdown.rating_score, 3),
                "budget": round(score_breakdown.budget_score, 3),
                "reviews": round(score_breakdown.review_count_score, 3),
                "experience": round(score_breakdown.experience_score, 3),
                "specialty": round(score_breakdown.specialty_bonus, 3)
            }
            expert_with_score["rank"] = 0  # Will be set after sorting
            
            scored_experts.append(expert_with_score)
        
        # Sort by final score (descending)
        scored_experts.sort(key=lambda x: x["final_score"], reverse=True)
        
        # Assign ranks
        for i, expert in enumerate(scored_experts, 1):
            expert["rank"] = i
        
        logger.info(f"Ranked {len(scored_experts)} experts")
        
        return scored_experts
    
    def generate_explanation(
        self,
        expert: Dict[str, Any],
        score_breakdown: Dict[str, float],
        case_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate human-readable explanation of recommendation
        
        Args:
            expert: Expert data
            score_breakdown: Score breakdown
            case_context: Optional case context
        
        Returns:
            Explanation dictionary
        """
        strengths = []
        considerations = []
        
        # Rating strength (use correct field name)
        rating = expert.get("averagerating") or expert.get("averageRating")
        review_count = expert.get("reviewcount", 0) or expert.get("reviewCount", 0)
        if rating and rating >= 4.5:
            strengths.append(f"Highly rated ({rating}/5 from {review_count} clients)")
        elif rating and rating >= 4.0:
            strengths.append(f"Well rated ({rating}/5 from {review_count} reviews)")
        
        # Budget fit (use correct field name)
        fee = expert.get("baseconsultationfee") or expert.get("baseConsultationFee")
        if case_context and case_context.get("max_budget"):
            budget = case_context["max_budget"]
            if fee and fee <= budget:
                if fee <= budget * 0.9:
                    strengths.append(f"Well within your budget ({fee:,.0f} RWF)")
                else:
                    strengths.append(f"Within your budget ({fee:,.0f} RWF)")
            elif fee and fee <= budget * 1.2:
                considerations.append(f"Slightly above budget ({fee:,.0f} RWF)")
        
        # Experience (use correct field name)
        years_exp = expert.get("yearsexperience") or expert.get("yearsExperience")
        if years_exp and years_exp >= 10:
            strengths.append(f"{years_exp} years of experience")
        elif years_exp and years_exp >= 5:
            strengths.append(f"{years_exp} years of experience")
        
        # Specialty match (handle array format)
        specialties = expert.get("specialties", [])
        if isinstance(specialties, str):
            specialties = specialties.strip('{}').split(',') if specialties else []
        if case_context and case_context.get("specialty"):
            case_specialty = case_context["specialty"]
            if case_specialty in specialties:
                strengths.append(f"Specializes in {case_specialty}")
        
        # Match quality
        final_score = expert.get("final_score", 0)
        if final_score >= 0.8:
            match_quality = "excellent"
            summary = "Excellent match for your case"
        elif final_score >= 0.7:
            match_quality = "very good"
            summary = "Very good match for your case"
        elif final_score >= 0.6:
            match_quality = "good"
            summary = "Good match for your case"
        else:
            match_quality = "fair"
            summary = "Fair match for your case"
        
        return {
            "summary": summary,
            "match_quality": match_quality,
            "strengths": strengths,
            "considerations": considerations if considerations else None,
            "fit_score": round(final_score, 2)
        }


# Global instance
ranking_service = RankingService()

