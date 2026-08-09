# Vector Search

> **⚠️ IMPORTANT:** This is NOT a separate feature!  
> **Vector Search** is a **technology component** built into the **AI Triage System**.

---

## What Is It?

**Vector Search** is the semantic matching technology that finds experts with similar specialties to the user's legal issue, even when different words are used.

### Traditional Keyword Search:
```
User: "land dispute"
❌ Misses: "boundary conflict" (different words)
❌ Misses: "property disagreement" (no exact match)
```

### Vector Search:
```
User: "land dispute"
✅ Finds: "boundary conflict" (similar meaning)
✅ Finds: "property disagreement" (semantic similarity)
✅ Finds: "title deed issue" (related concept)
```

## Technology Stack

- **PostgreSQL pgvector extension** (vector similarity search)
- **Qwen 2.5 embeddings** (converts text to 768-dimensional vectors)
- **Cosine similarity** (measures how "close" two vectors are)

## Where Is It Implemented?

This technology is documented and implemented as **Step 3** of the AI Triage System.

👉 **See full documentation:** `21_AI_Triage_System.md`

---

## Quick Summary

**How It Works:**

1. **Convert user issue to vector:**
   ```
   "Mfite ikibazo cy'ubutaka" → [0.23, 0.87, -0.45, 0.12, ...] (768 numbers)
   ```

2. **Search expert embeddings:**
   ```sql
   SELECT expert_id, 
     1 - (embedding <=> user_vector) AS similarity_score
   FROM expert_specialty_embeddings
   ORDER BY similarity_score DESC
   LIMIT 50;
   ```

3. **Return top 50 similar experts:**
   - Expert A: 0.94 similarity (property law, land disputes)
   - Expert B: 0.91 similarity (real estate, title deeds)
   - Expert C: 0.88 similarity (civil litigation, property rights)

---

## Implementation Location

| File | Section |
|------|---------|
| `21_AI_Triage_System.md` | Section 2.1 - System Flow (Step 3) |
| `21_AI_Triage_System.md` | Section 4.3 - Database Schema (expert_specialty_embeddings table) |
| `21_AI_Triage_System.md` | Section 4.4 - API Endpoints |

---

## Database Schema

```sql
CREATE TABLE expert_specialty_embeddings (
  id UUID PRIMARY KEY,
  expert_id UUID REFERENCES legal_experts(id),
  specialty_text TEXT,
  embedding vector(768),  -- Qwen 2.5 embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expert_embedding ON expert_specialty_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

*For complete technical specifications, see `21_AI_Triage_System.md`*