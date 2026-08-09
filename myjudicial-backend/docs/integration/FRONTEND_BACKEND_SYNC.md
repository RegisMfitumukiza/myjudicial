# Frontend-Backend Synchronization

## Purpose

This document tracks the integration status between the backend and frontend for every feature in the MyJudicial platform.

It serves as the coordination point between backend and frontend development teams.

This document answers one question:

> **"Can the frontend successfully integrate with the backend for this feature?"**

It does **not** track implementation progress. Those belong in:

- `FEATURE_STATUS.md`
- `BACKEND_TASKS.md`
- `FRONTEND_TASKS.md`

---

# Synchronization Lifecycle

Every feature follows the same synchronization process.

```text
Backend Feature Complete
          │
          ▼
OpenAPI Updated
          │
          ▼
Frontend API Client Generated
          │
          ▼
Frontend Integration
          │
          ▼
End-to-End Testing
          │
          ▼
Synchronization Complete
```

---

# Synchronization Status Legend

| Status | Meaning |
|----------|----------|
| ⬜ Not Ready | Backend is not ready for frontend integration |
| 🟡 Ready for Frontend | Backend completed and API contract available |
| 🔵 Integration In Progress | Frontend currently integrating |
| 🟣 Awaiting Testing | Integration complete, awaiting verification |
| 🚀 Fully Synchronized | Backend and frontend successfully integrated |

---

# Integration Dashboard

| Feature | Backend | OpenAPI | Frontend Client | Frontend Integration | E2E Testing | Sync Status |
|----------|----------|----------|-----------------|----------------------|-------------|-------------|
| Authentication | ✅ | ✅ | ✅ | ✅ | ✅ | 🚀 |
| User Management (settings: preferred language) | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Expert Profiles | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Expert Services (auto-created default "Consultation" service at profile creation, backfilled for pre-existing profiles) | ✅ | ✅ | ✅ | ✅ | ⬜ | 🔵 |
| Expert Dashboard (home) | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Expert Availability | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Expert Education | ✅ | ✅ | ✅ | ✅ | ⬜ | 🔵 |
| Expert Certifications | ✅ | ✅ | ✅ | ✅ | ⬜ | 🔵 |
| Expert Earnings | ✅ | ✅ | ✅ | ✅ | ⬜ | 🔵 |
| Expert Statistics | ✅ | ✅ | ✅ | ✅ | ⬜ | 🔵 |
| Expert Documents (list/download/delete) | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Compliance & Verification | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Map Search | ✅ | ✅ | ⬜ | ⬜ | ⬜ | 🟡 |
| Bookings (client + expert dashboards: create/list/detail/cancel/review/video join, admin list/stats/complete/refund) | ✅ | ✅ | ✅ | ✅ (expert-side video join now renders a real LiveKit room; previously issued a token and showed a toast) | ⬜ | 🟣 |
| Client Dashboard (home/documents/payments/settings/messages) | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Payments & Escrow (Azam Pay Mobile Money) | ✅ (webhook now HMAC-signature-verified; callback resolves real Booking.paymentStatus instead of ignoring query params) | ✅ | ✅ | ✅ (payment history view only; checkout itself is a USSD prompt on the citizen's phone, not an in-app UI) | ⬜ | 🟣 |
| In-App Notifications (feed, unread count, mark read) | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| Review & Rating System | ✅ | ✅ | ✅ | ✅ (submission form only — public display of reviews on expert profiles not built) | ⬜ | 🟣 |
| Chat / Messaging (REST, conversations + messages) | ✅ | ✅ | ✅ | ✅ | ⬜ | 🟣 |
| PocketBase Real-time Chat | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| WhatsApp Cloud API | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Admin Analytics Dashboard | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| PDF Escrow Receipts | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Retry Queue (BullMQ) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Malware Scanning | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Annual Re-verification | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| AI Triage Agent | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Whisper.cpp Integration | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Ollama + Qwen Integration | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Expert Recommendation Engine | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Vector Search | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Booking Disputes | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Push Notifications | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Calendar Sync | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

# Integration Readiness Checklist

A feature is considered **Ready for Frontend Integration** only if all of the following are complete:

- Backend implementation completed.
- API endpoint finalized.
- Request validation implemented.
- Response schema finalized.
- Swagger documentation updated.
- OpenAPI specification generated.
- Authentication requirements documented.
- Authorization requirements documented.
- Error responses documented.
- Example requests and responses included.

---

# Frontend Integration Checklist

Before frontend integration begins:

- Generate the latest API client using Orval.
- Replace any mock API implementations.
- Use generated request and response types.
- Do not create duplicate API models.
- Validate authentication flows.
- Handle loading, success, and error states.
- Verify API responses match the contract.

---

# End-to-End Verification

Before marking a feature as synchronized:

- Backend API tested.
- Frontend integration tested.
- Authentication verified.
- Authorization verified.
- Validation errors handled.
- Success responses handled.
- Error responses handled.
- End-to-end user workflow verified.

---

# Synchronization Rules

Always:

- Use the latest generated API client.
- Regenerate the client after every OpenAPI update.
- Treat the backend as the source of truth.
- Keep frontend types synchronized with the backend.
- Verify API compatibility before merging.

Never:

- Duplicate backend models.
- Manually maintain API request interfaces.
- Modify generated client code.
- Integrate against undocumented endpoints.
- Skip OpenAPI regeneration after API changes.

---

# Maintenance

Update this document whenever:

- A backend feature becomes ready for integration.
- The OpenAPI specification changes.
- The frontend completes integration.
- End-to-end testing completes.
- A synchronization issue is discovered or resolved.

---

# Related Documents

## Project Status

- FEATURE_STATUS.md

## Task Tracking

- BACKEND_TASKS.md
- FRONTEND_TASKS.md

## API

- API_CONTRACTS.md
- OPENAPI_WORKFLOW.md

## Standards

- BACKEND_GUIDELINES.md
- FRONTEND_GUIDELINES.md

## Checklists

- INTEGRATION_CHECKLIST.md
- TESTING_CHECKLIST.md
- RELEASE_CHECKLIST.md

---

# Guiding Principle

> **A feature is not considered complete until the backend, OpenAPI specification, generated frontend client, frontend implementation, and end-to-end testing are fully synchronized.**