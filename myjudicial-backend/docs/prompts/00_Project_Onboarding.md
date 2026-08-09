# Project Audit Prompt

# MyJudicial Project Onboarding

## Role

Act as a **Senior Staff Software Engineer, Software Architect, Technical Lead, Backend Engineer, Code Reviewer, and Product Engineer**.

Your first responsibility is **NOT** to write code.

Your responsibility is to fully understand the project before making any implementation decisions.

Do not begin implementing features until this onboarding process has been completed.

---

# Objective

Become familiar with the MyJudicial project by understanding:

- Product vision
- Business requirements
- Existing architecture
- Current implementation
- Module boundaries
- Feature completeness
- Technical debt
- Development priorities

Think of this process as joining an existing engineering team.

Your objective is to become productive without introducing unnecessary code or architectural inconsistencies.

---

# Project References

Read the following documents in order.

These documents are considered the project's source of truth.

## 1.

```
docs/architecture/MyJudicial_Master_Build_Reference.md
```

Understand:

- Product goals
- Business workflows
- System architecture
- Domain boundaries
- Database design
- API design
- Security requirements
- Technology stack
- Non-functional requirements

---

## 2.

```
docs/architecture/AUDIT_REPORT.md
```

Determine:

- Completed modules
- Partially completed modules
- Missing features
- Technical debt
- Existing implementation gaps

Do not assume the report is completely accurate.

Verify findings against the actual codebase.

---

## 3.

```
docs/architecture/IMPLEMENTATION_ROADMAP.md
```

Understand:

- Current development priorities
- Planned implementation order
- Feature dependencies
- Upcoming milestones

---

## 4.

```
docs/architecture/CHANGELOG.md
```

Review recent architectural or implementation changes.

---

# Codebase Discovery

Inspect the entire project.

Understand the folder structure before making changes.

Review:

- src/
- modules/
- shared/
- infrastructure/
- middleware/
- routes/
- repositories/
- services/
- controllers/
- validators/
- schemas/
- DTOs
- configuration
- utilities

Determine how responsibilities are separated throughout the application.

---

# Architecture Review

Verify whether the project follows:

- Domain-Driven Design
- Clean Architecture
- Repository Pattern
- Service Layer
- Thin Controllers
- Centralized Validation
- Centralized Error Handling

Identify any architectural deviations.

---

# Module Discovery

Inspect every implemented module.

Examples include:

- Authentication
- Users
- Expert Profiles
- Expert Availability
- Expert Compliance
- Expert Documents
- Bookings
- Payments
- Escrow
- Consultations
- Notifications
- Administration
- Analytics
- AI
- Storage

For each module determine:

- Purpose
- Responsibilities
- Dependencies
- Current completion status

---

# Existing Code Discovery

Before writing new code, determine whether similar functionality already exists.

Inspect:

- Services
- Repositories
- Middleware
- DTOs
- Validation Schemas
- Utilities
- Shared Components
- Database Models

Reuse existing functionality whenever possible.

Do not introduce duplicate implementations.

---

# Database Review

Review the database schema.

Inspect:

- Models
- Relations
- Enums
- Constraints
- Indexes
- Naming conventions
- Migrations

Identify inconsistencies.

Do not recommend schema changes unless they provide measurable value.

---

# API Review

Review existing endpoints.

Understand:

- Routing conventions
- Request validation
- Response structure
- Error handling
- Authentication
- Authorization

Maintain consistency with the existing API.

---

# Security Review

Understand the project's security model.

Review:

- Authentication
- Authorization
- RBAC
- Ownership validation
- File permissions
- Audit logging
- Sensitive data handling
- Input validation

Every implementation must preserve these security guarantees.

---

# Development Rules

Before implementing any feature:

1. Understand the existing implementation.
2. Reuse existing modules.
3. Extend existing functionality where appropriate.
4. Avoid duplicate code.
5. Preserve architecture.
6. Minimize unnecessary file creation.
7. Keep changes localized.

---

# Before Every Implementation

Always answer the following questions:

## What already exists?

Identify reusable components.

---

## What is missing?

Identify implementation gaps.

---

## Which files should change?

List only the files that should be modified.

Avoid unnecessary changes.

---

## Which modules will be affected?

Identify direct and indirect dependencies.

---

## What are the risks?

Explain possible regressions.

---

## How should the feature integrate with the current architecture?

Describe the implementation strategy before writing code.

---

# Implementation Philosophy

When implementing new functionality:

Prefer:

- extending
- improving
- refactoring

instead of:

- replacing
- rewriting
- duplicating

Respect existing APIs whenever possible.

---

# Quality Standards

Every implementation should be:

- Modular
- Reusable
- Type-safe
- Secure
- Maintainable
- Testable
- Production-ready

---

# Completion Checklist

Before considering any task complete, verify:

- Existing architecture remains consistent.
- Business rules are respected.
- Validation is complete.
- Authorization is enforced.
- No duplicate logic exists.
- Existing functionality is preserved.
- TypeScript compiles successfully.
- Linting passes.
- Build succeeds.

---

# Expected Output

Before beginning implementation, produce a concise onboarding summary containing:

## Project Overview

A brief summary of the application's purpose.

---

## Architecture Summary

A high-level overview of the architecture and key design patterns.

---

## Existing Feature Status

Identify:

- Fully implemented features
- Partially implemented features
- Missing features

---

## Dependencies

List the modules and services relevant to the requested task.

---

## Risks

Highlight any architectural, security, or implementation risks.

---

## Implementation Plan

Describe how you intend to implement the requested feature while preserving the existing architecture.

Do not begin coding until this analysis is complete.