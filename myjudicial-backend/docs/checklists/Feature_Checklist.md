# Feature Checklist

# Feature Implementation Checklist

## Purpose

This checklist defines the minimum engineering standards that every new feature must satisfy before it can be considered complete.

Complete this checklist after implementation and before requesting a code review.

---

# 1. Requirements

- [ ] Business requirements are fully implemented.
- [ ] User workflows are complete.
- [ ] Acceptance criteria are satisfied.
- [ ] No requested functionality has been omitted.

---

# 2. Architecture

- [ ] Domain-Driven Design respected.
- [ ] Clean Architecture respected.
- [ ] Repository Pattern followed.
- [ ] Service Layer followed.
- [ ] Controllers remain thin.
- [ ] Business logic is inside services.
- [ ] Database access is isolated to repositories.
- [ ] Middleware responsibilities are respected.

---

# 3. Code Reuse

- [ ] Existing services reused where appropriate.
- [ ] Existing repositories reused.
- [ ] Existing middleware reused.
- [ ] Existing DTOs reused.
- [ ] Existing validators reused.
- [ ] Existing utilities reused.
- [ ] No duplicate functionality introduced.

---

# 4. Database

- [ ] Schema reviewed.
- [ ] Relations verified.
- [ ] Indexes reviewed.
- [ ] Constraints verified.
- [ ] Migrations created if required.
- [ ] No unnecessary schema changes.

---

# 5. Validation

- [ ] Request body validated.
- [ ] Route parameters validated.
- [ ] Query parameters validated.
- [ ] Uploaded files validated.
- [ ] Pagination validated.
- [ ] Filters validated.

---

# 6. Security

- [ ] Authentication enforced.
- [ ] Authorization enforced.
- [ ] RBAC respected.
- [ ] Ownership checks implemented.
- [ ] Sensitive fields excluded.
- [ ] Audit logging implemented where necessary.

---

# 7. Performance

- [ ] No N+1 queries.
- [ ] Efficient database queries.
- [ ] Pagination implemented.
- [ ] Appropriate indexes used.
- [ ] Unnecessary relations avoided.

---

# 8. API

- [ ] REST conventions followed.
- [ ] Consistent response structure.
- [ ] Appropriate HTTP status codes.
- [ ] Standardized error responses.

---

# 9. Error Handling

- [ ] Centralized error handling.
- [ ] Meaningful error messages.
- [ ] Custom errors created only when necessary.
- [ ] Internal implementation details are not exposed.

---

# 10. Documentation

- [ ] API documentation updated.
- [ ] Roadmap updated if required.
- [ ] Architecture documentation updated if required.

---

# 11. Final Verification

- [ ] TypeScript compiles.
- [ ] Lint passes.
- [ ] Build succeeds.
- [ ] No unused imports.
- [ ] No dead code.
- [ ] Feature tested manually.

---

## Definition of Done

A feature is complete only when every applicable item above has been satisfied.