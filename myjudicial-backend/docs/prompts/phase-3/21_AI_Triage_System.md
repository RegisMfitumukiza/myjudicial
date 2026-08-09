# AI Triage System — Requirements Document

> **Feature ID:** Phase 3.21  
> **Priority:** Critical (Core differentiator vs competitors)  
> **Roadmap:** v1.0 MVP (Week 6)  
> **Dependencies:** Ollama, Whisper.cpp, Qwen 2.5, PostgreSQL vector extension

---

## 1. Product Context

The **AI Triage Agent** is MyJudicial's **primary onboarding tool** for citizens who don't know:
- Which type of lawyer they need
- How much their case might cost
- How urgent their situation is
- What documents to prepare

### The Problem

**Current State (Manual):**
- Citizen calls law firm → receptionist asks questions → schedules intake meeting → lawyer reviews → assigns specialty
- **Time:** 3-5 days average
- **Cost:** Often requires paid consultation just to get directed to the right lawyer
- **Friction:** Phone tag, language barriers, intimidation factor

**AI Triage Solution:**
- Citizen speaks or types in Kinyarwanda → AI analyzes → Recommends 3 best-match lawyers → Books instantly
- **Time:** Under 2 minutes
- **Cost:** Free triage
- **Friction:** None — conversational, available 24/7, no judgment


### Current Implementation Status

✅ **Existing (UI Mockup Only):**
- Frontend chat interface at `/search/triage`
- Hardcoded "AI" responses (not real AI)
- Microphone button (non-functional)
- Expert recommendation cards (static mock data)

❌ **Missing (Actual AI):**
- Whisper.cpp speech-to-text integration
- Ollama + Qwen 2.5 intent extraction
- Vector embedding matching
- Triage session storage
- WhatsApp voice message pipeline

**Gap:** Frontend looks impressive, but clicking "Send" triggers fake responses. Need to wire up real AI backend.

---

## 2. Architecture Overview

### 2.1 System Flow (Complete Pipeline)

```
User Input (Voice or Text)
         │
         ▼
[ STEP 1: Whisper.cpp ]  ← If audio
    Speech-to-Text (Kinyarwanda)
         │
         ▼
[ Text Normalization ]
         │
         ▼
[ STEP 2: Qwen 2.5 (1.5B Instruct) via Ollama ]
    Legal Intent Extraction
    Context: Mbaza NLP Corpus (Rwanda legal terms)
         │
         ▼
[ Structured JSON Output ]
  {
    "jurisdiction": "RWANDA_KIGALI",
    "specialty": "PROPERTY_LAW",
    "urgency_level": "HIGH",
    "budget_range": "10000-50000",
    "key_entities": ["land", "boundary", "title deed"],
    "suggested_documents": ["Title deed", "Survey report"]
  }
         │
         ▼
[ STEP 3: VECTOR SEARCH (pgvector) ]
    ⭐ Core Technology Component of AI Triage ⭐
    
    Convert user issue to embedding (768-dim vector)
    Search expert_specialty_embeddings table
    Find top 50 experts with highest cosine similarity
    
    SQL Query:
    SELECT expert_id, 
      1 - (embedding <=> user_embedding) AS similarity_score
    FROM expert_specialty_embeddings
    ORDER BY similarity_score DESC
    LIMIT 50;
    
    Output: 50 candidate experts ranked by specialty match
         │
         ▼
[ STEP 4: RECOMMENDATION ENGINE ]
    ⭐ Core Technology Component of AI Triage ⭐
    
    Re-rank 50 candidates using multiple signals:
    - Vector similarity (30% weight)
    - Availability in next 7 days (25% weight)
    - Average rating 4.5+ stars (20% weight)
    - Language compatibility (15% weight)
    - Price within budget range (10% weight)
    
    Formula:
    final_score = (vector * 0.30) + (avail * 0.25) + 
                  (rating * 0.20) + (lang * 0.15) + (price * 0.10)
    
    Output: Top 3 best-fit experts
         │
         ▼
[ Frontend Display ]
    Show expert cards with:
    - Match score (92% compatible)
    - Next available slot
    - Flat fee price
    - "Book Now" CTA
```

### 2.2 Technology Stack (AI Triage Complete System)

| Component | Technology | Purpose | Role in AI Triage |
|-----------|-----------|---------|-------------------|
| **Speech-to-Text** | Whisper.cpp (Base model) | Convert Kinyarwanda audio to text | Step 1: Voice intake |
| **LLM Inference** | Qwen 2.5 (1.5B Instruct, Q4 quantized) | Extract legal intent, structured output | Step 2: Intent extraction |
| **Model Server** | Ollama | Manage Qwen model lifecycle, API gateway | Runtime for Qwen |
| **Vector Search** ⭐ | PostgreSQL + pgvector | Find experts with similar specialties | Step 3: Semantic matching (50 candidates) |
| **Recommendation Engine** ⭐ | Custom ranking algorithm | Re-rank by multiple business factors | Step 4: Best-fit selection (Top 3) |
| **Context Corpus** | Mbaza NLP Corpus | Rwanda-specific legal term context | Enhance Qwen accuracy |
| **Session Storage** | PostgreSQL (`triage_sessions` table) | Persist conversation history | Chat continuity |
| **API Runtime** | Node.js + Express | Triage API endpoints | Orchestrate all steps |
| **Frontend** | Next.js + React | Chat UI, microphone input | User interface |

**Note:** Vector Search and Recommendation Engine are **NOT separate features** — they are the matching/ranking technology that powers AI Triage expert recommendations.

---

## 3. User Stories

### 3.1 Citizen Journey

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| T-01 | Kinyarwanda-speaking citizen | Speak to the AI in my language | I don't need to know English or legal jargon |
| T-02 | User with low literacy | Use voice input instead of typing | I can describe my case even if I can't read/write well |
| T-03 | User with urgent issue | See "urgency level" detected by AI | I know if I need same-day help vs scheduled consultation |
| T-04 | Budget-conscious user | See estimated cost range before being matched | I can decide if I can afford the service |
| T-05 | Confused user | Get suggestions on what documents to bring | I prepare properly for the consultation |
| T-06 | Returning user | See my past triage conversations | I can reference what the AI recommended before |

### 3.2 Expert / Lawyer Benefits

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| T-07 | Legal expert | Receive pre-qualified leads | I don't waste time on wrong-specialty inquiries |
| T-08 | Lawyer | See AI triage summary before consultation | I know what to prepare and can hit the ground running |
| T-09 | Expert | Trust AI won't hallucinate or give legal advice | Platform stays legally compliant |


### 3.3 Admin Monitoring

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| T-10 | Platform admin | See triage accuracy metrics | I know if AI is matching users to correct specialties |
| T-11 | Admin | Flag poor-quality transcriptions | I can improve Whisper.cpp Kinyarwanda training data |
| T-12 | Compliance officer | Ensure AI never gives legal advice | Platform avoids unauthorized practice of law |

---

## 4. Technical Requirements

### 4.1 Whisper.cpp Integration

#### 4.1.1 Model Selection

**Model:** `whisper.cpp` Base model (74 MB)

**Why Base vs Tiny/Small/Medium/Large:**
- **Tiny (39 MB):** Too inaccurate for legal terms
- **Small (244 MB):** Better but still struggles with Kinyarwanda
- **Base (74 MB):** Best balance of accuracy + speed for CPU inference
- **Medium/Large (1.5 GB / 3 GB):** Overkill, too slow on CPU

**Performance Target:**
- 10 seconds of audio → transcribed in < 3 seconds on OCI CPU
- Word Error Rate (WER): < 15% for Kinyarwanda


#### 4.1.2 Docker Container Setup

```dockerfile
# Dockerfile.whisper
FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Clone and build whisper.cpp
WORKDIR /app
RUN git clone https://github.com/ggerganov/whisper.cpp.git
WORKDIR /app/whisper.cpp
RUN make

# Download Base model
RUN bash ./models/download-ggml-model.sh base

# API server
COPY server.py /app/
EXPOSE 8000
CMD ["python3", "/app/server.py"]
```

**Docker Compose Entry:**
```yaml
whisper:
  build:
    context: ./docker/whisper
    dockerfile: Dockerfile.whisper
  container_name: whisper-cpp
  restart: unless-stopped
  ports:
    - "8000:8000"
  volumes:
    - ./whisper-models:/app/models
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```


#### 4.1.3 API Endpoint Design

**Endpoint:** `POST /api/triage/transcribe`

**Request:**
```json
{
  "audio": "base64_encoded_audio_data",
  "format": "webm",
  "language": "rw"
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "text": "Mfite ikibazo cy'ubutaka. Umutugu wanjye aravuga ko umupaka uri hejuru y'igice cy'ubutaka bwanjye.",
    "language": "rw",
    "duration_seconds": 8.5,
    "confidence": 0.92
  }
}
```

**Error Handling:**
- Audio too short (< 1 second): Return `AUDIO_TOO_SHORT`
- Audio too long (> 60 seconds): Return `AUDIO_TOO_LONG`
- Unsupported format: Return `UNSUPPORTED_FORMAT`
- Transcription failed: Return `TRANSCRIPTION_ERROR` + retry with fallback model

---

### 4.2 Qwen 2.5 Integration (Ollama)

#### 4.2.1 Model Installation

```bash
# On OCI instance
docker exec -it ollama ollama pull qwen2.5:1.5b-instruct
```

**Model Specs:**
- **Size:** 1.1 GB (Q4 quantized)
- **Context Window:** 32,768 tokens
- **Memory Usage:** ~1.1 GB RAM during inference
- **Inference Speed:** ~50 tokens/sec on OCI CPU


#### 4.2.2 Prompt Engineering

**System Prompt (Multilingual):**
```typescript
const SYSTEM_PROMPT = `You are a legal intake specialist for Rwanda. Your role is to analyze a citizen's legal issue and extract structured information. You MUST:

1. Identify the legal specialty (PROPERTY_LAW, FAMILY_LAW, CRIMINAL_LAW, BUSINESS_LAW, LABOR_LAW, IMMIGRATION, etc.)
2. Determine jurisdiction (district in Rwanda)
3. Assess urgency (LOW, MEDIUM, HIGH, CRITICAL)
4. Estimate budget range in RWF
5. Identify key legal entities (contracts, deeds, court orders, etc.)
6. Suggest documents to bring

You MUST NOT:
- Give legal advice
- Predict case outcomes
- Recommend specific lawyers by name (system does matching)
- Make guarantees about success

Context: Rwanda uses civil law system. Common issues: land disputes (Article 14), family law (succession), labor disputes.

Return ONLY valid JSON with no additional text:
{
  "jurisdiction": "string (e.g., KIGALI_GASABO)",
  "specialty": "enum (PROPERTY_LAW, FAMILY_LAW, etc.)",
  "urgency_level": "enum (LOW, MEDIUM, HIGH, CRITICAL)",
  "budget_range_rwf": {"min": number, "max": number},
  "key_entities": ["string"],
  "suggested_documents": ["string"],
  "confidence_score": number (0-1)
}`;


const USER_PROMPT_TEMPLATE = (userMessage: string) => `
User issue description:
${userMessage}

Extract the information as JSON:`;
```

**Example Interaction:**

**Input (Kinyarwanda):**
> "Mfite ikibazo cy'ubutaka. Umutugu wanjye aravuga ko umupaka uri hejuru y'igice cy'ubutaka bwanjye. Mfite ibyangombwa by'ubutaka ariko nkeneye umwanditsi w'amategeko kugira ngo ansobanurire uburenganzira bwanjye."

**English Translation (for context):**
> "I have a land issue. My neighbor claims the boundary is above my land plot. I have title deeds but need a lawyer to explain my rights."

**Qwen 2.5 Output:**
```json
{
  "jurisdiction": "RWANDA_UNKNOWN",
  "specialty": "PROPERTY_LAW",
  "urgency_level": "MEDIUM",
  "budget_range_rwf": {"min": 50000, "max": 200000},
  "key_entities": ["land", "boundary dispute", "title deed", "neighbor conflict"],
  "suggested_documents": ["Title deed (Certificate foncier)", "Land survey report", "Photos of boundary markers"],
  "confidence_score": 0.89
}
```


#### 4.2.3 Mbaza NLP Corpus Integration

**Source:** https://github.com/Rwanda-NLP/mbaza-corpus  
**Content:** 20K+ Rwanda legal documents (laws, court decisions, legal terms)

**Usage Pattern:**
1. Pre-process Mbaza corpus into embeddings using Qwen 2.5
2. Store embeddings in PostgreSQL `pgvector`
3. On triage query, retrieve top 5 most relevant context chunks
4. Inject context into Qwen prompt

**Storage:**
```sql
CREATE TABLE legal_context_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document VARCHAR(255),
  text_chunk TEXT,
  embedding vector(768),  -- Qwen 2.5 embedding dimension
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_legal_context_embedding ON legal_context_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Query Pattern:**
```typescript
async function getRelevantContext(userQuery: string): Promise<string[]> {
  const queryEmbedding = await generateEmbedding(userQuery);
  
  const results = await prisma.$queryRaw`
    SELECT text_chunk
    FROM legal_context_embeddings
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;
  
  return results.map(r => r.text_chunk);
}
```


---

### 4.3 Database Schema

```sql
-- Triage sessions
CREATE TABLE triage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token VARCHAR(255) UNIQUE, -- For anonymous users
  language VARCHAR(10) DEFAULT 'rw',
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, ABANDONED
  extracted_data JSONB, -- Qwen output
  matched_experts UUID[], -- Array of expert IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Triage messages
CREATE TABLE triage_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES triage_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  audio_url VARCHAR(500), -- If voice message
  transcription TEXT, -- Whisper output
  metadata JSONB, -- Confidence scores, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert specialty embeddings
CREATE TABLE expert_specialty_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES legal_experts(id) ON DELETE CASCADE,
  specialty_text TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expert_specialty_embedding ON expert_specialty_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```


---

### 4.4 API Endpoints

#### POST /api/triage/sessions
Create new triage session

**Response:**
```json
{
  "sessionId": "uuid",
  "sessionToken": "anonymous-token",
  "initialMessage": "Hello! I'm here to help you find the right lawyer. What legal issue are you facing?"
}
```

#### POST /api/triage/sessions/:id/messages
Send message (text or audio)

**Request:**
```json
{
  "type": "text | audio",
  "content": "text message",
  "audio": "base64_audio" // if type=audio
}
```

**Response:**
```json
{
  "messageId": "uuid",
  "transcription": "text if audio",
  "assistantReply": "I understand you have a land dispute. Let me ask a few questions...",
  "extractedData": { /* JSON if extraction complete */ },
  "matchedExperts": [ /* array if matches found */ ]
}
```

#### GET /api/triage/sessions/:id
Get session history

#### GET /api/triage/sessions/:id/matches
Get expert recommendations

---

## 5. Implementation Roadmap

**Week 1-2: Infrastructure**
- [ ] Set up Ollama container on OCI
- [ ] Pull Qwen 2.5 model
- [ ] Set up Whisper.cpp container
- [ ] Install pgvector extension
- [ ] Create database tables

**Week 3: Core AI Logic**
- [ ] Build transcription service
- [ ] Build Qwen inference service
- [ ] Implement prompt engineering
- [ ] Load Mbaza corpus embeddings

**Week 4: Matching Algorithm**
- [ ] Generate expert specialty embeddings
- [ ] Build vector similarity search
- [ ] Implement ranking algorithm
- [ ] Add availability filtering

**Week 5: API & Integration**
- [ ] Build triage API endpoints
- [ ] Connect frontend to real backend
- [ ] Replace mock data with live AI
- [ ] Add error handling & retries

**Week 6: Testing & Polish**
- [ ] Load testing (100 concurrent triages)
- [ ] Accuracy testing (manual review)
- [ ] Kinyarwanda speech recognition QA
- [ ] Launch to beta users

---

## 6. Success Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Transcription accuracy (WER) | < 15% | Manual review of 100 samples |
| Intent extraction accuracy | > 85% | Compare AI output to human expert label |
| Expert match relevance | > 80% users book recommended expert | Booking conversion tracking |
| Response time | < 5 seconds end-to-end | API performance monitoring |
| Abandonment rate | < 20% | Sessions without booking |
| User satisfaction | > 4.2/5 stars | Post-triage survey |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucination (bad advice) | Critical | Strict prompt: "NO legal advice, only routing" + human QA review |
| Poor Kinyarwanda transcription | High | Fine-tune Whisper on Rwanda voice data |
| Qwen model too slow | Medium | Use Q4 quantization + GPU if needed |
| Wrong specialty matching | High | Hybrid: AI + rule-based fallback |
| Privacy concerns | High | Encrypt all triage data, clear retention policy |

---

## 8. Out of Scope (v2.0 Agentic AI Features)

The following features are **NOT part of Phase 3 AI Triage** but planned for v2.0:

| Feature | Why Not Now | When |
|---------|-------------|------|
| AI generates legal documents | Requires fine-tuning on Rwanda legal templates | v2.0 (Q4) |
| AI translates lawyer bios | Need larger model (Qwen 7B or GPT-4) | v2.0 (Q4) |
| Real-time video transcription | Needs streaming Whisper integration | v2.0 (Q4) |
| AI gives legal advice | Liability risk, requires human review | Never (by design) |
| AI predicts case outcomes | Unauthorized practice of law | Never (by design) |

**v1.0 AI Triage Scope (Phase 3):**
- ✅ Voice/text intake in Kinyarwanda, English, French
- ✅ Intent extraction (specialty, urgency, budget)
- ✅ Expert matching via vector similarity
- ✅ Document suggestions (what to bring)
- ✅ Conversational clarification questions
- ❌ NO document generation
- ❌ NO legal advice
- ❌ NO real-time translation

---

## 9. Relationship to Other Features

| Feature | Dependency | Integration Point |
|---------|------------|-------------------|
| Multilingual i18n (Phase 3.20) | Parallel | AI responses in user's language |
| Expert Discovery (Existing) | Backend | Vector search queries expert profiles |
| Booking Engine (Existing) | Frontend | "Book Now" CTA after triage matches |
| WhatsApp Integration (Phase 1) | Optional | Voice messages → Whisper → triage |
| Document Vault (Existing) | Future | Attach triage summary to case file |

---

*Read alongside: MyJudicial_Master_Build_Reference.md, 20_Multilingual_i18n_System.md*
