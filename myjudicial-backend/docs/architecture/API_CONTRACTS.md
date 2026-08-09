# API Contracts

## Purpose

This document defines the API contract standards used throughout the MyJudicial platform.

Its purpose is to establish long-term integration principles between the Backend and Frontend.

It is **not** intended to document individual endpoints or track feature progress.

---

# Guiding Principles

The API follows the following principles:

- Single Source of Truth
- Contract-First Development
- Strong Type Safety
- Backward Compatibility
- Consistent Responses
- Secure by Default
- OpenAPI Driven Development

---

# Source of Truth

Every API is governed by the following documents.

| Document | Responsibility |
|-----------|----------------|
| **MyJudicial_Master_Build_Reference.md** | Business requirements |
| **OpenAPI Specification** | Complete API contract |
| **Swagger UI** | Interactive API documentation |
| **FEATURE_STATUS.md** | Feature implementation progress |
| **FRONTEND_BACKEND_SYNC.md** | Integration progress |
| **API_CONTRACTS.md** | API standards and engineering rules |

Only the OpenAPI Specification defines endpoints, schemas, requests and responses.

This document intentionally avoids duplicating endpoint documentation.

---

# API Development Workflow

Every API follows the same lifecycle.

```
Business Requirement
        │
        ▼
Backend Implementation
        │
        ▼
Validation
        │
        ▼
OpenAPI Generation
        │
        ▼
Swagger Documentation
        │
        ▼
Generated TypeScript Client
        │
        ▼
Frontend Integration
        │
        ▼
End-to-End Testing
```

---

# OpenAPI First

The project adopts an OpenAPI-first workflow.

Every new API must:

- Be implemented in the backend.
- Be documented in the OpenAPI specification.
- Be available through Swagger UI.
- Be consumable through generated TypeScript clients.

No API should exist without OpenAPI documentation.

---

# Client Generation

Frontend applications must consume generated API clients.

Manual request interfaces should never be written.

Manual response interfaces should never be written.

The frontend must regenerate its API client whenever the OpenAPI specification changes.

The generated client should never be edited manually.

---

# Authentication

Protected endpoints require

```
Authorization: Bearer <JWT>
```

Current authentication methods

- Email & Password
- Email OTP
- Magic Link

Future authentication methods

- Google OAuth
- LinkedIn OAuth

---

# API Versioning

Current version

```
v1
```

Breaking changes require a new API version.

Existing versions remain supported according to the project's deprecation policy.

Breaking changes must never be introduced silently.

---

# Response Standards

All endpoints should return a consistent response structure.

## Success

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

# Validation

All incoming requests must be validated.

Validation should occur before business logic executes.

Validation schemas must be reusable.

Validation errors must be returned in a consistent format.

---

# Pagination

Collection endpoints should support pagination.

Recommended parameters

```
?page=1

&limit=20
```

---

# Sorting

Collection endpoints should support sorting.

Example

```
?sort=createdAt

?order=desc
```

---

# Filtering

Collection endpoints should support filtering whenever appropriate.

Filtering should remain consistent across the platform.

---

# Date & Time

All timestamps must use ISO-8601.

Example

```
2026-06-30T14:45:00Z
```

Store dates internally in UTC.

Timezone conversion is a frontend responsibility.

---

# File Uploads

File uploads must:

- Validate file type.
- Validate file size.
- Scan uploaded files when malware scanning is enabled.
- Never expose storage implementation details.

---

# Error Handling

The API should return meaningful HTTP status codes.

Common responses

- 200 OK
- 201 Created
- 204 No Content
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Validation Error
- 429 Too Many Requests
- 500 Internal Server Error

---

# Security

Every endpoint should follow the project's security standards.

This includes:

- Authentication
- Authorization
- RBAC
- Ownership verification
- Input validation
- Audit logging
- Rate limiting
- Sensitive data protection

---

# Frontend Responsibilities

Frontend developers should:

- Use generated API clients.
- Never depend on undocumented fields.
- Handle loading states.
- Handle empty states.
- Handle validation errors.
- Handle authorization failures.
- Handle pagination consistently.

---

# Backend Responsibilities

Backend developers should:

- Maintain backward compatibility.
- Keep OpenAPI documentation current.
- Maintain consistent response structures.
- Validate every request.
- Protect sensitive information.
- Keep Swagger synchronized with the implementation.

---

# Definition of Ready

An API is ready for frontend integration when:

- Business logic is complete.
- Validation is complete.
- Authorization is implemented.
- OpenAPI documentation is complete.
- Swagger UI is updated.
- Integration tests pass.
- Response models are stable.

---

# Definition of Done

An API is considered complete when:

- Backend implementation is complete.
- OpenAPI documentation is complete.
- Generated client works correctly.
- Frontend integration is complete.
- End-to-end tests pass.
- Documentation has been updated.

---

# Change Management

Whenever an API changes:

1. Update the backend implementation.
2. Update validation schemas.
3. Update the OpenAPI specification.
4. Verify Swagger documentation.
5. Regenerate frontend API clients.
6. Run integration tests.
7. Update project documentation where necessary.

---

# Long-Term Stability

This document should change only when:

- API development standards change.
- Authentication strategy changes.
- Versioning strategy changes.
- Response standards change.
- Security policies change.
- OpenAPI workflow changes.

Feature implementations, endpoint additions, and integration progress belong in other project documents and should not require modifications to this file.

---

# Related Documentation

- architecture/MyJudicial_Master_Build_Reference.md
- integration/FEATURE_STATUS.md
- integration/FRONTEND_BACKEND_SYNC.md
- integration/FRONTEND_TASKS.md
- integration/BACKEND_TASKS.md
- Swagger UI
- OpenAPI Specification

---

## Engineering Principle

**The backend defines the contract. OpenAPI publishes the contract. The frontend consumes the contract. No API contract is written twice.**