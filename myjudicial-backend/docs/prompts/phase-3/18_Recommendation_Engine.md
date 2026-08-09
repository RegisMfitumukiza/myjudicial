# Recommendation Engine

> **⚠️ IMPORTANT:** This is NOT a separate feature!  
> **Recommendation Engine** is a **technology component** built into the **AI Triage System**.

---

## What Is It?

The **Recommendation Engine** is the algorithm that re-ranks expert matches based on multiple factors:
- Vector similarity score (from vector search)
- Availability (next 7 days)
- Rating (4.5+ stars)
- Language compatibility
- Price range match

## Where Is It Implemented?

This technology is documented and implemented as **Step 4** of the AI Triage System.

👉 **See full documentation:** `21_AI_Triage_System.md`

---

## Quick Summary

**Without Recommendation Engine:**
```
AI Triage finds 50 similar lawyers
→ Shows top 3 by specialty match only
→ User books lawyer who is unavailable until next month ❌
```

**With Recommendation Engine:**
```
AI Triage finds 50 similar lawyers
→ Re-ranks by: specialty + availability + rating + language + price
→ Shows top 3 best-fit lawyers available this week ✅
```

---

## Implementation Location

| File | Section |
|------|---------|
| `21_AI_Triage_System.md` | Section 2.1 - System Flow (Step 4) |
| `21_AI_Triage_System.md` | Section 4.3 - Database Schema |
| `21_AI_Triage_System.md` | Section 4.4 - API Endpoints |

---

*For complete technical specifications, see `21_AI_Triage_System.md`*