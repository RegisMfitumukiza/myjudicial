# Backend Feature Checklist

## Purpose

This checklist ensures that every backend feature meets the engineering, architectural, security, and documentation standards of the MyJudicial platform.

Complete this checklist before marking any backend feature as finished.

---

# 1. Architecture

- [ ] The feature aligns with the MyJudicial architecture.
- [ ] Domain boundaries are respected.
- [ ] No duplicate functionality has been introduced.
- [ ] Existing modules have been reused where appropriate.
- [ ] Business logic is placed in the correct layer.

---

# 2. Project Structure

- [ ] Module follows the standard folder structure.
- [ ] Controllers remain thin.
- [ ] Services contain business logic.
- [ ] Repositories own database access.
- [ ] Shared utilities are reused.

---

# 3. Database

- [ ] Prisma schema updated (if required).
- [ ] Migration created.
- [ ] Relations verified.
- [ ] Indexes reviewed.
- [ ] Constraints verified.
- [ ] No N+1 query problems.

---

# 4. Validation

- [ ] Zod schemas created or updated.
- [ ] Request validation implemented.
- [ ] Response types verified.
- [ ] DTOs updated.

---

# 5. API

- [ ] Routes implemented.
- [ ] Controllers implemented.
- [ ] Services implemented.
- [ ] Repositories implemented.
- [ ] Middleware added where required.

---

# 6. OpenAPI

- [ ] Swagger annotations updated.
- [ ] OpenAPI specification regenerated.
- [ ] Request examples added.
- [ ] Response examples added.
- [ ] Error responses documented.

---

# 7. Security

- [ ] Authentication verified.
- [ ] Authorization verified.
- [ ] RBAC enforced.
- [ ] Ownership checks implemented.
- [ ] Input validation completed.
- [ ] Sensitive data protected.

---

# 8. Performance

- [ ] Pagination implemented where appropriate.
- [ ] Efficient database queries.
- [ ] Proper indexing considered.
- [ ] Unnecessary queries removed.
- [ ] Caching evaluated.

---

# 9. Error Handling

- [ ] Domain errors created.
- [ ] Validation errors handled.
- [ ] Database errors handled.
- [ ] HTTP responses standardized.

---

# 10. Logging & Auditing

- [ ] Important actions logged.
- [ ] Audit logs updated where required.
- [ ] Sensitive data excluded from logs.

---

# 11. Background Jobs

- [ ] Long-running tasks moved to queues.
- [ ] Retries configured where appropriate.
- [ ] Failure handling implemented.

---

# 12. Testing

- [ ] Unit tests added.
- [ ] Integration tests added.
- [ ] Existing tests still pass.
- [ ] Manual testing completed.

---

# 13. Documentation

- [ ] API documentation updated.
- [ ] Feature documentation updated.
- [ ] Implementation notes added if necessary.

---

# 14. AI Review

- [ ] AI-generated code reviewed.
- [ ] Duplicate code removed.
- [ ] Existing modules reused.
- [ ] Naming conventions verified.
- [ ] Code follows project guidelines.

---

# 15. Release Readiness

- [ ] Feature works as expected.
- [ ] No breaking changes introduced.
- [ ] Feature merged successfully.
- [ ] FEATURE_STATUS.md updated.
- [ ] BACKEND_TASKS.md updated.

---

## Definition of Done

A backend feature is considered complete only when:

- Business requirements are fully implemented.
- All checklist items are satisfied.
- Tests pass successfully.
- OpenAPI is updated.
- Code review is complete.
- Documentation is current.