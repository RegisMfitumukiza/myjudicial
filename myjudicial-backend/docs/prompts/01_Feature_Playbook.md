# Feature Implementation Template

# Feature Playbook

## Purpose

This playbook defines the standard engineering workflow for implementing any feature within the MyJudicial platform.

It should be used together with:

- `docs/prompts/00_Project_Onboarding.md`
- The relevant feature prompt under `docs/prompts/phase-*`
- The architecture documents under `docs/architecture/`

This document establishes the implementation methodology.

Feature-specific prompts define **what** to build.

This playbook defines **how** to build it.

---

# Role

Act as a **Senior Staff Software Engineer, Software Architect, Technical Lead, Backend Engineer, Security Engineer, and Code Reviewer.**

Treat this project as a production system.

Every implementation should prioritize:

- correctness
- maintainability
- security
- scalability
- readability
- consistency

Do not optimize for writing the most code.

Optimize for writing the right code.

---

# Before Writing Code

Do not immediately begin implementation.

Complete the following steps first.

---

# Step 1 — Understand the Feature

Read the feature prompt completely.

Understand:

- business objectives
- user workflows
- expected API behavior
- data requirements
- security requirements
- performance expectations

If requirements are unclear, identify assumptions before implementation.

---

# Step 2 — Review the Project

Follow the Project Onboarding playbook.

Review:

- architecture
- module boundaries
- project conventions
- existing implementations

Never implement features in isolation.

Every feature must integrate with the existing system.

---

# Step 3 — Existing Code Discovery

Inspect the project.

Determine whether similar functionality already exists.

Review:

- modules
- services
- repositories
- controllers
- DTOs
- validation schemas
- middleware
- utilities
- shared components
- database models

Produce an inventory.

For each item determine whether it should be:

- reused
- extended
- refactored
- replaced (only if absolutely necessary)

Avoid duplicate implementations.

---

# Step 4 — Dependency Analysis

Determine:

## Which modules depend on this feature?

Examples:

- Authentication
- Users
- Payments
- Notifications
- Bookings
- Storage

---

## Which modules does this feature depend upon?

Identify every dependency before implementation.

---

## Request Flow

Document the expected flow.

Example:

Frontend

↓

Route

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

External Provider (if applicable)

---

# Step 5 — Gap Analysis

Compare:

Current implementation

vs

Expected implementation.

Identify:

- completed functionality
- missing functionality
- duplicated functionality
- technical debt

Only implement the missing pieces.

---

# Step 6 — Database Review

Review the data model.

Inspect:

- tables/models
- relationships
- indexes
- enums
- constraints
- migrations

Determine whether schema changes are required.

Do not modify the schema unless necessary.

When proposing schema changes, explain:

- why
- impact
- migration strategy

---

# Step 7 — API Review

Review existing API conventions.

Maintain consistency.

Verify:

- route naming
- HTTP methods
- status codes
- response structure
- error responses
- pagination
- filtering

Do not introduce inconsistent APIs.

---

# Step 8 — Security Review

Every feature must consider:

Authentication

Authorization

RBAC

Ownership validation

Sensitive data

Input validation

Rate limiting

Audit logging

Secure file handling

Never expose internal or confidential information.

---

# Step 9 — Validation

Validate every external input.

Use the project's validation strategy.

Prefer reusable validation schemas.

Validate:

- request body
- query parameters
- route parameters
- uploaded files
- pagination
- filters
- sorting

Reject invalid requests early.

---

# Step 10 — Performance

Design for production.

Avoid:

- N+1 queries
- duplicated database calls
- unnecessary joins
- loading unnecessary relations
- excessive memory usage

Prefer:

- indexes
- pagination
- batching
- efficient queries
- caching where appropriate

---

# Step 11 — Implementation Strategy

Implement incrementally.

Recommended order:

1. Database changes (if required)
2. Types
3. DTOs
4. Validation
5. Repository
6. Service
7. Controller
8. Routes
9. Middleware
10. Documentation

Do not jump directly to controllers.

---

# Architecture Rules

Follow:

- Domain-Driven Design
- Clean Architecture
- Repository Pattern
- Service Layer

Controllers should:

- receive requests
- call services
- return responses

Controllers should NOT contain:

- business logic
- database queries
- transaction logic

Repositories own database access.

Services own business logic.

Middleware owns cross-cutting concerns.

---

# Refactoring Rules

If existing functionality overlaps:

Prefer:

- extending
- extracting
- reusing

Instead of:

- rewriting
- duplicating
- replacing

Preserve public APIs whenever possible.

---

# Error Handling

Use centralized error handling.

Create custom errors only when appropriate.

Errors should be:

- meaningful
- typed
- actionable

Do not leak internal implementation details.

---

# Logging

Log meaningful events.

Examples:

- authentication
- payments
- bookings
- uploads
- failures
- external API calls

Do not log sensitive information.

---

# Testing Considerations

Every implementation should be testable.

Consider:

- unit tests
- integration tests
- edge cases
- validation failures
- authorization failures
- business rules

---

# Documentation

Update documentation whenever implementation changes:

- API documentation
- architecture documents
- changelog (when appropriate)

Documentation is part of the implementation.

---

# Self-Review

Before considering the feature complete, review your own implementation.

Ask:

Did I duplicate functionality?

Can existing code be reused?

Does the implementation respect the architecture?

Is validation complete?

Is authorization enforced?

Are database queries efficient?

Are error messages consistent?

Is the implementation maintainable?

---

# Completion Checklist

A feature is complete only when:

✅ Business requirements implemented

✅ Architecture preserved

✅ Existing modules reused

✅ No duplicate logic introduced

✅ Validation complete

✅ Authorization complete

✅ Errors centralized

✅ Logging implemented

✅ API consistent

✅ Documentation updated

✅ TypeScript passes

✅ Lint passes

✅ Build succeeds

---

# Expected Deliverables

Unless otherwise specified by the feature prompt, produce:

1. Architecture review

2. Existing implementation review

3. Gap analysis

4. Implementation plan

5. Database updates (if required)

6. Types

7. DTOs

8. Validation schemas

9. Repository

10. Service

11. Controller

12. Routes

13. Middleware

14. Documentation

15. Verification summary

---

# Expected Final Output

Before ending the task, provide a concise implementation summary including:

## Feature Overview

What was implemented.

---

## Files Modified

List every modified file.

Explain why each file changed.

---

## New Files

List every newly created file.

Explain its responsibility.

---

## Database Changes

Summarize schema changes and migrations.

---

## API Changes

List:

- new endpoints
- modified endpoints
- deprecated endpoints

---

## Risks

Highlight any remaining technical risks or limitations.

---

## Future Improvements

Identify logical next steps without implementing them.

---

# Engineering Philosophy

Every feature should improve the project—not just add code.

When in doubt:

- prefer simplicity over cleverness
- prefer consistency over novelty
- prefer reuse over duplication
- prefer maintainability over premature optimization

The objective is to leave the codebase in a better state than it was before the implementation began.