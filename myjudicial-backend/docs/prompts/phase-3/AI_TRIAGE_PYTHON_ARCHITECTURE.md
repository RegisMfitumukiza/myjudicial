# AI Triage System — Python Microservice Architecture

> **Architecture:** Standalone Python service communicating with Node.js backend  
> **Tech Stack:** FastAPI, Whisper.cpp, Ollama/Qwen, PostgreSQL (pgvector)  
> **Deployment:** Separate Docker container on Oracle Cloud

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MYJUDICIAL ECOSYSTEM                         │
│                                                                 │
│  ┌─────────────────┐         ┌──────────────────┐             │
│  │   Next.js       │         │   Node.js        │             │
│  │   Frontend      │ ─REST─→ │   Backend        │             │
│  │   (Port 3000)   │         │   (Port 4000)    │             │
│  └─────────────────┘         └────────┬─────────┘             │
│                                       │                         │
│                                       │ HTTP/REST               │
│                                       ↓                         │
│                            ┌──────────────────────┐            │
│                            │   Python AI Service  │            │
│                            │   FastAPI            │            │
│                            │   (Port 5000)        │            │
│                            └──────────┬───────────┘            │
│                                       │                         │
│                    ┌──────────────────┼──────────────────┐     │
│                    │                  │                  │     │
│              ┌─────▼─────┐     ┌─────▼─────┐    ┌──────▼────┐│
│              │  Whisper  │     │  Ollama   │    │PostgreSQL ││
│              │  .cpp     │     │  Qwen 2.5 │    │ +pgvector ││
│              │  (Audio)  │     │   (LLM)   │    │   (DB)    ││
│              └───────────┘     └───────────┘    └───────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
myjudicial-ai-service/          ← NEW Python project
│
├── app/
│   ├── __init__.py
│   ├── main.py                 ← FastAPI entry point
│   ├── config.py               ← Configuration
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── triage.py       ← Triage endpoints
│   │   │   ├── transcribe.py  ← Whisper endpoints
│   │   │   └── health.py      ← Health check
│   │   └── dependencies.py     ← Shared dependencies
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── whisper_service.py  ← Audio transcription
│   │   ├── llm_service.py      ← Qwen LLM integration
│   │   ├── vector_service.py   ← Embedding + search
│   │   └── ranking_service.py  ← Recommendation engine
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── triage.py           ← Pydantic models
│   │   ├── expert.py
│   │   └── response.py
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py         ← DB connection
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── expert_repo.py
│   │   │   └── triage_repo.py
│   │   └── models/
│   │       ├── __init__.py
│   │       └── expert.py       ← SQLAlchemy models
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── exceptions.py
│
├── tests/
│   ├── __init__.py
│   ├── test_triage.py
│   └── test_transcribe.py
│
├── scripts/
│   ├── setup_ollama.sh         ← Install Ollama + Qwen
│   ├── setup_whisper.sh        ← Install Whisper.cpp
│   └── generate_embeddings.py  ← Pre-compute expert embeddings
│
├── requirements.txt            ← Python dependencies
├── Dockerfile                  ← Production container
├── docker-compose.yml          ← Local development
├── .env.example
└── README.md
```

---

## 🔌 API Integration Pattern

### 1. Node.js Backend → Python AI Service

**Node.js makes HTTP requests to Python service:**

```typescript
// myjudicial-backend/src/modules/ai-triage/ai-triage.service.ts

import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

export const AiTriageService = {
  /**
   * Transcribe audio using Whisper
   */
  transcribeAudio: async (audioBuffer: Buffer, language?: string) => {
    const formData = new FormData();
    formData.append('audio', new Blob([audioBuffer]), 'audio.wav');
    if (language) formData.append('language', language);

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/transcribe`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data;
  },

  /**
   * Get expert recommendations
   */
  getRecommendations: async (data: {
    transcription: string;
    language: string;
    location?: { lat: number; lng: number };
    maxResults?: number;
  }) => {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/triage`,
      data
    );

    return response.data;
  },
};
```

---

### 2. Python FastAPI Service

**Python service handles AI processing:**

```python
# myjudicial-ai-service/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import triage, transcribe, health
from app.config import settings

app = FastAPI(
    title="MyJudicial AI Triage Service",
    version="1.0.0",
    description="AI-powered legal expert recommendation system"
)

# CORS for Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.BACKEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(transcribe.router, prefix="/api/v1/transcribe", tags=["transcribe"])
app.include_router(triage.router, prefix="/api/v1/triage", tags=["triage"])

@app.get("/")
async def root():
    return {"service": "MyJudicial AI Triage", "status": "operational"}
```

---

## 🚀 Implementation Phases

### **Phase 1: Setup & Infrastructure** (Week 1)

#### 1.1 Create Python Project
```bash
# Create new directory
cd e:\myJudicial
mkdir myjudicial-ai-service
cd myjudicial-ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create project structure
mkdir -p app/{api/routes,services,models,db/repositories,utils}
mkdir tests scripts

# Initialize files
touch app/__init__.py app/main.py app/config.py
touch requirements.txt Dockerfile docker-compose.yml
```

#### 1.2 Install Core Dependencies
```bash
# requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
asyncpg==0.29.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
httpx==0.26.0
python-jose[cryptography]==3.3.0
pgvector==0.2.4
numpy==1.26.3
sentence-transformers==2.3.1  # For embeddings

pip install -r requirements.txt
```

#### 1.3 Basic FastAPI Server
```python
# app/main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-triage"}

@app.post("/api/v1/transcribe")
async def transcribe_audio():
    return {"transcription": "Audio transcription endpoint"}

@app.post("/api/v1/triage")
async def get_recommendations():
    return {"recommendations": []}
```

**Test:**
```bash
uvicorn app.main:app --reload --port 5000
curl http://localhost:5000/health
```

---

### **Phase 2: Whisper Integration** (Week 2)

#### 2.1 Install Whisper.cpp
```bash
# scripts/setup_whisper.sh
#!/bin/bash

# Install whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make

# Download model (base English model)
bash ./models/download-ggml-model.sh base.en

# Or use Python wrapper
pip install whisper-cpp-python
```

#### 2.2 Whisper Service
```python
# app/services/whisper_service.py
import subprocess
import tempfile
from pathlib import Path
from app.config import settings

class WhisperService:
    def __init__(self):
        self.whisper_path = settings.WHISPER_CPP_PATH
        self.model_path = settings.WHISPER_MODEL_PATH

    async def transcribe(
        self, 
        audio_file: bytes, 
        language: str = "en"
    ) -> dict:
        """
        Transcribe audio using whisper.cpp
        """
        # Save audio to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_file)
            tmp_path = tmp.name

        try:
            # Run whisper.cpp
            cmd = [
                str(self.whisper_path / "main"),
                "-m", str(self.model_path),
                "-f", tmp_path,
                "-l", language,
                "--output-json"
            ]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                raise Exception(f"Whisper failed: {result.stderr}")
            
            return {
                "transcription": result.stdout.strip(),
                "language": language,
                "confidence": 0.95  # Parse from whisper output
            }
        finally:
            Path(tmp_path).unlink()

whisper_service = WhisperService()
```

#### 2.3 Transcribe Endpoint
```python
# app/api/routes/transcribe.py
from fastapi import APIRouter, File, UploadFile, Form
from app.services.whisper_service import whisper_service

router = APIRouter()

@router.post("/")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Transcribe audio file to text
    """
    audio_bytes = await audio.read()
    
    result = await whisper_service.transcribe(
        audio_bytes, 
        language
    )
    
    return {
        "success": True,
        "data": result
    }
```

---

### **Phase 3: Ollama + Qwen Integration** (Week 3)

#### 3.1 Install Ollama
```bash
# scripts/setup_ollama.sh
#!/bin/bash

# Install Ollama (Linux/Mac)
curl -fsSL https://ollama.com/install.sh | sh

# Pull Qwen 2.5 model
ollama pull qwen2.5:7b

# Or use Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker exec -it ollama ollama pull qwen2.5:7b
```

#### 3.2 LLM Service
```python
# app/services/llm_service.py
import httpx
from app.config import settings
from app.models.triage import IntentExtraction

class LLMService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL

    async def extract_intent(
        self, 
        transcription: str,
        language: str = "en"
    ) -> IntentExtraction:
        """
        Extract legal case intent from transcription
        """
        prompt = self._build_prompt(transcription, language)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=30.0
            )
            
            result = response.json()
            
        # Parse JSON response
        intent_data = result["response"]
        
        return IntentExtraction(
            case_type=intent_data["case_type"],
            urgency=intent_data["urgency"],
            keywords=intent_data["keywords"],
            summary=intent_data["summary"],
            specialties_needed=intent_data["specialties"]
        )

    def _build_prompt(self, transcription: str, language: str) -> str:
        """
        Build structured prompt for Qwen
        """
        return f"""
You are a legal assistant analyzing a client's case description.
Extract the following information in JSON format:

Transcription: "{transcription}"
Language: {language}

Extract:
{{
  "case_type": "criminal|civil|family|business|property|labor",
  "urgency": "low|medium|high",
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "Brief 1-sentence summary",
  "specialties": ["specialty1", "specialty2"]
}}

Respond with ONLY the JSON object, no explanation.
"""

llm_service = LLMService()
```

---

### **Phase 4: Vector Search** (Week 4)

#### 4.1 Setup pgvector
```sql
-- Run in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Create expert embeddings table
CREATE TABLE expert_embeddings (
    id SERIAL PRIMARY KEY,
    expert_id VARCHAR(255) UNIQUE NOT NULL,
    specialties TEXT[],
    embedding vector(384),  -- Sentence-BERT embedding size
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON expert_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 4.2 Generate Embeddings
```python
# scripts/generate_embeddings.py
from sentence_transformers import SentenceTransformer
import asyncpg
import asyncio

model = SentenceTransformer('all-MiniLM-L6-v2')  # 384 dimensions

async def generate_expert_embeddings():
    """
    Generate embeddings for all experts from main database
    """
    conn = await asyncpg.connect(
        host="localhost",
        database="myjudicial",
        user="postgres",
        password="your_password"
    )
    
    # Fetch experts with their specialties
    experts = await conn.fetch("""
        SELECT 
            ep.id,
            ep.user_id,
            array_agg(DISTINCT s.name) as specialties,
            ep.bio
        FROM expert_profiles ep
        JOIN expert_specialties es ON ep.id = es.expert_id
        JOIN specialties s ON es.specialty_id = s.id
        WHERE ep.status = 'VERIFIED'
        GROUP BY ep.id, ep.user_id, ep.bio
    """)
    
    for expert in experts:
        # Create text representation
        text = f"{' '.join(expert['specialties'])} {expert['bio']}"
        
        # Generate embedding
        embedding = model.encode(text).tolist()
        
        # Store in expert_embeddings table
        await conn.execute("""
            INSERT INTO expert_embeddings (expert_id, specialties, embedding)
            VALUES ($1, $2, $3)
            ON CONFLICT (expert_id) DO UPDATE
            SET embedding = $3, updated_at = NOW()
        """, expert['id'], expert['specialties'], embedding)
    
    await conn.close()
    print(f"Generated embeddings for {len(experts)} experts")

if __name__ == "__main__":
    asyncio.run(generate_expert_embeddings())
```

#### 4.3 Vector Search Service
```python
# app/services/vector_service.py
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from app.db.database import get_db

class VectorService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    async def search_similar_experts(
        self,
        query_text: str,
        limit: int = 50
    ) -> list[dict]:
        """
        Find experts similar to query using vector search
        """
        # Generate embedding for query
        query_embedding = self.model.encode(query_text).tolist()
        
        # Search using cosine similarity
        async with get_db() as db:
            result = await db.execute(
                text("""
                    SELECT 
                        expert_id,
                        specialties,
                        1 - (embedding <=> :query_embedding) as similarity
                    FROM expert_embeddings
                    ORDER BY embedding <=> :query_embedding
                    LIMIT :limit
                """),
                {
                    "query_embedding": str(query_embedding),
                    "limit": limit
                }
            )
            
            return [
                {
                    "expert_id": row[0],
                    "specialties": row[1],
                    "similarity": float(row[2])
                }
                for row in result
            ]

vector_service = VectorService()
```

---

### **Phase 5: Recommendation Engine** (Week 5)

```python
# app/services/ranking_service.py
from datetime import datetime
from app.db.repositories.expert_repo import expert_repository

class RankingService:
    async def rank_experts(
        self,
        candidate_ids: list[str],
        user_location: dict = None,
        filters: dict = None
    ) -> list[dict]:
        """
        Re-rank candidates by availability, rating, distance, price
        """
        # Fetch expert details from main database
        experts = await expert_repository.get_by_ids(candidate_ids)
        
        scored_experts = []
        for expert in experts:
            score = self._calculate_score(expert, user_location)
            scored_experts.append({
                **expert,
                "match_score": score
            })
        
        # Sort by score descending
        scored_experts.sort(key=lambda x: x["match_score"], reverse=True)
        
        return scored_experts[:5]  # Top 5

    def _calculate_score(self, expert: dict, user_location: dict) -> float:
        """
        Calculate composite score:
        - Availability: 30%
        - Rating: 25%
        - Distance: 25%
        - Price: 20%
        """
        score = 0.0
        
        # Availability (0-30 points)
        if expert.get("is_available"):
            score += 30
        elif expert.get("next_available_slot"):
            # Reduce score based on days until available
            days_until = (expert["next_available_slot"] - datetime.now()).days
            score += max(0, 30 - (days_until * 2))
        
        # Rating (0-25 points)
        avg_rating = expert.get("average_rating", 0)
        score += (avg_rating / 5.0) * 25
        
        # Distance (0-25 points)
        if user_location and expert.get("location"):
            distance_km = self._calculate_distance(
                user_location,
                expert["location"]
            )
            # Closer = higher score (exponential decay)
            score += 25 * (0.9 ** distance_km)
        else:
            score += 12.5  # Neutral if no location data
        
        # Price (0-20 points) - lower price = higher score
        avg_price = expert.get("average_price", 0)
        if avg_price > 0:
            # Inverse relationship (normalize to 0-20)
            max_price = 100000  # RWF
            score += 20 * (1 - min(avg_price / max_price, 1))
        else:
            score += 10
        
        return score

    def _calculate_distance(self, loc1: dict, loc2: dict) -> float:
        """Haversine distance in km"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth radius in km
        
        lat1, lon1 = radians(loc1["lat"]), radians(loc1["lng"])
        lat2, lon2 = radians(loc2["lat"]), radians(loc2["lng"])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c

ranking_service = RankingService()
```

---

### **Phase 6: Complete Triage Endpoint** (Week 6)

```python
# app/api/routes/triage.py
from fastapi import APIRouter, HTTPException
from app.models.triage import TriageRequest, TriageResponse
from app.services.llm_service import llm_service
from app.services.vector_service import vector_service
from app.services.ranking_service import ranking_service

router = APIRouter()

@router.post("/", response_model=TriageResponse)
async def process_triage(request: TriageRequest):
    """
    Complete triage pipeline:
    1. Extract intent from transcription (LLM)
    2. Find similar experts (Vector Search)
    3. Rank by availability, rating, distance (Ranking)
    """
    try:
        # Step 1: Extract intent using Qwen
        intent = await llm_service.extract_intent(
            request.transcription,
            request.language
        )
        
        # Step 2: Vector search for similar experts
        query_text = f"{intent.summary} {' '.join(intent.keywords)}"
        candidates = await vector_service.search_similar_experts(
            query_text,
            limit=50
        )
        
        candidate_ids = [c["expert_id"] for c in candidates]
        
        # Step 3: Rank by business logic
        recommendations = await ranking_service.rank_experts(
            candidate_ids,
            user_location=request.location,
            filters=request.filters
        )
        
        return TriageResponse(
            success=True,
            intent=intent,
            recommendations=recommendations,
            total_candidates=len(candidates),
            processing_time_ms=0  # Add timing
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Triage processing failed: {str(e)}"
        )
```

---

## 🐳 Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Download models at build time
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

EXPOSE 5000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-service:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/myjudicial
      - OLLAMA_URL=http://ollama:11434
      - WHISPER_CPP_PATH=/app/whisper.cpp
    volumes:
      - ./app:/app/app
      - whisper-models:/app/whisper.cpp/models
    depends_on:
      - ollama
      - postgres

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_PASSWORD=your_password
      - POSTGRES_DB=myjudicial
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  ollama-data:
  postgres-data:
  whisper-models:
```

---

## 🔒 Security & Authentication

```python
# app/api/dependencies.py
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    """
    Verify requests from Node.js backend
    """
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True
```

**Usage in Node.js:**
```typescript
const response = await axios.post(
  `${AI_SERVICE_URL}/api/v1/triage`,
  data,
  {
    headers: {
      'X-API-Key': process.env.AI_SERVICE_API_KEY
    }
  }
);
```

---

## 📊 Monitoring & Logging

```python
# app/utils/logger.py
import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger("ai-triage")
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

---

## 🚀 Deployment Checklist

### Oracle Cloud Setup
1. [ ] Create new compute instance (Python AI Service)
2. [ ] Install Docker and Docker Compose
3. [ ] Clone ai-service repository
4. [ ] Set environment variables
5. [ ] Run `docker-compose up -d`
6. [ ] Configure firewall (port 5000)
7. [ ] Test connectivity from Node.js backend

### Environment Variables
```bash
# .env
DATABASE_URL=postgresql://user:pass@db-host:5432/myjudicial
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5:7b
WHISPER_CPP_PATH=/app/whisper.cpp
WHISPER_MODEL_PATH=/app/whisper.cpp/models/ggml-base.en.bin
API_KEY=your-secret-api-key-here
BACKEND_URL=https://api.myjudicial.com
```

---

## 📈 Performance Optimization

### Caching
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_expert_embedding(expert_id: str):
    """Cache expert embeddings in memory"""
    return fetch_from_db(expert_id)
```

### Async Processing
```python
import asyncio

async def process_batch(requests: list):
    """Process multiple triage requests in parallel"""
    tasks = [process_triage(req) for req in requests]
    return await asyncio.gather(*tasks)
```

---

## 🎯 Summary

**Architecture:** Microservice (Python FastAPI)  
**Communication:** REST API (Node.js ↔ Python)  
**AI Stack:** Whisper.cpp + Ollama/Qwen + pgvector  
**Deployment:** Separate Docker container  
**Timeline:** 6 weeks full implementation

**Next Step:** Create the Python project and start with Phase 1 (Setup & Infrastructure)

Would you like me to create the initial Python project structure and FastAPI boilerplate?
