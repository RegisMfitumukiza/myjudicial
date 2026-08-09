"""Embedding service for generating vector embeddings"""
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import logging
import time
import hashlib
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings using Sentence Transformers"""
    
    def __init__(self):
        self.model: Optional[SentenceTransformer] = None
        self.model_name = settings.EMBEDDING_MODEL
        self.device = settings.EMBEDDING_DEVICE
        self.batch_size = settings.EMBEDDING_BATCH_SIZE
        self.cache_enabled = settings.CACHE_EMBEDDINGS
        self._embedding_cache: Dict[str, List[float]] = {}
        logger.info(f"Embedding service initialized with model: {self.model_name}")
    
    def load_model(self):
        """Load the embedding model (lazy loading)"""
        if self.model is None:
            try:
                start_time = time.time()
                logger.info(f"Loading embedding model: {self.model_name}")
                
                self.model = SentenceTransformer(
                    self.model_name,
                    device=self.device
                )
                
                load_time = time.time() - start_time
                logger.info(
                    f"Embedding model loaded successfully in {load_time:.2f}s "
                    f"(dimensions: {self.model.get_sentence_embedding_dimension()})"
                )
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}", exc_info=True)
                raise Exception(f"Failed to load embedding model: {str(e)}")
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def _get_from_cache(self, text: str) -> Optional[List[float]]:
        """Get embedding from cache if available"""
        if not self.cache_enabled:
            return None
        
        cache_key = self._get_cache_key(text)
        return self._embedding_cache.get(cache_key)
    
    def _add_to_cache(self, text: str, embedding: List[float]):
        """Add embedding to cache"""
        if not self.cache_enabled:
            return
        
        # Implement simple LRU-like behavior
        if len(self._embedding_cache) >= settings.CACHE_SIZE:
            # Remove oldest entry (first key)
            first_key = next(iter(self._embedding_cache))
            del self._embedding_cache[first_key]
        
        cache_key = self._get_cache_key(text)
        self._embedding_cache[cache_key] = embedding
    
    async def generate_embedding(
        self,
        text: str,
        normalize: bool = True
    ) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Text to encode
            normalize: Whether to normalize the embedding (for cosine similarity)
        
        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Check cache first
        cached = self._get_from_cache(text)
        if cached is not None:
            logger.debug(f"Retrieved embedding from cache for text: {text[:50]}...")
            return cached
        
        start_time = time.time()
        
        try:
            # Load model if not already loaded
            self.load_model()
            
            # Generate embedding
            embedding = self.model.encode(
                text,
                normalize_embeddings=normalize,
                show_progress_bar=False,
                convert_to_numpy=True
            )
            
            # Convert to list
            embedding_list = embedding.tolist()
            
            # Add to cache
            self._add_to_cache(text, embedding_list)
            
            processing_time = time.time() - start_time
            logger.info(
                f"Generated embedding in {processing_time:.3f}s "
                f"(text length: {len(text)}, dim: {len(embedding_list)})"
            )
            
            return embedding_list
        
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}", exc_info=True)
            raise Exception(f"Failed to generate embedding: {str(e)}")
    
    async def generate_embeddings_batch(
        self,
        texts: List[str],
        normalize: bool = True
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (more efficient)
        
        Args:
            texts: List of texts to encode
            normalize: Whether to normalize embeddings
        
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        start_time = time.time()
        
        try:
            # Load model if not already loaded
            self.load_model()
            
            # Check cache for each text
            results = []
            texts_to_encode = []
            text_indices = []
            
            for i, text in enumerate(texts):
                cached = self._get_from_cache(text)
                if cached is not None:
                    results.append(cached)
                else:
                    results.append(None)  # Placeholder
                    texts_to_encode.append(text)
                    text_indices.append(i)
            
            # Generate embeddings for uncached texts
            if texts_to_encode:
                logger.info(f"Generating embeddings for {len(texts_to_encode)} texts...")
                
                embeddings = self.model.encode(
                    texts_to_encode,
                    normalize_embeddings=normalize,
                    show_progress_bar=len(texts_to_encode) > 10,
                    batch_size=self.batch_size,
                    convert_to_numpy=True
                )
                
                # Convert to list and cache
                for i, (text, embedding) in enumerate(zip(texts_to_encode, embeddings)):
                    embedding_list = embedding.tolist()
                    self._add_to_cache(text, embedding_list)
                    results[text_indices[i]] = embedding_list
            
            processing_time = time.time() - start_time
            logger.info(
                f"Generated {len(texts)} embeddings in {processing_time:.2f}s "
                f"({len(texts_to_encode)} new, {len(texts) - len(texts_to_encode)} cached)"
            )
            
            return results
        
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}", exc_info=True)
            raise Exception(f"Failed to generate batch embeddings: {str(e)}")
    
    async def create_expert_profile_text(self, expert: Dict[str, Any]) -> str:
        """
        Create optimized text representation of expert profile for embedding
        
        Args:
            expert: Dictionary with expert data
        
        Returns:
            Formatted text for embedding
        """
        parts = []
        
        # Specialties (most important) - handle as array
        if expert.get('specialties'):
            specialties = expert['specialties']
            if isinstance(specialties, list):
                specialties_text = ", ".join(specialties)
            else:
                specialties_text = str(specialties)
            parts.append(f"{specialties_text} specialist")
        
        # Bio
        if expert.get('bio'):
            parts.append(expert['bio'])
        
        # Skills
        if expert.get('skills'):
            skills = expert['skills']
            if isinstance(skills, list):
                skills_text = ", ".join(skills)
            else:
                skills_text = str(skills)
            parts.append(f"Skills: {skills_text}")
        
        # Languages
        if expert.get('languages'):
            langs = expert['languages']
            if isinstance(langs, list):
                langs_text = ", ".join(langs)
            else:
                langs_text = str(langs)
            parts.append(f"Languages: {langs_text}")
        
        # Years of experience (if available)
        if expert.get('years_of_experience'):
            parts.append(f"{expert['years_of_experience']} years of experience")
        
        # Education (if available)
        if expert.get('education'):
            parts.append(f"Education: {expert['education']}")
        
        return " | ".join(parts)
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cache_enabled": self.cache_enabled,
            "cache_size": len(self._embedding_cache),
            "cache_limit": settings.CACHE_SIZE,
            "model_loaded": self.model is not None,
            "model_name": self.model_name,
            "embedding_dimensions": self.model.get_sentence_embedding_dimension() if self.model else settings.EMBEDDING_DIM
        }
    
    def clear_cache(self):
        """Clear the embedding cache"""
        self._embedding_cache.clear()
        logger.info("Embedding cache cleared")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check embedding service health"""
        try:
            # Try to load model
            self.load_model()
            
            # Generate a test embedding
            test_text = "test"
            test_embedding = await self.generate_embedding(test_text)
            
            return {
                "status": "healthy",
                "service": "embedding",
                "model": self.model_name,
                "dimensions": len(test_embedding),
                "device": self.device,
                "cache_stats": self.get_cache_stats()
            }
        except Exception as e:
            logger.error(f"Embedding health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "embedding",
                "error": str(e)
            }


# Global instance
embedding_service = EmbeddingService()

