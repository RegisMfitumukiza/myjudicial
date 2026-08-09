# AI Triage Python Service — Setup Guide

> **Location:** `e:\myJudicial\myjudicial-ai-service\`  
> **Structure:** Monorepo with Node.js backend, Next.js frontend, and Python AI service

---

## 📁 Monorepo Structure

```
e:\myJudicial\
│
├── myjudicial-backend/          ← Node.js/TypeScript backend (existing)
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── myjudicial-frontend/         ← Next.js frontend (existing)
│   ├── src/
│   └── package.json
│
├── myjudicial-ai-service/       ← Python AI service (NEW)
│   ├── app/
│   ├── tests/
│   ├── scripts/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── docker-compose.yml           ← Orchestrate all services
├── .gitignore                   ← Update for Python
└── README.md                    ← Update with AI service info
```

---

## 🚀 Step-by-Step Setup

### Step 1: Create Python Project Structure

```bash
# Navigate to myJudicial root
cd e:\myJudicial

# Create Python service directory
mkdir myjudicial-ai-service
cd myjudicial-ai-service

# Create directory structure
mkdir -p app/api/routes
mkdir -p app/services
mkdir -p app/models
mkdir -p app/db/repositories
mkdir -p app/db/models
mkdir -p app/utils
mkdir -p tests
mkdir -p scripts
mkdir -p models  # For ML model files

# Create __init__.py files
type nul > app/__init__.py
type nul > app/api/__init__.py
type nul > app/api/routes/__init__.py
type nul > app/services/__init__.py
type nul > app/models/__init__.py
type nul > app/db/__init__.py
type nul > app/db/repositories/__init__.py
type nul > app/db/models/__init__.py
type nul > app/utils/__init__.py
type nul > tests/__init__.py
```

---

### Step 2: Create Core Files

#### `requirements.txt`
```text
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
asyncpg==0.29.0
psycopg2-binary==2.9.9
pgvector==0.2.4

# Data Validation
pydantic==2.5.3
pydantic-settings==2.1.0

# ML/AI
sentence-transformers==2.3.1
numpy==1.26.3
torch==2.1.2
transformers==4.36.2

# HTTP Client
httpx==0.26.0

# Utilities
python-dotenv==1.0.0
python-jose[cryptography]==3.3.0
python-multipart==0.0.6

# Logging
python-json-logger==2.0.7

# Testing (optional)
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.26.0
```

---

#### `app/config.py`
```python
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
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_TIMEOUT: int = 30
    
    # Whisper
    WHISPER_MODEL: str = "base.en"  # base, small, medium, large
    WHISPER_DEVICE: str = "cpu"  # cpu or cuda
    
    # Embeddings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    
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
```

---

#### `app/main.py`
```python
"""FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.utils.logger import logger

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
            "triage": f"{settings.API_PREFIX}/triage",
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

# Include routers (we'll add these later)
# from app.api.routes import transcribe, triage
# app.include_router(transcribe.router, prefix=f"{settings.API_PREFIX}/transcribe", tags=["transcribe"])
# app.include_router(triage.router, prefix=f"{settings.API_PREFIX}/triage", tags=["triage"])

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    # Initialize database connection
    # Load ML models
    # Warm up Ollama
    pass

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI service")
    # Close database connections
    # Release ML models
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
```

---

#### `app/utils/logger.py`
```python
"""Logging configuration"""
import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logger(name: str = "ai-triage") -> logging.Logger:
    """Setup structured JSON logger"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    
    # JSON formatter
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    return logger

logger = setup_logger()
```

---

#### `app/api/dependencies.py`
```python
"""FastAPI dependencies for authentication and validation"""
from fastapi import Header, HTTPException, status
from app.config import settings

async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """
    Verify API key from Node.js backend
    
    Usage in routes:
        @router.post("/", dependencies=[Depends(verify_api_key)])
    """
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return True
```

---

#### `.env.example`
```bash
# Application
APP_NAME="MyJudicial AI Triage Service"
DEBUG=false

# API Security
API_KEY=your-secret-api-key-change-in-production

# Server
HOST=0.0.0.0
PORT=5000

# CORS
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

# Database (shared with Node.js backend)
DATABASE_URL=postgresql://postgres:password@localhost:5432/myjudicial

# Ollama/LLM
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_TIMEOUT=30

# Whisper
WHISPER_MODEL=base.en
WHISPER_DEVICE=cpu

# Embeddings
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIM=384

# Caching
CACHE_EMBEDDINGS=true
CACHE_SIZE=1000
```

---

#### `Dockerfile`
```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download embedding model at build time (cache it)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY app/ ./app/

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

---

#### `README.md`
```markdown
# MyJudicial AI Triage Service

AI-powered legal expert recommendation system using:
- **Whisper.cpp** for audio transcription
- **Ollama/Qwen 2.5** for intent extraction
- **pgvector** for semantic expert search
- **Custom ranking** for recommendations

## Setup

### 1. Create Virtual Environment
\`\`\`bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
\`\`\`

### 2. Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 3. Configure Environment
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 4. Run Development Server
\`\`\`bash
uvicorn app.main:app --reload --port 5000
\`\`\`

### 5. Test
\`\`\`bash
curl http://localhost:5000/health
\`\`\`

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/transcribe` - Audio transcription
- `POST /api/v1/triage` - Get expert recommendations

## Development

See [AI_TRIAGE_PYTHON_ARCHITECTURE.md](../myjudicial-backend/docs/prompts/phase-3/AI_TRIAGE_PYTHON_ARCHITECTURE.md) for detailed architecture.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.
```

---

### Step 3: Create `.gitignore` for Python

Add to existing `.gitignore` in `e:\myJudicial\`:

```gitignore
# Python
myjudicial-ai-service/venv/
myjudicial-ai-service/.venv/
myjudicial-ai-service/__pycache__/
myjudicial-ai-service/**/__pycache__/
myjudicial-ai-service/*.pyc
myjudicial-ai-service/.pytest_cache/
myjudicial-ai-service/.coverage
myjudicial-ai-service/htmlcov/
myjudicial-ai-service/.env
myjudicial-ai-service/.env.local

# ML Models (too large for git)
myjudicial-ai-service/models/*.bin
myjudicial-ai-service/models/*.gguf
myjudicial-ai-service/models/*.pt
myjudicial-ai-service/models/*.pth

# Whisper
myjudicial-ai-service/whisper.cpp/
```

---

### Step 4: Create Root `docker-compose.yml`

Update or create `e:\myJudicial\docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Existing Node.js backend
  backend:
    build: ./myjudicial-backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/myjudicial
      - AI_SERVICE_URL=http://ai-service:5000
      - AI_SERVICE_API_KEY=${AI_SERVICE_API_KEY}
    depends_on:
      - postgres
      - ai-service
    volumes:
      - ./myjudicial-backend/src:/app/src

  # Existing Next.js frontend
  frontend:
    build: ./myjudicial-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on:
      - backend
    volumes:
      - ./myjudicial-frontend/src:/app/src

  # NEW: Python AI Service
  ai-service:
    build: ./myjudicial-ai-service
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/myjudicial
      - OLLAMA_URL=http://ollama:11434
      - API_KEY=${AI_SERVICE_API_KEY}
      - BACKEND_URL=http://backend:4000
      - DEBUG=true
    depends_on:
      - postgres
      - ollama
    volumes:
      - ./myjudicial-ai-service/app:/app/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload

  # Ollama for LLM (Qwen)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0

  # Shared PostgreSQL database
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myjudicial
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Redis (optional - for caching)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  ollama-data:
  redis-data:
```

---

### Step 5: Initialize Python Project

```bash
cd e:\myJudicial\myjudicial-ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env with your values
notepad .env
```

---

### Step 6: Test Local Setup

```bash
# Terminal 1: Start AI service
cd e:\myJudicial\myjudicial-ai-service
venv\Scripts\activate
uvicorn app.main:app --reload --port 5000

# Terminal 2: Test
curl http://localhost:5000/health

# Expected output:
{
  "status": "healthy",
  "service": "MyJudicial AI Triage Service",
  "version": "1.0.0"
}
```

---

### Step 7: Connect Node.js Backend

Create Node.js integration:

```typescript
// myjudicial-backend/src/modules/ai-triage/ai-client.service.ts

import axios, { AxiosInstance } from 'axios';
import { logger } from '@/shared/utils/logger';

class AiServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AI_SERVICE_URL || 'http://localhost:5000',
      timeout: 30000,
      headers: {
        'X-API-Key': process.env.AI_SERVICE_API_KEY,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('AI service health check failed', { error });
      return false;
    }
  }

  /**
   * Transcribe audio file
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    language: string = 'en'
  ): Promise<{ transcription: string; confidence: number }> {
    const formData = new FormData();
    formData.append('audio', new Blob([audioBuffer]), 'audio.wav');
    formData.append('language', language);

    const response = await this.client.post(
      '/api/v1/transcribe',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data.data;
  }

  /**
   * Get expert recommendations
   */
  async getRecommendations(data: {
    transcription: string;
    language: string;
    location?: { lat: number; lng: number };
    filters?: Record<string, any>;
  }): Promise<any[]> {
    const response = await this.client.post('/api/v1/triage', data);
    return response.data.data.recommendations;
  }
}

export const aiServiceClient = new AiServiceClient();
```

Add to `myjudicial-backend/.env`:
```bash
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_API_KEY=your-secret-api-key-change-in-production
```

---

## 🎯 Quick Start Commands

```bash
# Install Python dependencies
cd myjudicial-ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run AI service
uvicorn app.main:app --reload --port 5000

# Run with Docker Compose (all services)
cd e:\myJudicial
docker-compose up -d

# View logs
docker-compose logs -f ai-service

# Stop all services
docker-compose down
```

---

## 📋 Next Steps

1. ✅ Complete basic FastAPI setup (this guide)
2. ⏳ Implement Whisper transcription endpoint
3. ⏳ Integrate Ollama/Qwen for intent extraction
4. ⏳ Setup pgvector for semantic search
5. ⏳ Build recommendation ranking algorithm
6. ⏳ Create comprehensive tests
7. ⏳ Deploy to Oracle Cloud

**Follow:** `AI_TRIAGE_PYTHON_ARCHITECTURE.md` for detailed implementation of each phase.

---

## 🔗 Related Documents

- **[AI_TRIAGE_PYTHON_ARCHITECTURE.md](./AI_TRIAGE_PYTHON_ARCHITECTURE.md)** — Complete architecture guide
- **[21_AI_Triage_System.md](./21_AI_Triage_System.md)** — Feature requirements

---

**Created:** July 16, 2026  
**Status:** Ready for implementation  
**Location:** `e:\myJudicial\myjudicial-ai-service\`
