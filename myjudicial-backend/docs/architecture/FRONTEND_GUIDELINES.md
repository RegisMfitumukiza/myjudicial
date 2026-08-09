# Frontend Development Guidelines

## Purpose

This document defines the engineering standards for frontend development in the MyJudicial platform.

It ensures a consistent user experience, maintainable codebase, and seamless integration with the backend.

---

# Technology Stack

The frontend is built using:

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Axios (via generated client)
- React Hook Form
- Zod
- Orval (OpenAPI client generation)

---

# Architectural Principles

The frontend follows:

- Feature-based organization
- Component composition
- Separation of concerns
- Type-safe API integration
- OpenAPI-driven development

---

# Project Structure

Organize features by domain.

Example:

```text
src/

features/
components/
layouts/
hooks/
lib/
generated/
types/
```

The `generated/` directory contains code produced from OpenAPI.

Never edit generated files manually.

---

# API Integration

The frontend consumes APIs exclusively through the generated OpenAPI client.

Do not manually define:

- API request interfaces
- API response interfaces
- API enums

Regenerate the client whenever the OpenAPI specification changes.

---

# State Management

Prefer:

- TanStack Query for server state
- Local component state for UI state

Avoid global state unless multiple features require shared access.

---

# Forms

Use:

- React Hook Form
- Zod validation

Client-side validation should complement, not replace, backend validation.

---

# Components

Components should be:

- Reusable
- Small
- Focused
- Accessible

Separate presentation from business logic where practical.

---

# Styling

Use:

- Tailwind CSS
- shadcn/ui

Avoid inline styles unless necessary.

Maintain a consistent design system.

---

# User Experience

Every page should handle:

- Loading states
- Empty states
- Error states
- Success feedback

Provide clear feedback for user actions.

---

# Authentication

Authentication tokens should be handled securely.

Protected routes should verify authentication before rendering sensitive content.

Never expose sensitive information in the client.

---

# Accessibility

Interfaces should:

- Support keyboard navigation
- Include semantic HTML
- Provide accessible labels
- Meet basic WCAG guidelines where practical

---

# Performance

Prefer:

- Lazy loading
- Code splitting
- Image optimization
- Memoization when beneficial

Avoid unnecessary re-renders.

---

# Error Handling

Handle:

- Network failures
- Validation errors
- Authorization failures
- Unexpected server errors

Display meaningful feedback to users.

---

# Testing

Critical components should include:

- Unit tests
- Integration tests

User flows should be verified before release.

---

# Documentation

Keep feature documentation current.

Do not duplicate API documentation maintained in OpenAPI.

---

# AI-Assisted Development

AI-generated frontend code should:

- Follow project architecture
- Use generated API clients
- Respect the design system
- Avoid duplicate components
- Undergo human review before merging

---

# Engineering Principles

- Components should have a single responsibility.
- Prefer composition over inheritance.
- Keep business logic out of presentation components.
- Use generated API clients.
- Build responsive and accessible interfaces.
- Prioritize maintainability and consistency.

---

## Guiding Principle

> **Build interfaces that are intuitive for users and maintainable for developers.**