"""Tests for embedding profile text generation (pure logic)."""
import asyncio

import pytest

from app.services.embedding_service import embedding_service


def _run(coro):
    return asyncio.run(coro)


class TestCreateExpertProfileText:
    def test_full_profile(self):
        expert = {
            "specialties": ["LAND_LAW", "COMMERCIAL_LAW"],
            "bio": "Senior lawyer in Kigali specializing in land disputes.",
            "skills": ["Mediation", "Negotiation", "Litigation"],
            "languages": ["English", "Kinyarwanda"],
            "years_of_experience": 12,
            "education": "University of Rwanda, LLB",
        }
        text = _run(embedding_service.create_expert_profile_text(expert))
        assert "LAND_LAW, COMMERCIAL_LAW specialist" in text
        assert "Senior lawyer in Kigali" in text
        assert "Skills: Mediation, Negotiation, Litigation" in text
        assert "Languages: English, Kinyarwanda" in text
        assert "12 years of experience" in text
        assert "Education: University of Rwanda, LLB" in text

    def test_string_specialties_handled(self):
        expert = {"specialties": "{LAND_LAW,FAMILY_LAW}"}
        text = _run(embedding_service.create_expert_profile_text(expert))
        assert "{LAND_LAW,FAMILY_LAW} specialist" in text

    def test_minimal_profile(self):
        assert _run(embedding_service.create_expert_profile_text({})) == ""

    def test_skips_missing_sections(self):
        expert = {"bio": "Only a bio."}
        text = _run(embedding_service.create_expert_profile_text(expert))
        assert text == "Only a bio."
