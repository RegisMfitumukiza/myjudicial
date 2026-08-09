# MyJudicial Architecture & Engineering Decisions

## Purpose

This document records important architectural, engineering, and product decisions made throughout the development of the MyJudicial platform.

Unlike the implementation roadmap, which defines **what** will be built, or the audit report, which describes **what** currently exists, this document explains **why** key decisions were made.

The purpose of this document is to:

- Preserve architectural reasoning.
- Avoid revisiting previously settled decisions.
- Help new contributors understand the system.
- Document trade-offs.
- Record accepted alternatives.
- Improve long-term maintainability.

---

# Decision Template

For every significant decision, document the following:

## Decision

A short description of the decision.

---

## Date

When the decision was made.

---

## Status

One of:

- Proposed
- Accepted
- Superseded
- Deprecated
- Rejected

---

## Context

Explain the problem that required a decision.

---

## Decision

Describe the chosen solution.

---

## Alternatives Considered

List realistic alternatives.

Explain why they were not selected.

---

## Consequences

Describe the impact of the decision.

Include:

- Benefits
- Drawbacks
- Risks

---

## Related Modules

List the modules affected by this decision.

---

---

# ADR-001

## Title

Passwordless Authentication

### Date

2026-06-30

### Status

Accepted

### Context

Users should be able to authenticate quickly without managing passwords.

The platform primarily targets legal professionals and clients in Rwanda.

Ease of onboarding and account recovery are priorities.

### Decision

Use:

- OTP
- Magic Link

Do not implement traditional password authentication.

### Alternatives Considered

Password Authentication

Rejected because:

- Higher support burden
- Password reset complexity
- Poor user experience

OAuth

Deferred.

Will be reconsidered after MVP.

### Consequences

Advantages

- Faster onboarding
- Lower support costs
- Better mobile experience

Trade-offs

- Requires reliable email/SMS delivery.

### Related Modules

- Authentication
- Notifications

---

# ADR-002

## Title

Realtime Messaging Platform

### Date

2026-06-30

### Status

Accepted

### Context

Clients and experts require real-time communication during consultations.

### Decision

Use PocketBase Realtime.

### Alternatives Considered

- Socket.IO
- Supabase Realtime
- Firebase

PocketBase selected because it offers a lightweight realtime solution that integrates well with the existing architecture.

### Consequences

Advantages

- Simpler infrastructure
- Lower maintenance
- Faster implementation

Trade-offs

- Additional service to deploy.

### Related Modules

- Chat
- Booking
- File Storage

---

# ADR-003

## Title

Background Job Processing

### Date

2026-06-30

### Status

Accepted

### Context

Payments, notifications, and retries should not block HTTP requests.

### Decision

Use BullMQ with Redis.

### Alternatives Considered

- Cron Jobs
- RabbitMQ
- Kafka

BullMQ provides retries, scheduling, and monitoring while remaining simple to operate.

### Consequences

Advantages

- Reliable retries
- Delayed jobs
- Scalable workers

Trade-offs

- Requires Redis.

### Related Modules

- Payments
- Notifications
- Email
- WhatsApp

---

# ADR-004

## Title

Repository Pattern

### Date

2026-06-30

### Status

Accepted

### Context

Database access should remain centralized and maintainable.

### Decision

All Prisma queries belong exclusively in repositories.

Controllers and services must never access Prisma directly.

### Alternatives Considered

Direct Prisma usage inside services.

Rejected because it couples business logic with persistence.

### Consequences

Advantages

- Easier testing
- Better maintainability
- Consistent architecture

Trade-offs

- Slight increase in boilerplate.

### Related Modules

Entire backend.

---

# ADR-005

## Title

Validation Strategy

### Date

2026-06-30

### Status

Accepted

### Context

Input validation should be consistent across all APIs.

### Decision

Standardize on Zod.

All request validation must use reusable Zod schemas.

### Alternatives Considered

- Joi
- Yup
- express-validator

### Consequences

Advantages

- Strong TypeScript support
- Reusable validation
- Consistent API behavior

### Related Modules

All API modules.

---

# ADR-006

## Title

Project Architecture

### Date

2026-06-30

### Status

Accepted

### Context

The platform is expected to grow significantly over time.

### Decision

Adopt:

- Domain-Driven Design
- Clean Architecture
- Repository Pattern
- Service Layer

### Alternatives Considered

Traditional MVC.

Rejected due to long-term scalability concerns.

### Consequences

Advantages

- Better modularity
- Easier testing
- Clear separation of concerns

Trade-offs

- More project structure
- Slightly more initial complexity

### Related Modules

Entire backend.

---

# ADR-007

## Title

Denormalized Rating Aggregation on Expert Profile

### Date

2026-06-30

### Status

Accepted

### Context

Every expert profile page must display the expert's average rating and total review count. Without denormalization, every profile view would trigger an aggregation query (`AVG(rating)`, `COUNT(*)`) across the reviews table. As the platform grows, these queries become increasingly expensive and create N+1 problems when listing multiple experts (e.g., map search results or top-rated lists).

### Decision

Store `averageRating` (Decimal) and `reviewCount` (Int) directly on the `ExpertProfile` model. Recalculate these fields inside a Prisma transaction whenever a review is created, updated, or deleted.

The recalculation uses a single `prisma.review.aggregate()` call per expert per mutation, which is fast because `expertId` is indexed.

### Alternatives Considered

- **Real-time calculation on every read:** Rejected because it does not scale beyond a few hundred reviews per expert.
- **Materialized view:** Rejected because it adds deployment complexity (migration scripts, refresh management) for marginal benefit over the transaction-based approach.
- **Trigger-based update in PostgreSQL:** Rejected because it splits business logic across the application and database layers.

### Consequences

**Benefits:**
- Expert profile listings are O(1) — no aggregation needed at read time.
- Map search results load instantly regardless of review count.
- Rating distribution endpoint still uses direct DB aggregation (acceptable for single-expert queries).

**Trade-offs:**
- Slight consistency risk: if a transaction fails after the review write but before the aggregation update, the stored values may be stale. Mitigated by using `$transaction()` with Prisma's interactive transactions.
- Write amplification: each review mutation triggers an extra write to `ExpertProfile`. Acceptable because writes are far fewer than reads.

### Related Modules

- Reviews
- Experts
- Map Search

---

# Future Decisions

Document future architectural decisions here.

Examples:

- AI Provider Selection
- OCR Engine
- Search Engine
- Cloud Provider
- CDN Strategy
- Multi-Tenant Architecture
- Event-Driven Architecture
- Kubernetes Adoption
- Microservices
- Mobile Backend Strategy

Only record decisions that have a lasting impact on the project.