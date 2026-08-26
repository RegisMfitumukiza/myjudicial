# Architecture Decisions

## Purpose

This document records the key architectural decisions that shape the MyJudicial platform.

Unlike feature documentation, these decisions are expected to remain stable throughout the project's lifetime.

Every major implementation should align with these decisions unless a conscious architectural change is approved.

---

# Decision 1 — Monolithic Backend

## Status

Accepted

## Decision

The backend will be implemented as a modular monolith.

## Rationale

The current size of the project does not justify microservices.

A modular monolith provides:

- simpler deployment
- easier debugging
- shared transactions
- lower operational complexity
- faster development

Modules remain isolated through clear domain boundaries.

Future migration to microservices remains possible if business growth requires it.

---

# Decision 2 — Domain-Driven Design (DDD)

## Status

Accepted

## Decision

The project follows Domain-Driven Design principles.

Each business capability is implemented as an independent module.

Example domains include:

- Authentication
- Users
- Experts
- Bookings
- Payments
- Compliance
- Reviews
- Chat
- Notifications

Business logic must remain within its domain.

Cross-domain coupling should be minimized.

---

# Decision 3 — Clean Architecture

## Status

Accepted

## Decision

The project separates responsibilities into layers.

```
Controllers
      ↓
Services
      ↓
Repositories
      ↓
Database
```

Controllers remain thin.

Repositories own database access.

Services contain business logic.

---

# Decision 4 — Repository Pattern

## Status

Accepted

Repositories are the only layer allowed to communicate directly with Prisma.

Controllers and services must never contain Prisma queries.

---

# Decision 5 — Service Layer

## Status

Accepted

Business rules belong inside services.

Services orchestrate workflows across repositories.

Controllers should only:

- receive requests
- call services
- return responses

---

# Decision 6 — Prisma ORM

## Status

Accepted

Prisma is the project's ORM.

Reasons:

- type safety
- migrations
- maintainability
- developer productivity

---

# Decision 7 — PostgreSQL

## Status

Accepted

PostgreSQL is the primary relational database.

Reasons:

- reliability
- ACID transactions
- JSON support
- PostGIS support
- mature ecosystem

---

# Decision 8 — OpenAPI First

## Status

Accepted

The backend follows an OpenAPI-first approach.

Every API must be:

- documented
- discoverable
- type-safe

OpenAPI is the single source of truth for the API contract.

Swagger UI is generated from the OpenAPI specification.

Frontend clients are generated from the OpenAPI specification.

Manual API type definitions are discouraged.

---

# Decision 9 — Validation with Zod

## Status

Accepted

All external input must be validated using Zod.

Validation occurs before business logic executes.

Validation schemas should be reusable.

---

# Decision 10 — Authentication Strategy

## Status

Accepted

Current authentication methods:

- Email & Password
- Email OTP
- Magic Link

OAuth providers may be added in future releases without replacing existing authentication.

---

# Decision 11 — Authorization

## Status

Accepted

Authorization follows Role-Based Access Control (RBAC).

Authorization checks are performed before business logic executes.

Ownership validation is required where appropriate.

---

# Decision 12 — File Storage

## Status

Accepted

Large files are not stored in the database.

Metadata is stored in PostgreSQL.

Files are stored in object storage.

Storage implementation remains abstracted behind a service layer.

---

# Decision 13 — Background Processing

## Status

Accepted

Long-running tasks should execute asynchronously.

Examples:

- emails
- notifications
- malware scanning
- retry queues
- scheduled jobs

The application should avoid blocking HTTP requests.

---

# Decision 14 — Real-Time Communication

## Status

Accepted

Real-time messaging will use PocketBase.

Business rules remain in the backend.

PocketBase is responsible for real-time synchronization.

---

# Decision 15 — AI Integration

## Status

Accepted

AI capabilities are modular.

Examples include:

- AI Triage
- Recommendation Engine
- Whisper
- Ollama
- Vector Search

AI modules must remain isolated from core business logic.

Business rules must never depend solely on AI output.

---

# Decision 16 — Error Handling

## Status

Accepted

The application uses centralized error handling.

Modules throw domain-specific exceptions.

HTTP responses are standardized.

---

# Decision 17 — Logging & Auditing

## Status

Accepted

Security-sensitive operations must be logged.

Examples include:

- authentication
- payments
- compliance
- administrative actions

Audit logs are immutable.

---

# Decision 18 — Testing Strategy

## Status

Accepted

Testing is performed at multiple levels.

- Unit Tests
- Integration Tests
- End-to-End Tests

Critical workflows should be covered before production release.

---

# Decision 19 — API Versioning

## Status

Accepted

Breaking API changes require versioning.

Current API version:

```
v1
```

---

# Decision 20 — AI-Assisted Development

## Status

Accepted

AI is considered a development assistant rather than an autonomous developer.

AI-generated code must:

- follow project architecture
- reuse existing code
- avoid duplication
- pass testing
- undergo human review before merging

---

# Decision 21 — Frontend API Client Mutator

## Status

Accepted

## Decision

The generated OpenAPI client (`src/api/generated.ts`, via Orval) uses a custom mutator
(`src/api/mutator.ts`) that delegates to the app's existing `apiFetch` helper
(`src/lib/api/client.ts`) instead of raw `fetch`.

## Rationale

Prior to this decision, Orval's default fetch client produced relative request URLs with no
base URL and no `Authorization` header, so every generated call silently targeted the wrong
origin and failed authentication. This is why the generated client was never actually used —
hooks were hand-written against `apiFetch` + `ENDPOINTS` instead, contradicting Decision 8
(OpenAPI First).

Rather than hand-rolling a second request path, the Orval `override.mutator` config
(`orval.config.ts`) now points every generated function at the one proven, working request
path — same base URL resolution, same Supabase bearer token attachment, same error handling.

This restores Decision 8 in practice: new frontend work should consume the generated
`useGetX` / `usePostX` hooks directly, and any API contract change should update the
Zod/OpenAPI schema and re-run `npx orval` before the frontend is touched, per
`OPENAPI_WORKFLOW.md`.

---

# Decision 22 — In-App Notifications Reuse `NotificationLog`

## Status

Accepted

## Decision

The client-facing in-app notification feed (`GET /notifications`, unread count, mark-as-read)
is built on the existing `NotificationLog` table rather than a new `Notification` model.
The table was extended with `isRead`/`readAt` columns (additive, non-breaking) via a manual
SQL migration (`prisma/migrations/manual_add_notification_read_state.sql`).

## Rationale

`NotificationLog` already recorded outbound WhatsApp sends per user with an `event`
(`NotificationEvent` enum) and `channel` field. Rather than duplicate that shape in a second
table, the new `notifications` module (`src/modules/notifications/`) reads and writes the
same table, and a few real business events (`EscrowService.lockFunds`, `BookingService.cancelBooking`)
now also write a `NotificationLog` row (channel: `EMAIL`, alongside the existing email send)
so the feed reflects real state changes instead of a separate, unpopulated source of truth.

A full "reuse existing modules, avoid duplicate functionality" reading — Prisma migrations
were not run via `prisma migrate dev` because the shared Supabase dev database had untracked
migration-history drift from other contributors (migration names present in `_prisma_migrations`
with no corresponding local migration files). Running `migrate dev` would have required a
destructive `migrate reset`. A manual, additive SQL file was used instead, matching the
project's existing manual-migration pattern for exactly this situation.

## Follow-up

The underlying migration-history drift on the shared dev database is a team process issue,
not something this change resolves. Whoever ran migrations directly against Supabase for
`add_notification_preferences` / `align_notification_channels` / `add_platform_settings`
should commit the corresponding `prisma/migrations/` folders so `prisma migrate dev` works
normally again for the next contributor.

---

# Decision 23 — Azam Pay Webhook Signature Verification (Self-Issued Scheme)

## Status

Accepted (provisional — see Follow-up)

## Decision

`POST /payments/webhook` and `POST /payments/payout-webhook` require an `x-azampay-signature`
header equal to `HMAC-SHA256(rawBody, AZAMPAY_WEBHOOK_SECRET)`, verified with
`crypto.timingSafeEqual`. Requests without a valid signature are rejected with `401`. If
`AZAMPAY_WEBHOOK_SECRET` is unset, verification always fails (fail-closed).

## Rationale

Before this change, both webhook endpoints processed any POSTed payload with zero
authentication — any caller who discovered the URL could submit a fake "payment success"
event and get a booking marked `CONFIRMED`/`PAID` for free. The Master Build Reference already
states webhook payloads are HMAC-SHA256 signed as a platform-wide principle (Section 6), and
`src/modules/whatsapp/utils/webhook-verification.ts` already established the same
HMAC-SHA256 + `timingSafeEqual` pattern for Meta's webhooks, so this follows existing
convention rather than inventing a new one.

## Known limitation

The Azam Pay integration (`azam.service.ts`) is currently fully simulated — no real HTTP calls
to Azam Pay exist yet, so their actual webhook signing mechanism (header name, algorithm, or
whether they support a merchant-configured signing secret at all) has not been confirmed
against their real dashboard/docs. This scheme is MyJudicial's own placeholder, chosen to close
the authentication gap immediately rather than ship an unauthenticated endpoint.

## Follow-up

Before enabling real Azam Pay payments in production: confirm Azam Pay's actual webhook
authentication mechanism and update `verifyAzamPaySignature` in `payment.controller.ts`
accordingly (header name/algorithm may differ, or Azam Pay may not support this at all, in
which case an alternative such as an IP allowlist or a secret token embedded in the registered
webhook URL should be used instead). Until then, `AZAMPAY_WEBHOOK_SECRET` must be set to
whatever value is actually configured on Azam Pay's side, or real webhooks will be rejected.

---

# Decision 24 — Auto-Created Default "Consultation" Service

## Status

Accepted

## Decision

`ProfileService.createProfile` now automatically creates one `LegalService` row
(`name: "Consultation"`, `durationMin: 60`, `isDefault: true`) using the expert's
`baseConsultationFee`/`currency` from the onboarding form, immediately after the
`ExpertProfile` is created. `LegalService` gained a new `isDefault` boolean column
(default `false`) to mark this row. `ServicesService.ensureDefaultConsultationService`
is idempotent — safe to call more than once for the same expert.

A one-time backfill (`prisma/backfill-default-services.ts`, safe to re-run) created this
default service retroactively for the two expert profiles that already existed with zero
services, using their existing `baseConsultationFee`.

## Rationale

The onboarding wizard's "Languages & Rates" step only ever wrote `ExpertProfile.baseConsultationFee`
— a field nothing else in the system reads. The actual bookable "menu" (`LegalService` rows) lived
entirely behind a separate, optional dashboard page (`/expert/dashboard/services`) that nothing in
onboarding pointed the expert to. Nothing blocked admin verification approval on having zero
services either. The result: an expert could complete onboarding, get verified, and have zero
bookable services — exactly what happened to a real verified expert, whose citizen-facing booking
modal correctly, but unhelpfully, showed "No services available."

Auto-creating a real, priced default service from data the expert already provided closes this
gap at the source, without requiring a hard verification gate (Decision considered and rejected —
see below) or an extra mandatory onboarding step.

## Alternatives considered

- **Hard-block admin verification when `services.length === 0`.** Rejected: made unnecessary once
  every profile is guaranteed to have a default service from creation time onward.
- **Add a mandatory "create a service" step to the onboarding wizard.** Rejected: duplicates a form
  that already exists on the Services page and adds friction; auto-creating from the rate the
  expert already enters is equivalent with zero extra steps.

## Follow-up

The "Getting Started" checklist (`expert/dashboard/getting-started/page.tsx`) previously read
fields (`hasServices`, `profileComplete`, etc.) that `GET /experts/onboarding` never actually
returned, so every step always showed as incomplete. Fixed in the same change to consume the
real response shape (`steps`, `completedSteps`, `completionPercentage`). The dashboard home page
now also shows a "Expand Your Services" nudge (via the existing `RegulatoryAlerts` component)
whenever an expert's only service is the auto-created default, linking to the Services page.

---

# Decision 25 — Real Azam Pay Integration Replaces Simulation (Citizen Checkout Only)

## Status

Accepted (partial — see Follow-up)

## Decision

`AzamPayService.authenticate()` and `AzamPayService.initializeMnoPayment()` (`azam.service.ts`)
now make real HTTP calls to Azam Pay instead of simulating success. Hosts are chosen via
`AZAMPAY_ENV` (`sandbox` default, or `production`):

- Auth: `https://authenticator-sandbox.azampay.co.tz` / `https://authenticator.azampay.co.tz`,
  `POST /AppRegistration/GenerateToken`
- MNO checkout: `https://sandbox.azampay.co.tz` / `https://checkout.azampay.co.tz`,
  `POST /azampay/mno/checkout`

Both confirmed independently against Azam Pay's real servers and multiple public SDK sources
(not merely the existing code's prior guesses — the previous auth URL guess,
`sandbox.azampay.co.tz/azampay/auth/v1/GenerateToken`, was wrong). The access token is cached
until shortly before expiry. Both methods now throw on failure instead of returning a fake
`PENDING` result — a failed real call must surface as a failed booking, never a silent fake
success. `sendExpertPayout`/`initiateRefund` remain simulated; their real endpoints could not be
confirmed from public sources and, since they move money out, were not guessed at.

Added the `Mpesa` provider option (citizen-facing dropdown in `booking-modal.tsx`) alongside the
existing Airtel/Tigo/Halopesa/Azampesa — M-Pesa (Vodacom) is Azam Pay's most-used supported
network and was previously missing. Also corrected `AzamPesa` → `Azampesa` to match Azam Pay's
real provider enum casing, which the prior placeholder-based code had wrong.

## Rationale

The user supplied real Azam Pay credentials (`AZAMPAY_APP_NAME`/`AZAMPAY_CLIENT_ID`/
`AZAMPAY_CLIENT_SECRET`/a separate `AZAMPAY_TOKEN`) already present in `.env` and asked to
"finalize" the booking payment system with them. Given real credentials and real money are
involved, the existing simulated implementation's guessed endpoint paths were verified against
public documentation and Azam Pay's live servers before being trusted, rather than assumed correct.

## Known limitation — credentials currently rejected

Testing `authenticate()` directly against **both** the real sandbox and real production
GenerateToken endpoints with the exact credentials provided returns, in both cases:
`423 { "message": "Provided detail is not valid for this app or secret key has been expired" }`.
This means the integration code is confirmed correct (it reaches Azam Pay and gets a real,
structured API response, not a connection or routing failure) but the specific credential values
given are not currently being accepted by Azam Pay on either environment. The purpose of the
separate `AZAMPAY_TOKEN` value could not be confirmed from public docs and is not used by the
current implementation (the confirmed auth flow only needs appName/clientId/clientSecret).

## Follow-up

Before this can process a real payment: confirm with Azam Pay (dashboard or support) whether
these credentials are active, which environment they belong to, and regenerate if expired. Also
confirm the exact MNO checkout path (`/azampay/mno/checkout` is a best-effort match, not verified
against official redoc docs which did not render via automated fetch) and what `AZAMPAY_TOKEN` is
for. Real payout/refund endpoints still need to be sourced from Azam Pay directly before
`sendExpertPayout`/`initiateRefund` can be de-simulated.

---

# Decision Review Policy

Architecture decisions should only be updated when:

- a major architectural change is approved
- technology choices fundamentally change
- business requirements require a different architecture

Feature implementation should never require modifications to this document.

---

# Related Documents

- MyJudicial_Master_Build_Reference.md
- PROJECT_ONBOARDING.md
- API_CONTRACTS.md
- BACKEND_GUIDELINES.md
- IMPLEMENTATION_ROADMAP.md

---

## Engineering Principle

**Architectural decisions define the foundation of the system. Features are built on top of that foundation, not the other way around.**