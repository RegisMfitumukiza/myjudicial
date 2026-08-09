"""Tests for Pydantic request model logic."""
import pytest
from pydantic import ValidationError

from app.models.recommendation import RecommendationRequest, UrgencyLevel


class TestRecommendationRequest:
    def test_get_query_from_query_field(self):
        request = RecommendationRequest(query="land boundary dispute with neighbor")
        assert request.get_query() == "land boundary dispute with neighbor"

    def test_get_query_falls_back_to_text(self):
        request = RecommendationRequest(text="divorce and child custody case")
        assert request.get_query() == "divorce and child custody case"

    def test_get_query_prefers_query(self):
        request = RecommendationRequest(query="primary query text", text="fallback text")
        assert request.get_query() == "primary query text"

    def test_get_query_empty_when_both_missing(self):
        # Both fields are optional; an empty request has an empty query.
        request = RecommendationRequest()
        assert request.get_query() == ""

    def test_short_text_rejected(self):
        with pytest.raises(ValidationError):
            RecommendationRequest(query="short")

    def test_limit_bounds(self):
        with pytest.raises(ValidationError):
            RecommendationRequest(query="a valid query text here", limit=0)
        with pytest.raises(ValidationError):
            RecommendationRequest(query="a valid query text here", limit=51)

    def test_negative_budget_rejected(self):
        with pytest.raises(ValidationError):
            RecommendationRequest(query="a valid query text here", max_budget=-1)

    def test_urgency_enum(self):
        request = RecommendationRequest(query="a valid query text here", urgency="HIGH")
        assert request.urgency == UrgencyLevel.HIGH
