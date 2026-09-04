"""Application configuration"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "MyJudicial AI Triage Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API
    API_PREFIX: str = "/api/v1"
    API_KEY: str  # Required
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    
    # CORS
    BACKEND_URL: str = "http://localhost:4000"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Database
    DATABASE_URL: str  # Required: postgresql://user:pass@host:5432/db
    
    # Ollama/LLM
    LLM_PROVIDER: str = "ollama"  # ollama or groq
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:latest"
    OLLAMA_TIMEOUT: int = 60
    
    # Groq (Alternative LLM provider)
    GROQ_API_KEY: str = ""  # Optional: Get from https://console.groq.com
    GROQ_MODEL: str = "openai/gpt-oss-20b"  # Migrated from deprecated llama-3.1-8b-instant
    
    # Whisper
    WHISPER_MODEL: str = "base.en"  # base, small, medium, large
    WHISPER_DEVICE: str = "cpu"  # cpu or cuda
    
    # Embeddings & Vector Search (Phase 4)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    EMBEDDING_DEVICE: str = "cpu"
    EMBEDDING_BATCH_SIZE: int = 32
    
    VECTOR_SEARCH_LIMIT: int = 50
    SIMILARITY_THRESHOLD: float = 0.5
    
    # Recommendation Ranking (Phase 5)
    SCORE_WEIGHT_SIMILARITY: float = 0.40
    SCORE_WEIGHT_RATING: float = 0.25
    SCORE_WEIGHT_BUDGET: float = 0.15
    SCORE_WEIGHT_REVIEWS: float = 0.10
    SCORE_WEIGHT_EXPERIENCE: float = 0.05
    SCORE_WEIGHT_SPECIALTY: float = 0.05
    
    RECOMMENDATION_LIMIT: int = 10
    MIN_RECOMMENDATION_SCORE: float = 0.3
    EXPLANATION_LEVEL: str = "detailed"  # minimal, detailed, verbose
    
    # Caching
    CACHE_EMBEDDINGS: bool = True
    CACHE_SIZE: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
