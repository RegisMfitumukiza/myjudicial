# Backend Development Guidelines

## Purpose

This document defines the engineering standards for backend development in the MyJudicial platform.

All backend code should comply with these guidelines to ensure consistency, maintainability, scalability, and security.

These guidelines apply to every module regardless of implementation phase.

---

# Technology Stack

The backend is built using:

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- JWT Authentication
- Swagger / OpenAPI
- BullMQ (Background Jobs)
- PocketBase (Real-time Chat)
- Docker

---

# Architectural Principles

The backend follows:

- Domain-Driven Design (DDD)
- Clean Architecture
- Repository Pattern
- Service Layer Pattern
- Dependency Injection where appropriate
- OpenAPI-First Development

---

# Standard Module Structure

Every module should follow this structure where applicable.

```text
module/

controllers/
services/
repositories/
routes/
schemas/
dto/
types/
middleware/
errors/
interfaces/
utils/
```

Avoid creating folders that have no purpose.

---

# Layer Responsibilities

## Controllers

Controllers should:

- Receive HTTP requests
- Validate input
- Call services
- Return HTTP responses

Controllers should never:

- Query the database
- Implement business logic
- Perform transactions

---

## Services

Services contain business logic.

Responsibilities include:

- Business rules
- Workflow orchestration
- Calling repositories
- Managing transactions
- Calling external services

---

## Repositories

Repositories own all database access.

Repositories should:

- Contain Prisma queries
- Return domain objects
- Hide persistence details

No Prisma queries should exist outside repositories.

---

# Validation

Use Zod for all external input.

Validation occurs before business logic.

Validation schemas should be reusable.

---

# Error Handling

Use centralized error handling.

Create domain-specific errors where necessary.

Return consistent API responses.

---

# API Standards

Every endpoint should:

- Follow REST conventions
- Be documented with OpenAPI
- Return consistent responses
- Validate input
- Enforce authorization
- Use meaningful HTTP status codes

---

# Authentication & Authorization

Authentication:

- JWT
- Email OTP
- Magic Link

Authorization:

- RBAC
- Ownership verification
- Permission-based access

Never trust client-provided permissions.

---

# Database Guidelines

Use Prisma for all persistence.

Prefer:

- Transactions
- Indexes
- Relations
- Constraints

Avoid:

- Duplicate queries
- N+1 queries
- Unnecessary eager loading

---

# Background Jobs

Long-running tasks should execute asynchronously.

Examples:

- Emails
- Notifications
- Malware scanning
- Retry queues
- Scheduled jobs

---

# Logging

Important operations should be logged.

Examples:

- Authentication
- Payments
- Compliance
- Administrative actions

Never log sensitive information.

---

# Security

Every implementation should consider:

- Authentication
- Authorization
- Input validation
- Rate limiting
- Secure file uploads
- Secrets management
- Audit logging

Security takes precedence over convenience.

---

# Performance

Prefer:

- Pagination
- Lazy loading
- Proper indexing
- Efficient queries
- Caching where appropriate

Avoid unnecessary database calls.

---

# Documentation

Every feature should include:

- OpenAPI documentation
- Validation schemas
- Meaningful comments where required

Do not duplicate API documentation outside OpenAPI.

---

# Testing

Every critical feature should include:

- Unit tests
- Integration tests

Critical business workflows should also include end-to-end tests.

---

# Code Quality

Code should be:

- Readable
- Modular
- Reusable
- Testable
- Type-safe

Avoid premature optimization.

Prefer clarity over cleverness.

---

# AI-Assisted Development

AI-generated code must:

- Follow project architecture
- Reuse existing modules
- Avoid duplicate functionality
- Pass review before merging
- Update OpenAPI when APIs change

AI assists development but does not replace engineering judgment.

---

# Engineering Principles

- Keep controllers thin.
- Keep services focused.
- Repositories own persistence.
- Business rules belong in services.
- Validation precedes business logic.
- OpenAPI is the API source of truth.
- Prefer composition over duplication.
- Optimize for maintainability before optimization.

---

## Guiding Principle

> **Build features that are easy to understand, easy to test, and easy to extend.**