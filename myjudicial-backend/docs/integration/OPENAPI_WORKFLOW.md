# OpenAPI Workflow

## Purpose

This document defines the official backend-to-frontend development workflow for the MyJudicial platform.

MyJudicial follows an **OpenAPI-First Integration** approach, where the OpenAPI specification serves as the single source of truth for all communication between the backend and frontend.

Every feature must follow this workflow to ensure:

- Consistent API design
- Type-safe frontend integration
- Reliable documentation
- Faster development
- Reduced integration issues
- Predictable AI-assisted development

---

# Guiding Principles

The following principles govern API development within the project.

- The OpenAPI specification is the official API contract.
- The backend owns the API contract.
- The frontend consumes the generated API client.
- API models should never be duplicated manually.
- Documentation must always match implementation.
- Every API change must be reflected in OpenAPI.
- Breaking changes require API versioning.

---

# Technology Stack

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- Swagger (OpenAPI)

## API Contract

- OpenAPI 3.x

## Client Generation

- Orval

## Frontend

- Next.js
- TypeScript
- TanStack Query
- Axios (generated)
- React Hook Form
- Zod

---

# Development Lifecycle

Every feature follows the same lifecycle.

```text
Business Requirement
        │
        ▼
Project Analysis
        │
        ▼
Backend Development
        │
        ▼
Validation (Zod)
        │
        ▼
Swagger Documentation
        │
        ▼
OpenAPI Specification
        │
        ▼
Generate Type-safe Client (Orval)
        │
        ▼
Frontend Development
        │
        ▼
Integration Testing
        │
        ▼
Documentation Update
        │
        ▼
Release
```

---

# Backend Responsibilities

Backend developers are responsible for:

- Designing REST endpoints
- Implementing business logic
- Validating requests
- Maintaining Swagger documentation
- Returning standardized responses
- Protecting sensitive data
- Preserving backward compatibility where possible

Whenever an API changes:

- Update Swagger documentation.
- Regenerate the OpenAPI specification.
- Verify request and response schemas.
- Version breaking changes appropriately.

---

# API Design Standards

Every endpoint should:

- Follow REST conventions.
- Use meaningful resource names.
- Return consistent responses.
- Validate all input.
- Document request bodies.
- Document responses.
- Document authentication requirements.
- Document error responses.
- Follow project naming conventions.

---

# Standard API Response

Successful responses:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

# OpenAPI Specification

The OpenAPI specification must always include:

- Paths
- Parameters
- Request schemas
- Response schemas
- Security requirements
- Tags
- Examples
- Error responses

The specification must accurately represent the running backend.

---

# Swagger Documentation

Swagger must be updated whenever:

- A new endpoint is created.
- An endpoint changes.
- Validation changes.
- Authentication changes.
- Authorization changes.
- Response schemas change.
- Error responses change.

Swagger documentation should never fall behind implementation.

---

# Client Generation

The frontend consumes APIs exclusively through generated clients.

```text
Swagger
      │
      ▼
OpenAPI Specification
      │
      ▼
Orval
      │
      ▼
Generated TypeScript Client
```

Generated files should never be edited manually.

Whenever the OpenAPI specification changes:

- Regenerate the client.
- Replace generated files.
- Update frontend implementation if necessary.

---

# Frontend Responsibilities

Frontend developers should:

- Use generated API clients.
- Use generated request types.
- Use generated response types.
- Use generated enums.
- Use generated hooks where available.
- Avoid manually recreating backend models.

Business logic should not depend on manually maintained API interfaces.

---

# API Versioning

Current API version:

```
v1
```

Breaking changes require a new version.

Examples include:

- Removing endpoints
- Renaming endpoints
- Removing response fields
- Renaming response fields
- Authentication changes
- Authorization changes
- Breaking schema modifications

Non-breaking additions may remain within the same version.

---

# Orval Workflow

Whenever the backend API changes:

```text
Update Backend
        │
        ▼
Update Swagger
        │
        ▼
Generate OpenAPI
        │
        ▼
Run Orval
        │
        ▼
Update Frontend
```

Generated code should never be modified manually.

---

# Continuous Integration

The CI pipeline should verify:

- OpenAPI validity
- Swagger generation
- Backend build
- Frontend build
- Automated tests
- Type generation
- Linting
- Formatting

Build failures should block merging.

---

# AI-Assisted Development Workflow

MyJudicial adopts an AI-assisted development workflow to improve productivity while maintaining architectural consistency.

AI tools (such as Kiro, Cursor, GitHub Copilot, ChatGPT, or Codex) should follow the same development lifecycle as human contributors.

AI-generated code must comply with the project's architecture, coding standards, and API contracts.

---

## Phase 1 — Project Understanding

Before implementing any feature, AI should:

1. Read `MyJudicial_Master_Build_Reference.md`.
2. Read `PROJECT_ONBOARDING.md`.
3. Review:
   - `ARCHITECTURE_DECISIONS.md`
   - `BACKEND_GUIDELINES.md`
   - `FRONTEND_GUIDELINES.md`
   - `API_CONTRACTS.md`
4. Inspect the existing codebase.
5. Determine what has already been implemented.
6. Reuse existing modules whenever possible.
7. Avoid introducing duplicate functionality.

---

## Phase 2 — Backend Development

Implement the backend feature by:

- Following Domain-Driven Design.
- Keeping controllers thin.
- Placing business logic in services.
- Restricting database access to repositories.
- Adding validation using Zod.
- Updating database migrations if required.
- Reusing shared utilities.
- Maintaining existing architectural patterns.

---

## Phase 3 — OpenAPI Synchronization

Whenever an API changes:

1. Update Swagger annotations.
2. Regenerate the OpenAPI specification.
3. Verify request and response schemas.
4. Verify examples.
5. Commit the updated specification.

The OpenAPI specification must always represent the current backend.

---

## Phase 4 — Frontend Integration

After the OpenAPI specification has been updated:

1. Regenerate the API client using Orval.
2. Replace outdated generated code.
3. Consume the generated client.
4. Do not manually create request or response interfaces.
5. Implement or update the frontend feature.

---

## Phase 5 — Quality Assurance

Before considering the feature complete:

Complete:

- BACKEND_CHECKLIST.md
- FRONTEND_CHECKLIST.md (if applicable)
- API_CHECKLIST.md
- SECURITY_CHECKLIST.md
- TESTING_CHECKLIST.md
- INTEGRATION_CHECKLIST.md
- RELEASE_CHECKLIST.md

---

## Phase 6 — Documentation

Update the following documents where applicable:

- FEATURE_STATUS.md
- BACKEND_TASKS.md
- FRONTEND_TASKS.md
- FRONTEND_BACKEND_SYNC.md

If architecture changes:

Update:

- ARCHITECTURE_DECISIONS.md

If API contracts change:

Update:

- API_CONTRACTS.md

---

## Phase 7 — Pull Request Readiness

Before merging:

- All tests pass.
- OpenAPI is current.
- Generated API client is synchronized.
- Documentation is updated.
- Code review is complete.
- Duplicate functionality has been avoided.
- Feature is production-ready.

---

# Best Practices

Always:

- Keep OpenAPI synchronized.
- Reuse existing modules.
- Use generated API clients.
- Prefer backward-compatible changes.
- Document every endpoint.
- Validate every request.
- Keep generated code untouched.
- Maintain type safety.
- Follow the established architecture.

---

# Common Mistakes to Avoid

Never:

- Edit generated Orval files.
- Maintain duplicate API interfaces.
- Change APIs without updating OpenAPI.
- Skip documentation.
- Skip integration testing.
- Bypass validation.
- Introduce undocumented endpoints.

---

# Related Documents

## Architecture

- MyJudicial_Master_Build_Reference.md
- PROJECT_ONBOARDING.md
- ARCHITECTURE_DECISIONS.md
- BACKEND_GUIDELINES.md
- FRONTEND_GUIDELINES.md
- API_CONTRACTS.md

## Integration

- FEATURE_STATUS.md
- BACKEND_TASKS.md
- FRONTEND_TASKS.md
- FRONTEND_BACKEND_SYNC.md

## Checklists

- BACKEND_CHECKLIST.md
- FRONTEND_CHECKLIST.md
- API_CHECKLIST.md
- SECURITY_CHECKLIST.md
- TESTING_CHECKLIST.md
- INTEGRATION_CHECKLIST.md
- RELEASE_CHECKLIST.md

---

# Workflow Summary

```text
Business Requirement
        │
        ▼
Read Project Documentation
        │
        ▼
Review Existing Implementation
        │
        ▼
Backend Development
        │
        ▼
Validation (Zod)
        │
        ▼
Swagger Documentation
        │
        ▼
OpenAPI Specification
        │
        ▼
Generate API Client (Orval)
        │
        ▼
Frontend Development
        │
        ▼
Testing & Quality Assurance
        │
        ▼
Documentation Update
        │
        ▼
Release
```

---

# Guiding Principle

> **Implement once in the backend, describe it in OpenAPI, generate it for the frontend, verify it through testing, and maintain a single source of truth throughout the software lifecycle.**