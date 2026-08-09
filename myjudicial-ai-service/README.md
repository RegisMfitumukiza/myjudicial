# MyJudicial AI Service

🤖 **AI-powered legal triage and expert recommendation system** for the MyJudicial platform - connecting citizens with the right legal experts through intelligent case analysis, semantic search, and multi-factor recommendations.

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791.svg)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-0.5%2B-orange.svg)](https://github.com/pgvector/pgvector)

## 🎯 What This Service Does

MyJudicial AI Service intelligently matches citizens with legal experts by:
- **🔍 Understanding legal cases** through natural language analysis using LLMs
- **⭐ Recommending experts** using vector similarity search and multi-factor scoring
- **🌍 Translating documents** between English, French, and Kinyarwanda
- **🎙️ Transcribing consultations** from audio to text using Whisper
- **🏥 Triaging cases** by urgency, specialty, and complexity

Built for **Rwanda's legal ecosystem** with support for local languages and regulations.

---

## ✨ Key Features

### 1. Semantic Expert Search
Vector-based similarity search finds experts matching case descriptions:
```python
POST /api/v1/search/experts
{
  "query": "I need help with a land boundary dispute",
  "max_budget": 150000,
  "min_rating": 4.0
}
```
Returns experts ranked by relevance, not just keyword matching.

### 2. Case Analysis & Triage
LLM-powered analysis extracts:
- Legal specialty required (Property Law, Family Law, etc.)
- Urgency level (Critical, High, Medium, Low)
- Budget estimation
- Key legal entities and concepts

### 3. Multi-Factor Expert Recommendations
Combines multiple signals:
- **Semantic similarity** (0-100 points) - How well expert matches case
- **Rating score** (0-50 points) - Expert reputation
- **Price competitiveness** (0-30 points) - Value for money
- **Experience** (0-20 points) - Years in practice

### 4. Multilingual Translation
Translate legal documents between:
- English ↔ French
- English ↔ Kinyarwanda
- French ↔ Kinyarwanda

### 5. Audio Transcription
Convert consultation recordings to text using OpenAI Whisper.

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node.js API    │  (API Gateway)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Python AI      │  ◄── This Service
│    Service      │
└────────┬────────┘
         │
         ├─────────► PostgreSQL + pgvector (Expert profiles & embeddings)
         ├─────────► Ollama (LLM: qwen2.5:1.5b)
         └─────────► sentence-transformers (Embeddings)
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Framework** | FastAPI | REST API with async support |
| **Database** | PostgreSQL 15 + pgvector | Vector storage & similarity search |
| **Embeddings** | sentence-transformers | Convert text to 384D vectors |
| **LLM** | Ollama (qwen2.5:1.5b) | Case analysis & triage |
| **Translation** | Ollama + custom prompts | Multilingual support |
| **Transcription** | OpenAI Whisper (base.en) | Audio → Text |
| **ORM** | asyncpg | Async PostgreSQL driver |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- Ollama with qwen2.5:1.5b model
- ~2GB RAM for models

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/myjudicial-ai-service.git
   cd myjudicial-ai-service
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   # Core dependencies
   pip install -r requirements.txt
   
   # Optional: Whisper for transcription
   pip install -r requirements-whisper.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Set up database**
   ```sql
   -- Run in PostgreSQL
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Run setup script
   psql -U postgres -d your_db -f scripts/setup_pgvector.sql
   ```

6. **Verify database setup**
   ```bash
   python scripts/check_db_setup.py
   ```

7. **Generate expert embeddings**
   ```bash
   python scripts/generate_expert_embeddings.py
   ```

7. **Start the service**
   ```bash
   # Windows
   start.bat
   
   # Linux/Mac
   uvicorn app.main:app --host 0.0.0.0 --port 5000
   ```

8. **Access API docs**
   ```
   http://localhost:5000/docs
   ```

---

## 📚 API Documentation

### Core Endpoints

#### 🔍 Search Experts
```http
POST /api/v1/search/experts
Content-Type: application/json

{
  "query": "property dispute lawyer",
  "specialty": "PROPERTY_LAW",
  "max_budget": 150000,
  "min_rating": 4.0,
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "specialties": ["PROPERTY_LAW"],
      "hourly_rate": 50000,
      "rating": 4.5,
      "similarity_score": 0.89
    }
  ],
  "total": 5,
  "processing_time": 0.15
}
```

#### 📊 Analyze Case
```http
POST /api/v1/analyze/
Content-Type: application/json

{
  "case_description": "My neighbor built a fence on my property without permission"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "specialty": "PROPERTY_LAW",
    "urgency_level": "MEDIUM",
    "estimated_budget": {"min": 50000, "max": 200000},
    "key_entities": ["property", "boundary", "neighbor"],
    "summary": "Land boundary dispute requiring property law expertise"
  }
}
```

#### ⭐ Get Recommendations
```http
POST /api/v1/recommend/
Content-Type: application/json

{
  "query": "land dispute with neighbor",
  "max_budget": 150000
}
```

**Response:**
```json
{
  "success": true,
  "case_analysis": { ... },
  "recommendations": [
    {
      "expert": { ... },
      "scores": {
        "similarity_score": 85.5,
        "rating_score": 45.0,
        "price_score": 25.0,
        "experience_score": 15.0,
        "total_score": 170.5
      },
      "explanation": "Expert in property law with 10 years experience..."
    }
  ]
}
```

See full API documentation at `/docs` (Swagger UI) when service is running.

---

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Ollama LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:1.5b

# Embeddings
EMBEDDING_MODEL=all-MiniLM-L6-v2  # 384 dimensions
EMBEDDING_DEVICE=cpu  # or cuda

# Whisper
WHISPER_MODEL=base.en
WHISPER_DEVICE=cpu

# API
API_HOST=0.0.0.0
API_PORT=5000
API_RELOAD=false

# Search
SIMILARITY_THRESHOLD=0.5  # Minimum similarity score (0-1)
```

---

## 🧪 Testing

### Run Tests
```bash
# Verify database setup
python scripts/check_db_setup.py

# Check expert status
python scripts/check_experts.py

# Test all endpoints
python test_routes.py
```

### Manual Testing with curl
```bash
# Health check
curl http://localhost:5000/health

# Search experts
curl -X POST http://localhost:5000/api/v1/search/experts \
  -H "Content-Type: application/json" \
  -d '{"query": "tax lawyer", "limit": 5}'
```

---

## 📊 Performance

### Embedding Generation
- **First run:** 3-6 minutes (downloads model ~90MB)
- **Subsequent runs:** 5-10 seconds (model cached)
- **Per expert:** ~2 seconds average

### Search Performance
- **First search:** 8-10 seconds (loads embedding model)
- **Subsequent searches:** < 1 second (model cached in memory)
- **With HNSW index:** < 100ms query time

### Resource Usage
- **RAM:** ~1.5GB (with all models loaded)
- **Disk:** ~1.5GB (models + cache)
- **CPU:** 2+ cores recommended

---

## 🏗️ Project Structure

```
myjudicial-ai-service/
├── app/
│   ├── api/
│   │   └── routes/          # API endpoint definitions
│   │       ├── analyze.py   # Case analysis
│   │       ├── recommend.py # Expert recommendations
│   │       ├── search.py    # Vector search
│   │       ├── transcribe.py # Audio transcription
│   │       ├── translate.py # Document translation
│   │       └── triage.py    # Case triage
│   ├── db/
│   │   ├── database.py      # Database connection
│   │   └── repositories/    # Data access layer
│   ├── models/              # Pydantic models
│   ├── services/            # Business logic
│   │   ├── embedding_service.py
│   │   ├── llm_service.py
│   │   ├── ranking_service.py
│   │   ├── vector_search_service.py
│   │   └── whisper_service.py
│   ├── config.py            # Configuration
│   └── main.py              # FastAPI application
├── scripts/
│   ├── setup_pgvector.sql   # Database setup
│   └── generate_expert_embeddings.py
├── tests/                   # Test suite
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

---

## 🔒 Security

### Authentication
- API key authentication for service-to-service communication
- JWT token validation (when integrated with Node.js backend)

### Rate Limiting
- Per-endpoint rate limits (configurable)
- IP-based throttling

### Data Privacy
- No user data stored in AI service
- Expert profiles accessed read-only
- All processing ephemeral (no logs of sensitive data)

---

## 🚢 Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

### Environment-Specific Configs
- **Development:** Use `--reload` flag
- **Staging:** Enable debug logging
- **Production:** Disable reload, set workers=4

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guide
- Add type hints to all functions
- Write docstrings for public APIs
- Add tests for new features
- Update API documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **pgvector** - Vector similarity search in PostgreSQL
- **sentence-transformers** - Text embeddings
- **Ollama** - Local LLM inference
- **FastAPI** - Modern Python web framework
- **OpenAI Whisper** - Speech recognition

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/myjudicial-ai-service/issues)
- **Documentation:** [Wiki](https://github.com/yourusername/myjudicial-ai-service/wiki)
- **Email:** support@myjudicial.com

---

## 🗺️ Roadmap

- [ ] Add more Rwandan legal specialties
- [ ] Support for more languages (Swahili, etc.)
- [ ] Batch embedding generation via API
- [ ] Real-time expert availability check
- [ ] Case outcome prediction model
- [ ] Integration with document OCR
- [ ] Mobile-optimized responses

---

**Built with ❤️ for Rwanda's legal ecosystem**
