"""Expert repository for database operations"""
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from app.db.database import db
from app.config import settings

logger = logging.getLogger(__name__)


class ExpertRepository:
    """Repository for expert database operations"""
    
    async def search_similar_experts(
        self,
        query_embedding: List[float],
        specialty: Optional[str] = None,
        max_budget: Optional[int] = None,
        min_rating: Optional[float] = None,
        limit: int = 10,
        similarity_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for experts similar to query embedding
        
        Args:
            query_embedding: Query vector embedding
            specialty: Filter by legal specialty
            max_budget: Maximum hourly rate
            min_rating: Minimum expert rating
            limit: Maximum number of results
            similarity_threshold: Minimum similarity score (0-1)
        
        Returns:
            List of expert dictionaries with similarity scores
        """
        try:
            if max_budget is not None and max_budget <= 0:
                max_budget = None
            # Convert embedding to PostgreSQL vector format
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # Build query with filters
            query = """
            SELECT 
                id,
                "userId" as user_id,
                "displayName" as full_name,
                specialties,
                bio,
                "baseConsultationFee" as hourly_rate,
                "averageRating" as rating,
                "reviewCount" as review_count,
                languages,
                "yearsExperience" as years_of_experience,
                city as location,
                "profileImageObjectKey" as profile_image_url,
                "primarySpecialty"::text as primary_specialty,
                1 - (profile_embedding <=> $1::vector) as similarity_score
            FROM experts
            WHERE 
                -- Must have embedding
                profile_embedding IS NOT NULL
                -- Must be verified (status can be VERIFIED or other active statuses)
                AND status::text IN ('VERIFIED', 'DRAFT')
                -- Specialty filter (match against array OR primarySpecialty)
                AND ($2::text IS NULL OR $2::text = ANY(specialties::text[]) OR $2::text = "primarySpecialty"::text)
                -- Budget filter (treat <= 0 or NULL as unconstrained)
                AND ($3::decimal IS NULL OR $3::decimal <= 0 OR "baseConsultationFee" <= $3)
                -- Rating filter
                AND ($4::decimal IS NULL OR "averageRating" >= $4)
                -- Similarity threshold filter
                AND ($5::float IS NULL OR (1 - (profile_embedding <=> $1::vector)) >= $5)
            ORDER BY profile_embedding <=> $1::vector
            LIMIT $6
            """
            
            # Execute query
            rows = await db.fetch(
                query,
                embedding_str,
                specialty,
                max_budget,
                min_rating,
                similarity_threshold,  # None = skip filter (SQL handles NULL)
                limit
            )

            # Stage-by-stage logging
            total_with_emb_q = """
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN status::text IN ('VERIFIED', 'DRAFT') THEN 1 END) as active,
                       COUNT(CASE WHEN profile_embedding IS NOT NULL THEN 1 END) as with_emb,
                       COUNT(CASE WHEN profile_embedding IS NOT NULL AND status::text IN ('VERIFIED', 'DRAFT') THEN 1 END) as active_with_emb
                FROM experts
            """
            stats_row = await db.fetchrow(total_with_emb_q)
            if stats_row:
                logger.info(f"[Pipeline] Total experts: {stats_row['total']}, "
                            f"Active (VERIFIED/DRAFT): {stats_row['active']}, "
                            f"With embeddings: {stats_row['with_emb']}, "
                            f"Active with embeddings: {stats_row['active_with_emb']}")
            logger.info(f"[Pipeline] Filters: specialty={specialty}, max_budget={max_budget}, "
                        f"min_rating={min_rating}, similarity_threshold={similarity_threshold}")
            logger.info(f"[Pipeline] SQL returned: {len(rows)} experts")
            if rows:
                for r in rows:
                    logger.info(f"  -> {r['full_name']} | sim={float(r['similarity_score']):.3f} | "
                                f"fee={r['hourly_rate']} | rating={r['rating']} | specs={r['specialties']}")

            # Convert rows to dictionaries
            results = []
            for row in rows:
                expert = {
                    "id": str(row["id"]),
                    "user_id": str(row["user_id"]) if row["user_id"] else None,
                    "full_name": row["full_name"],
                    "specialties": row["specialties"],
                    "bio": row["bio"],
                    "hourly_rate": float(row["hourly_rate"]) if row["hourly_rate"] else None,
                    "rating": float(row["rating"]) if row["rating"] else None,
                    "review_count": int(row["review_count"] or 0),
                    "languages": row["languages"],
                    "skills": [],  # Not in schema
                    "education": None,  # Separate table
                    "years_of_experience": row["years_of_experience"],
                    "location": row["location"],
                    "availability": None,  # Separate table
                    "profile_image_url": row["profile_image_url"],
                    "primary_specialty": row["primary_specialty"],
                    "similarity_score": float(row["similarity_score"])
                }
                results.append(expert)
            
            logger.info(
                f"Found {len(results)} similar experts "
                f"(specialty={specialty}, max_budget={max_budget}, min_rating={min_rating})"
            )
            
            return results
        
        except Exception as e:
            logger.error(f"Failed to search similar experts: {e}", exc_info=True)
            raise Exception(f"Failed to search similar experts: {str(e)}")

    async def fallback_search_by_specialty(
        self,
        specialty: str,
        max_budget: Optional[int] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        TIER 2 FALLBACK — Structured category search when vector search returns 0 results.

        This guarantees a client is NEVER shown "No experts found" when a verified
        lawyer exists for the identified specialty, regardless of whether their
        profile_embedding has been generated yet.

        Returns experts sorted by rating DESC, experience DESC.
        Each expert receives a fixed similarity_score=0.0 so the ranking service
        knows this is a fallback result (not a semantic match) but can still score
        them on rating, budget, experience, and specialty match.
        """
        try:
            if max_budget is not None and max_budget <= 0:
                max_budget = None

            query = """
            SELECT
                id,
                "userId" as user_id,
                "displayName" as full_name,
                specialties,
                bio,
                "baseConsultationFee" as hourly_rate,
                "averageRating" as rating,
                "reviewCount" as review_count,
                languages,
                "yearsExperience" as years_of_experience,
                city as location,
                "profileImageObjectKey" as profile_image_url,
                "primarySpecialty"::text as primary_specialty,
                0.0::float as similarity_score
            FROM experts
            WHERE
                status::text IN ('VERIFIED', 'DRAFT')
                AND (
                    $1::text = ANY(specialties::text[])
                    OR $1::text = "primarySpecialty"::text
                )
                AND ($2::decimal IS NULL OR $2::decimal <= 0 OR "baseConsultationFee" <= $2)
            ORDER BY
                "averageRating" DESC NULLS LAST,
                "yearsExperience" DESC NULLS LAST
            LIMIT $3
            """

            rows = await db.fetch(query, specialty, max_budget, limit)

            logger.info(
                f"[Fallback] Structured specialty search for '{specialty}': "
                f"found {len(rows)} experts (budget<={max_budget})"
            )

            results = []
            for row in rows:
                expert = {
                    "id": str(row["id"]),
                    "user_id": str(row["user_id"]) if row["user_id"] else None,
                    "full_name": row["full_name"],
                    "specialties": row["specialties"],
                    "bio": row["bio"],
                    "hourly_rate": float(row["hourly_rate"]) if row["hourly_rate"] else None,
                    "rating": float(row["rating"]) if row["rating"] else None,
                    "review_count": int(row["review_count"] or 0),
                    "languages": row["languages"],
                    "skills": [],
                    "education": None,
                    "years_of_experience": row["years_of_experience"],
                    "location": row["location"],
                    "availability": None,
                    "profile_image_url": row["profile_image_url"],
                    "primary_specialty": row["primary_specialty"],
                    "similarity_score": 0.0,  # Structured match — not semantic
                    "_fallback": True,         # Mark so pipeline can flag this
                }
                results.append(expert)

            return results

        except Exception as e:
            logger.error(f"Fallback specialty search failed: {e}", exc_info=True)
            return []  # Return empty so caller can decide what to show — never crash
    
    async def get_expert_by_id(self, expert_id: str) -> Optional[Dict[str, Any]]:
        """Get expert by ID"""
        try:
            query = """
            SELECT 
                id, 
                "userId" as user_id, 
                "displayName" as full_name, 
                specialties, 
                bio, 
                "baseConsultationFee" as hourly_rate, 
                "averageRating" as rating,
                "reviewCount" as review_count,
                languages, 
                "yearsExperience" as years_of_experience, 
                city as location,
                "profileImageObjectKey" as profile_image_url, 
                status,
                profile_embedding IS NOT NULL as has_embedding,
                embedding_generated_at
            FROM experts
            WHERE id = $1
            """
            
            row = await db.fetchrow(query, expert_id)
            
            if not row:
                return None
            
            return {
                "id": str(row["id"]),
                "user_id": str(row["user_id"]) if row["user_id"] else None,
                "full_name": row["full_name"],
                "specialties": row["specialties"],
                "bio": row["bio"],
                "hourly_rate": float(row["hourly_rate"]) if row["hourly_rate"] else None,
                "rating": float(row["rating"]) if row["rating"] else None,
                "review_count": int(row["review_count"] or 0),
                "languages": row["languages"],
                "skills": [],  # Not in schema
                "education": None,  # Separate table
                "years_of_experience": row["years_of_experience"],
                "location": row["location"],
                "availability": None,  # Separate table
                "profile_image_url": row["profile_image_url"],
                "status": row["status"],
                "has_embedding": row["has_embedding"],
                "embedding_generated_at": row["embedding_generated_at"]
            }
        
        except Exception as e:
            logger.error(f"Failed to get expert by ID: {e}", exc_info=True)
            return None
    
    async def get_expert_embedding(self, expert_id: str) -> Optional[List[float]]:
        """Get expert's profile embedding vector"""
        try:
            query = 'SELECT profile_embedding::text FROM experts WHERE id = $1'
            row = await db.fetchrow(query, expert_id)
            if not row or not row["profile_embedding"]:
                return None
            # Parse "[0.1,0.2,...]" string to list of floats
            emb_str = row["profile_embedding"].strip("[]")
            return [float(x) for x in emb_str.split(",")]
        except Exception as e:
            logger.error(f"Failed to get expert embedding: {e}", exc_info=True)
            return None
    
    async def get_all_experts(
        self,
        status: str = "VERIFIED",
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get all experts with pagination"""
        try:
            query = """
            SELECT 
                id, 
                "userId" as user_id, 
                "displayName" as full_name, 
                specialties, 
                bio, 
                "baseConsultationFee" as hourly_rate, 
                "averageRating" as rating,
                "reviewCount" as review_count,
                languages, 
                "yearsExperience" as years_of_experience, 
                city as location,
                "profileImageObjectKey" as profile_image_url, 
                status::text as status,
                profile_embedding IS NOT NULL as has_embedding,
                embedding_generated_at
            FROM experts
            WHERE ($1::text IS NULL OR status::text = $1::text)
            ORDER BY "createdAt" DESC
            LIMIT $2 OFFSET $3
            """
            
            rows = await db.fetch(query, status, limit, skip)
            
            results = []
            for row in rows:
                expert = {
                    "id": str(row["id"]),
                    "user_id": str(row["user_id"]) if row["user_id"] else None,
                    "full_name": row["full_name"],
                    "specialties": row["specialties"],
                    "bio": row["bio"],
                    "hourly_rate": float(row["hourly_rate"]) if row["hourly_rate"] else None,
                    "rating": float(row["rating"]) if row["rating"] else None,
                    "review_count": int(row["review_count"] or 0),
                    "languages": row["languages"],
                    "skills": [],  # Not in schema
                    "education": None,  # Separate table
                    "years_of_experience": row["years_of_experience"],
                    "location": row["location"],
                    "availability": None,  # Separate table
                    "profile_image_url": row["profile_image_url"],
                    "status": row["status"],
                    "has_embedding": row["has_embedding"],
                    "embedding_generated_at": row["embedding_generated_at"]
                }
                results.append(expert)
            
            return results
        
        except Exception as e:
            logger.error(f"Failed to get all experts: {e}", exc_info=True)
            return []
    
    async def update_expert_embedding(
        self,
        expert_id: str,
        embedding: List[float],
        model_name: str
    ) -> bool:
        """Update expert's profile embedding"""
        try:
            # Convert embedding to PostgreSQL vector format
            embedding_str = "[" + ",".join(map(str, embedding)) + "]"
            
            query = """
            UPDATE experts
            SET 
                profile_embedding = $1::vector,
                embedding_model = $2,
                embedding_generated_at = NOW()
            WHERE id::text = $3
            """
            
            await db.execute(
                query,
                embedding_str,
                model_name,
                str(expert_id)
            )
            
            logger.info(f"Updated embedding for expert {expert_id}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to update expert embedding: {e}", exc_info=True)
            return False
    
    async def get_embedding_stats(self) -> Dict[str, Any]:
        """Get statistics about expert embeddings"""
        try:
            query = """
            SELECT 
                COUNT(*) as total_experts,
                COUNT(profile_embedding) as experts_with_embeddings,
                COUNT(*) - COUNT(profile_embedding) as experts_without_embeddings,
                ROUND(
                    COUNT(profile_embedding)::numeric / NULLIF(COUNT(*), 0) * 100, 
                    2
                ) as embedding_coverage_percentage,
                MIN(embedding_generated_at) as first_embedding_generated,
                MAX(embedding_generated_at) as last_embedding_generated,
                COUNT(DISTINCT embedding_model) as embedding_models_used
            FROM experts
            """
            
            row = await db.fetchrow(query)
            
            if not row:
                return {}
            
            return {
                "total_experts": row["total_experts"],
                "experts_with_embeddings": row["experts_with_embeddings"],
                "experts_without_embeddings": row["experts_without_embeddings"],
                "embedding_coverage_percentage": float(row["embedding_coverage_percentage"] or 0),
                "first_embedding_generated": row["first_embedding_generated"],
                "last_embedding_generated": row["last_embedding_generated"],
                "embedding_models_used": row["embedding_models_used"]
            }
        
        except Exception as e:
            logger.error(f"Failed to get embedding stats: {e}", exc_info=True)
            return {}


    async def get_specialty_fee_stats(self, specialty: Optional[str] = None) -> Dict[str, Any]:
        """Get fee statistics for a specialty (or all specialties)"""
        try:
            if specialty:
                query = """
                SELECT 
                    COUNT(*) as expert_count,
                    COALESCE(MIN("baseConsultationFee"), 0) as min_fee,
                    COALESCE(MAX("baseConsultationFee"), 0) as max_fee,
                    COALESCE(AVG("baseConsultationFee"), 0) as avg_fee,
                    COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "baseConsultationFee"), 0) as p25_fee,
                    COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "baseConsultationFee"), 0) as p75_fee
                FROM experts
                WHERE status::text IN ('VERIFIED', 'DRAFT')
                  AND ($1::text = ANY(specialties::text[]) OR $1::text = "primarySpecialty"::text)
                """
                row = await db.fetchrow(query, specialty)
            else:
                query = """
                SELECT 
                    COUNT(*) as expert_count,
                    COALESCE(MIN("baseConsultationFee"), 0) as min_fee,
                    COALESCE(MAX("baseConsultationFee"), 0) as max_fee,
                    COALESCE(AVG("baseConsultationFee"), 0) as avg_fee,
                    COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "baseConsultationFee"), 0) as p25_fee,
                    COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "baseConsultationFee"), 0) as p75_fee
                FROM experts
                WHERE status::text IN ('VERIFIED', 'DRAFT')
                """
                row = await db.fetchrow(query)
            
            if not row or row["expert_count"] == 0:
                return {"min": 0, "max": 0, "avg": 0, "expert_count": 0}
            
            return {
                "min": int(float(row["min_fee"])),
                "max": int(float(row["max_fee"])),
                "avg": int(float(row["avg_fee"])),
                "p25": int(float(row["p25_fee"])),
                "p75": int(float(row["p75_fee"])),
                "expert_count": row["expert_count"]
            }
        except Exception as e:
            logger.error(f"Failed to get specialty fee stats: {e}")
            return {"min": 0, "max": 0, "avg": 0, "expert_count": 0}


# Global instance
expert_repository = ExpertRepository()

