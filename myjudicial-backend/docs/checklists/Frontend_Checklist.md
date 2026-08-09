# Frontend Feature Checklist

## Purpose

This checklist ensures that every frontend feature is consistent, maintainable, responsive, and correctly integrated with the backend.

Complete this checklist before marking any frontend feature as finished.

---

# 1. Architecture

- [ ] Feature follows the frontend architecture.
- [ ] Existing components reused.
- [ ] Business logic separated from UI.
- [ ] Generated API client used.

---

# 2. Components

- [ ] Components are reusable.
- [ ] Components have a single responsibility.
- [ ] Props are typed.
- [ ] Unnecessary duplication avoided.

---

# 3. API Integration

- [ ] Generated OpenAPI client used.
- [ ] No manually created API types.
- [ ] Queries implemented correctly.
- [ ] Mutations implemented correctly.
- [ ] Error handling implemented.

---

# 4. Forms

- [ ] React Hook Form used.
- [ ] Zod validation implemented.
- [ ] Validation messages displayed.
- [ ] Server validation handled.

---

# 5. User Experience

- [ ] Loading state implemented.
- [ ] Empty state implemented.
- [ ] Error state implemented.
- [ ] Success feedback implemented.

---

# 6. Accessibility

- [ ] Semantic HTML used.
- [ ] Keyboard navigation works.
- [ ] Labels added.
- [ ] Accessible components used.

---

# 7. Responsive Design

- [ ] Mobile layout verified.
- [ ] Tablet layout verified.
- [ ] Desktop layout verified.

---

# 8. Performance

- [ ] Unnecessary renders removed.
- [ ] Lazy loading used where appropriate.
- [ ] Images optimized.
- [ ] Code splitting evaluated.

---

# 9. Authentication

- [ ] Protected routes verified.
- [ ] Session handling verified.
- [ ] Unauthorized access handled.

---

# 10. Error Handling

- [ ] API errors displayed.
- [ ] Validation errors displayed.
- [ ] Network failures handled.
- [ ] Unexpected errors handled.

---

# 11. Testing

- [ ] Component tests added.
- [ ] Integration tests added.
- [ ] Manual testing completed.

---

# 12. Documentation

- [ ] Feature documentation updated.
- [ ] Screenshots added if required.
- [ ] Integration notes updated.

---

# 13. AI Review

- [ ] AI-generated code reviewed.
- [ ] Duplicate components removed.
- [ ] Design system followed.
- [ ] Existing hooks reused.

---

# 14. Release Readiness

- [ ] Feature integrates with backend.
- [ ] No console errors.
- [ ] Build succeeds.
- [ ] FRONTEND_TASKS.md updated.
- [ ] FRONTEND_BACKEND_SYNC.md updated.

---

## Definition of Done

A frontend feature is considered complete only when:

- UI requirements are fully implemented.
- Backend integration is verified.
- Responsive behavior is confirmed.
- Accessibility requirements are met.
- Tests pass.
- Documentation is updated.