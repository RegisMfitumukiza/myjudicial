"""FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
import logging

# Import routers FIRST
from app.api.routes import transcribe, translate, analyze, triage, search, recommend

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered legal expert recommendation system",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.BACKEND_URL, settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION
    }


# Root endpoint
@app.get("/")
async def root():
    """Service information"""
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "transcribe": f"{settings.API_PREFIX}/transcribe",
            "translate": f"{settings.API_PREFIX}/translate",
            "analyze": f"{settings.API_PREFIX}/analyze",
            "triage": f"{settings.API_PREFIX}/triage",
            "search": f"{settings.API_PREFIX}/search",
            "recommend": f"{settings.API_PREFIX}/recommend",
            "docs": "/docs" if settings.DEBUG else "disabled"
        }
    }


# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# Include routers
app.include_router(
    transcribe.router, 
    prefix=f"{settings.API_PREFIX}/transcribe", 
    tags=["Transcription"]
)
app.include_router(
    translate.router, 
    prefix=f"{settings.API_PREFIX}/translate", 
    tags=["Translation"]
)
app.include_router(
    analyze.router, 
    prefix=f"{settings.API_PREFIX}/analyze", 
    tags=["Case Analysis"]
)
app.include_router(
    triage.router, 
    prefix=f"{settings.API_PREFIX}/triage", 
    tags=["Full Triage"]
)
app.include_router(
    search.router, 
    prefix=f"{settings.API_PREFIX}/search", 
    tags=["Vector Search"]
)
app.include_router(
    recommend.router, 
    prefix=f"{settings.API_PREFIX}/recommend", 
    tags=["Recommendations"]
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"Whisper model: {settings.WHISPER_MODEL} on {settings.WHISPER_DEVICE}")
    if settings.LLM_PROVIDER == "groq":
        logger.info(f"LLM model: {settings.GROQ_MODEL} (Groq)")
    else:
        logger.info(f"LLM model: {settings.OLLAMA_MODEL} at {settings.OLLAMA_BASE_URL}")
    logger.info(f"Embedding model: {settings.EMBEDDING_MODEL} ({settings.EMBEDDING_DIM} dimensions)")
    logger.info("Whisper will be loaded on first transcription request (lazy loading)")
    logger.info("Embedding model will be loaded on first search request (lazy loading)")
    
    # Connect to database
    from app.db.database import db
    try:
        await db.connect()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
    
    logger.info("Application startup complete")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI service")
    
    # Close database connection
    from app.db.database import db
    try:
        await db.disconnect()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")
    
    logger.info("Shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
