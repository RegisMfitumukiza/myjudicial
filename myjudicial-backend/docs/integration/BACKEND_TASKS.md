# Backend Tasks

## Purpose

This document tracks all remaining backend work required to complete the MyJudicial platform.

It is the operational task list for backend development.

Completed work should be reflected in `FEATURE_STATUS.md`, not here.

Project planning belongs in `IMPLEMENTATION_ROADMAP.md`.

---

# Task Status Legend

| Status | Meaning |
|----------|----------|
| ⬜ Not Started | Task has not begun |
| 🟡 In Progress | Currently being implemented |
| ⏸ Blocked | Waiting on dependency |
| ✅ Complete | Task finished (remove during next cleanup) |

---

# Current Backend Tasks

## Review & Rating System

Status: ✅ Complete

Tasks

- Create Review module
- Create Rating module
- Review repository
- Review service
- Review controller
- Review routes
- Validation schemas
- Business rules
- Average rating calculation
- Expert rating updates
- Booking verification
- Prevent duplicate reviews
- Swagger documentation
- OpenAPI update

---

## In-App Notifications

Status: ✅ Complete

Tasks

- Extend existing `NotificationLog` table with `isRead`/`readAt` (manual migration —
  see `prisma/migrations/manual_add_notification_read_state.sql`)
- Notification repository (list/count-unread/mark-read/mark-all-read)
- Notification service (ownership checks)
- Notification controller
- Notification routes (`GET /notifications`, `GET /notifications/unread-count`,
  `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`)
- Validation schemas
- Swagger documentation
- Instrument real events: booking confirmed (payment success), booking cancelled,
  booking confirmed (`BOOKING_CONFIRMED`), refund processed (`REFUND_PROCESSED`)
- Follow-up: instrument remaining events (escrow released, review received, credential
  expiry warning) when those flows are next touched

---

## Booking & Payments Hardening

Status: ✅ Complete

Tasks

- Fixed payment webhook unable to match bookings: `paymentReferenceId` is now persisted
  at booking creation, not only after confirmation
- Reconciled two divergent booking-confirmation code paths (webhook-driven
  `EscrowService.lockFunds` vs. manual `POST /bookings/:id/confirm`) into one; the manual
  endpoint is now an admin-only override that delegates to the same escrow-locking logic
- Fixed `GET /bookings/expert/:id/slots` to size slots by the actual service's
  `durationMin` (was hardcoded to 30 minutes) and to use consistent UTC arithmetic
- Removed a duplicate OpenAPI path registration for `POST /bookings/:id/join`
- Added HMAC-SHA256 signature verification (`x-azampay-signature` /
  `AZAMPAY_WEBHOOK_SECRET`) to `POST /payments/webhook` and `/payments/payout-webhook` —
  previously unauthenticated (see `ARCHITECTURE_DECISIONS.md` Decision 23 for the
  known limitation and follow-up)
- Fixed `GET /payments/callback` to resolve the real `Booking.paymentStatus` and redirect
  to `/bookings/success|failed`, instead of unconditionally redirecting to the dashboard
- Renamed `Payment.flwTransactionId`/`flwPayoutRef` → `providerTransactionId`/
  `providerPayoutRef`; fully removed the `flutterwave-node-v3` dependency and all
  Flutterwave-era wording/docs (payment provider is Azam Pay)
- Fixed `Booking.notes` — renamed to `citizenNotes` to match what was already documented
  and consumed by the frontend; the field was silently never returned under the name the
  API contract promised
- Added the `payment` relation to `BookingRepository.list()` — previously always absent,
  so admin/citizen booking lists could never show the actual charged amount, only the
  service's current flat fee
- Registered the existing admin booking routes (list/stats/complete/refund) in OpenAPI —
  they existed in code but were undocumented and thus unreachable from the generated
  frontend client
- Added `paymentMNO`/`paymentPhoneNumber` to the documented `CreateBookingDto` — the real
  Zod schema and service already accepted them, but OpenAPI never documented them, forcing
  the frontend booking modal to bypass its generated types with `as any`

---

## Default Consultation Service (fixes "No services available")

Status: ✅ Complete

Tasks

- Root cause: the onboarding wizard only ever wrote `ExpertProfile.baseConsultationFee`;
  the actual bookable `LegalService` list lived behind a separate, optional dashboard page
  nothing in onboarding pointed to. Verified experts could have zero bookable services.
- Added `isDefault` boolean column to `LegalService` (`prisma db push`)
- `ProfileService.createProfile` now auto-creates a default "Consultation" service
  (60 min, priced from the onboarding rate) via
  `ServicesService.ensureDefaultConsultationService` — idempotent
- Documented `isDefault` on the `LegalService` OpenAPI schema; regenerated spec + Orval client
- One-time backfill (`prisma/backfill-default-services.ts`, safe to re-run) applied the
  default service retroactively to the 2 expert profiles that already existed with zero
  services, using their existing `baseConsultationFee`
- See `ARCHITECTURE_DECISIONS.md` Decision 24 for rationale and alternatives considered
- Follow-up: `ServicesService.delete()` now blocks deleting the default service (`isDefault: true`)
  with a `409`, so it can only be deactivated — closes the gap where deleting it would silently
  reopen the same "no services available" bug. Frontend hides the delete button for it (shows a
  lock icon) instead of letting the request fail.
- Further follow-up: the default service can no longer be deactivated either (`ServicesService.update()`
  now also blocks `isActive: false` for it with a `409`) — it's a permanent, always-active fallback.
  The only thing that can make a client's requested time unbookable is the expert's weekly
  Availability schedule, not the service's own active flag. Added a matching server-side guard
  (`assertWithinAvailability` in `booking.service.ts`) to `POST /bookings` so a request built
  directly against the API — bypassing the slot picker — is rejected with a clear
  "The expert is not available at the selected time" error instead of silently succeeding.
  Verified both guards directly against the real database.

---

## Real Azam Pay Integration (Citizen Checkout)

Status: 🟡 In Progress — code complete, blocked on valid credentials

Tasks

- `AzamPayService.authenticate()` / `initializeMnoPayment()` now make real HTTP calls to Azam
  Pay's confirmed sandbox/production hosts instead of simulating success (`AZAMPAY_ENV` toggles
  environment). Both throw on failure instead of returning a fake `PENDING` result.
- Added `Mpesa` as a citizen-facing payment network option; corrected `AzamPesa` → `Azampesa`
  to match Azam Pay's real provider enum casing
- `sendExpertPayout`/`initiateRefund` remain simulated — their real endpoints aren't confirmed
  and shouldn't be guessed at since they move money out
- Blocked: the credentials currently in `.env` are rejected by Azam Pay on both sandbox and
  production (`423` — "invalid or expired"). Needs confirmation from Azam Pay directly before
  a real payment can be processed. See `ARCHITECTURE_DECISIONS.md` Decision 25.

---

## PocketBase Real-time Chat

Status: ⬜

Tasks

- PocketBase integration
- Conversation management
- Message persistence
- Read receipts
- Typing indicators
- Attachments
- Authentication
- Authorization
- Swagger documentation
- OpenAPI update

---

## WhatsApp Cloud API

Status: ⬜

Tasks

- Meta Cloud API integration
- OTP notifications
- Booking notifications
- Payment notifications
- Reminder notifications
- Webhook verification
- Retry handling
- Logging
- OpenAPI update

---

## Admin Analytics Dashboard

Status: ⬜

Tasks

- Analytics service
- Revenue metrics
- Booking metrics
- User metrics
- Expert metrics
- Dashboard endpoints
- Charts API
- Swagger documentation

---

## PDF Escrow Receipts

Status: ⬜

Tasks

- PDF generation
- Receipt templates
- Storage
- Download endpoint
- Email integration

---

## Retry Queue (BullMQ)

Status: ⬜

Tasks

- Queue setup
- Retry strategy
- Failed jobs
- Monitoring
- Dashboard

---

## Malware Scanning

Status: ⬜

Tasks

- File scanning
- Quarantine
- Scan reports
- Upload middleware

---

## Annual Re-verification

Status: ⬜

Tasks

- Scheduler
- Notification
- Expert status updates
- Compliance workflow

---

## AI Triage Agent

Status: ⬜

Tasks

- AI workflow
- Prompt pipeline
- Conversation engine
- Risk assessment
- Recommendation engine

---

## Whisper.cpp Integration

Status: ⬜

Tasks

- Speech transcription
- Audio upload
- Processing pipeline

---

## Ollama + Qwen Integration

Status: ⬜

Tasks

- Local AI service
- Prompt orchestration
- Streaming responses

---

## Expert Recommendation Engine

Status: ⬜

Tasks

- Recommendation algorithm
- Ranking
- Similarity scoring

---

## Vector Search

Status: ⬜

Tasks

- Embeddings
- Vector database
- Semantic search

---

# Technical Improvements

Status: ⬜

- Repository interfaces
- Transaction manager
- Split oversized services
- Docker Compose
- Unit tests
- Integration tests
- Email template refactor

---

# Maintenance

Remove completed tasks periodically.

Do not use this document to track frontend work.

---

# Related Documents

- FEATURE_STATUS.md
- IMPLEMENTATION_ROADMAP.md
- FRONTEND_TASKS.md
- FRONTEND_BACKEND_SYNC.md

---

# Guiding Principle

> BACKEND_TASKS.md tracks remaining backend implementation work. Once a task is completed, update FEATURE_STATUS.md and remove or archive the completed task during project maintenance.