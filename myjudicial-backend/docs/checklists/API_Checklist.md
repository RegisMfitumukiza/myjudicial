# API Checklist

# API Checklist

## Purpose

This checklist ensures that every API endpoint follows the project's standards for consistency, security, and maintainability.

---

# Endpoint Design

- [ ] Route naming follows project conventions.
- [ ] Correct HTTP method selected.
- [ ] Versioned endpoint if applicable.
- [ ] Resource-oriented URL.

---

# Validation

- [ ] Request body validated.
- [ ] Route parameters validated.
- [ ] Query parameters validated.
- [ ] Invalid requests rejected.

---

# Authentication

- [ ] Authentication required where appropriate.
- [ ] Public endpoints intentionally documented.

---

# Authorization

- [ ] RBAC enforced.
- [ ] Ownership verified.
- [ ] Unauthorized access prevented.

---

# Responses

- [ ] Consistent response format.
- [ ] Correct HTTP status codes.
- [ ] Sensitive fields excluded.

---

# Error Handling

- [ ] Standard error format.
- [ ] Meaningful error messages.
- [ ] Validation errors handled.
- [ ] Database errors handled.

---

# Performance

- [ ] Pagination implemented.
- [ ] Filtering supported where appropriate.
- [ ] Sorting supported where appropriate.
- [ ] No N+1 queries.

---

# Documentation

- [ ] Swagger/OpenAPI updated.
- [ ] Example requests documented.
- [ ] Example responses documented.