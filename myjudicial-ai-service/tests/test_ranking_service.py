"""Tests for the ranking/scoring service (pure logic, no mocking required)."""
import math

import pytest

from app.models.recommendation import ScoringWeightsRequest
from app.services.ranking_service import RankingService, ScoreBreakdown, ScoringWeights


@pytest.fixture
def service():
    return RankingService(weights=ScoringWeights(
        similarity=0.40,
        rating=0.25,
        budget=0.15,
        reviews=0.10,
        experience=0.05,
        specialty=0.05,
    ))


class TestSimilarityScore:
    def test_clamps_below_zero(self, service):
        assert service.calculate_similarity_score(-0.5) == 0.0

    def test_clamps_above_one(self, service):
        assert service.calculate_similarity_score(1.5) == 1.0

    def test_passthrough(self, service):
        assert service.calculate_similarity_score(0.7) == 0.7

    def test_boundaries(self, service):
        assert service.calculate_similarity_score(0) == 0.0
        assert service.calculate_similarity_score(1) == 1.0


class TestRatingScore:
    def test_none_is_neutral(self, service):
        assert service.calculate_rating_score(None) == 0.5

    def test_zero_is_neutral(self, service):
        assert service.calculate_rating_score(0) == 0.5

    def test_full_marks(self, service):
        assert service.calculate_rating_score(5.0) == 1.0

    def test_half(self, service):
        assert service.calculate_rating_score(2.5) == pytest.approx(0.5)

    def test_clamped_above_five(self, service):
        assert service.calculate_rating_score(7) == 1.0


class TestBudgetScore:
    def test_no_fee_is_assumed_reasonable(self, service):
        assert service.calculate_budget_score(None, 100000) == pytest.approx(0.7)

    def test_no_budget_is_neutral(self, service):
        assert service.calculate_budget_score(50000, None) == pytest.approx(0.7)

    def test_excellent_fit_within_budget(self, service):
        # Fee at 80% of budget -> perfect fit
        assert service.calculate_budget_score(80000, 100000) == 1.0

    def test_good_fit_above_ideal_ratio(self, service):
        # Fee at 95% of budget -> 1.0 - (0.05) * 0.5
        assert service.calculate_budget_score(95000, 100000) == pytest.approx(0.975)

    def test_small_overage_penalized(self, service):
        # 10% over budget -> 0.7 - 0.20
        assert service.calculate_budget_score(110000, 100000) == pytest.approx(0.5)

    def test_large_overage_zero(self, service):
        assert service.calculate_budget_score(200000, 100000) == 0.0

    def test_way_over_budget_zero(self, service):
        assert service.calculate_budget_score(500000, 100000) == 0.0


class TestReviewCountScore:
    def test_zero_reviews(self, service):
        assert service.calculate_review_count_score(0) == pytest.approx(0.3)

    def test_logarithmic_scale(self, service):
        assert service.calculate_review_count_score(99) == pytest.approx(
            math.log(100) / math.log(100)
        )
        assert service.calculate_review_count_score(99) == pytest.approx(1.0)

    def test_single_review(self, service):
        assert 0 < service.calculate_review_count_score(1) < 1


class TestExperienceScore:
    def test_none(self, service):
        assert service.calculate_experience_score(None) == pytest.approx(0.3)

    def test_zero(self, service):
        assert service.calculate_experience_score(0) == pytest.approx(0.3)

    def test_plateaus_at_15(self, service):
        assert service.calculate_experience_score(15) == 1.0
        assert service.calculate_experience_score(30) == 1.0

    def test_linear_before_plateau(self, service):
        assert service.calculate_experience_score(7.5) == pytest.approx(0.5)


class TestSpecialtyBonus:
    def test_no_case_specialty_is_neutral(self, service):
        assert service.calculate_specialty_bonus(["LAND_LAW"], None) == 0.8

    def test_exact_match_in_list(self, service):
        assert service.calculate_specialty_bonus(["LAND_LAW", "FAMILY_LAW"], "LAND_LAW") == 1.0

    def test_exact_match_primary(self, service):
        assert service.calculate_specialty_bonus([], "LAND_LAW", primary_specialty="LAND_LAW") == 1.0

    def test_related_specialty(self, service):
        assert service.calculate_specialty_bonus(["FAMILY_LAW"], "LAND_LAW") == 0.6

    def test_expert_with_no_specialties(self, service):
        assert service.calculate_specialty_bonus([], "LAND_LAW") == 0.5


class TestScoreExpert:
    def test_returns_score_breakdown(self, service):
        expert = {
            "similarity_score": 0.8,
            "rating": 4.5,
            "hourly_rate": 50000,
            "review_count": 20,
            "years_of_experience": 10,
            "specialties": ["LAND_LAW"],
        }
        breakdown = service.score_expert(expert, {"max_budget": 100000, "specialty": "LAND_LAW"})
        assert isinstance(breakdown, ScoreBreakdown)
        assert 0 <= breakdown.final_score <= 1

    def test_specialties_parsed_from_string(self, service):
        expert = {"specialties": "{LAND_LAW,FAMILY_LAW}", "similarity_score": 0.5}
        breakdown = service.score_expert(expert, {"specialty": "LAND_LAW"})
        assert breakdown.specialty_bonus == 1.0

    def test_accepts_db_snake_case_columns(self, service):
        expert = {
            "similarity_score": 0.6,
            "averagerating": 4.0,
            "baseconsultationfee": 80000,
            "reviewcount": 10,
            "yearsexperience": 8,
            "primarySpecialty": "LAND_LAW",
        }
        breakdown = service.score_expert(expert, {"max_budget": 100000, "specialty": "LAND_LAW"})
        assert breakdown.specialty_bonus == 1.0
        assert breakdown.rating_score == pytest.approx(0.8)


class TestRankExperts:
    def test_sorted_descending(self, service):
        experts = [
            {"name": "A", "similarity_score": 0.3},
            {"name": "B", "similarity_score": 0.9},
            {"name": "C", "similarity_score": 0.6},
        ]
        ranked = service.rank_experts(experts)
        assert [e["name"] for e in ranked] == ["B", "C", "A"]
        assert [e["rank"] for e in ranked] == [1, 2, 3]

    def test_does_not_mutate_input(self, service):
        experts = [{"similarity_score": 0.5}]
        original = dict(experts[0])
        service.rank_experts(experts)
        assert experts[0] == original

    def test_score_breakdown_present(self, service):
        ranked = service.rank_experts([{"similarity_score": 0.5}])
        assert "score_breakdown" in ranked[0]
        assert "final_score" in ranked[0]


class TestGenerateExplanation:
    def test_excellent_match(self, service):
        expert = {"name": "X", "final_score": 0.9}
        explanation = service.generate_explanation(expert, {})
        assert explanation["match_quality"] == "excellent"
        assert explanation["fit_score"] == 0.9

    def test_high_rating_strength(self, service):
        expert = {"averagerating": 4.8, "reviewcount": 15, "final_score": 0.8}
        explanation = service.generate_explanation(expert, {})
        assert any("Highly rated" in s for s in explanation["strengths"])

    def test_budget_fit_strength(self, service):
        expert = {"baseconsultationfee": 50000, "final_score": 0.8}
        explanation = service.generate_explanation(
            expert, {}, case_context={"max_budget": 100000}
        )
        assert any("Well within your budget" in s for s in explanation["strengths"])

    def test_over_budget_consideration(self, service):
        expert = {"baseconsultationfee": 110000, "final_score": 0.6}
        explanation = service.generate_explanation(
            expert, {}, case_context={"max_budget": 100000}
        )
        assert explanation["considerations"]
        assert any("Slightly above budget" in c for c in explanation["considerations"])


class TestScoringWeights:
    def test_defaults_from_settings_sum_to_one(self):
        weights = ScoringWeights()
        total = (
            weights.similarity + weights.rating + weights.budget +
            weights.reviews + weights.experience + weights.specialty
        )
        assert 0.99 <= total <= 1.01

    def test_request_validate_sum_ok(self):
        request = ScoringWeightsRequest(
            similarity=0.40, rating=0.25, budget=0.15,
            reviews=0.10, experience=0.05, specialty=0.05,
        )
        assert request.validate_sum() is True

    def test_request_validate_sum_rejects_bad(self):
        request = ScoringWeightsRequest(
            similarity=1.0, rating=1.0, budget=1.0,
            reviews=1.0, experience=1.0, specialty=1.0,
        )
        assert request.validate_sum() is False
