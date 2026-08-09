"""Tests for LLM keyword-based pre-classification and overrides (pure logic)."""
import pytest

from app.services.llm_service import llm_service


class TestKeywordPreClassify:
    def test_criminal_keywords(self):
        assert llm_service._keyword_pre_classify(
            "I was assaulted and physically beaten at work"
        ) == "CRIMINAL_LAW"

    def test_land_keywords(self):
        assert llm_service._keyword_pre_classify(
            "My neighbor built a fence on my land boundary"
        ) == "LAND_LAW"

    def test_family_keywords(self):
        assert llm_service._keyword_pre_classify(
            "My wife and I are getting a divorce and fighting over child custody"
        ) == "FAMILY_LAW"

    def test_tax_keywords(self):
        assert llm_service._keyword_pre_classify(
            "The RRA is auditing my income tax return for tax evasion"
        ) == "TAX_LAW"

    def test_no_match_returns_none(self):
        assert llm_service._keyword_pre_classify("This is a completely neutral sentence") is None

    def test_empty_text_returns_none(self):
        assert llm_service._keyword_pre_classify("") is None

    def test_highest_count_wins(self):
        # More criminal keywords than land keywords should pick criminal
        result = llm_service._keyword_pre_classify(
            "He attacked me with a weapon, stabbed and robbed me on my own land"
        )
        assert result == "CRIMINAL_LAW"


class TestKeywordOverride:
    def test_strong_override_wins(self):
        assert llm_service._keyword_override(
            "I was assaulted and beaten", "FAMILY_LAW"
        ) == "CRIMINAL_LAW"

    def test_no_override_when_agree(self):
        assert llm_service._keyword_override(
            "I was assaulted and beaten", "CRIMINAL_LAW"
        ) == "CRIMINAL_LAW"

    def test_visa_override(self):
        assert llm_service._keyword_override(
            "I need a visa to reunite with my family", "FAMILY_LAW"
        ) == "IMMIGRATION_LAW"

    def test_no_override_without_strong_keywords(self):
        assert llm_service._keyword_override(
            "General business dispute", "COMMERCIAL_LAW"
        ) == "COMMERCIAL_LAW"
