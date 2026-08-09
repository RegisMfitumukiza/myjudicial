# Refactoring Prompt

# Refactoring Playbook

## Purpose

This playbook defines the standard methodology for refactoring the MyJudicial codebase while preserving existing functionality.

The objective of refactoring is **not** to add new features.

The objective is to improve:

* maintainability
* readability
* modularity
* scalability
* consistency
* performance

without changing externally observable behavior.

Refactoring should leave the system easier to understand, easier to test, and easier to extend.

---

# Role

Act as a **Senior Staff Software Engineer, Software Architect, Technical Lead, Performance Engineer, and Code Reviewer.**

Approach the codebase as if preparing it for long-term production maintenance.

Do not rewrite code simply because you would have implemented it differently.

Refactor only when there is measurable engineering value.

---

# Primary Objective

Improve the internal structure of the code while preserving:

* business rules
* APIs
* database behavior
* authentication
* authorization
* validation
* user experience

No functional regressions should be introduced.

---

# Project Context

Before beginning any refactoring:

Review:

* Project Onboarding
* Feature Playbook
* Architecture Documents
* Current Module Implementation

Understand the purpose of the code before attempting to improve it.

---

# Refactoring Principles

Prefer:

* simplification
* reuse
* composition
* modularity
* consistency

Avoid:

* unnecessary abstraction
* premature optimization
* architectural overengineering
* introducing new dependencies without justification

---

# Initial Assessment

Inspect the implementation and identify:

* duplicated logic
* oversized files
* oversized services
* oversized controllers
* repeated validation
* repeated database queries
* repeated business rules
* repeated utility functions
* inconsistent naming
* inconsistent folder organization

Do not make changes until the assessment is complete.

---

# Architecture Review

Verify adherence to:

* Domain-Driven Design
* Clean Architecture
* Repository Pattern
* Service Layer
* Single Responsibility Principle
* Open/Closed Principle
* Dependency Inversion Principle

Identify deviations.

Explain why they matter.

---

# Module Boundaries

Review module responsibilities.

Determine whether responsibilities are leaking between modules.

Examples:

Controllers performing business logic

Repositories performing validation

Services making HTTP responses

Middleware performing database queries

Move responsibilities to the correct layer.

---

# Controller Review

Controllers should:

* receive requests
* call services
* return responses

Controllers should not:

* contain business logic
* contain Prisma queries
* perform transactions
* perform authorization decisions
* perform validation beyond request parsing

Refactor oversized controllers.

---

# Service Review

Review services for:

* excessive length
* duplicated workflows
* mixed responsibilities
* transaction management
* repeated conditionals

Split services where appropriate.

Extract reusable business logic.

---

# Repository Review

Repositories should own all database access.

Identify:

* direct ORM usage outside repositories
* duplicated queries
* inefficient queries
* inconsistent query patterns

Centralize database access.

---

# Validation Review

Review:

* Zod schemas
* DTOs
* request validation
* reusable validators

Extract duplicated validation logic into shared schemas.

Reject invalid input as early as possible.

---

# Middleware Review

Inspect middleware for:

* duplicated logic
* inconsistent authentication
* inconsistent authorization
* repeated validation
* logging duplication

Consolidate reusable middleware.

---

# Database Review

Review:

* model relationships
* indexes
* constraints
* migrations
* query performance

Do not introduce schema changes unless they provide measurable value.

---

# Performance Review

Look for:

* N+1 queries
* repeated queries
* inefficient joins
* unnecessary eager loading
* excessive memory usage
* repeated calculations
* duplicated API calls

Recommend optimizations.

Explain expected impact.

---

# Security Review

Verify:

* authentication
* authorization
* RBAC
* ownership validation
* sensitive data exposure
* audit logging
* secure file handling
* input validation

Do not weaken security while refactoring.

---

# API Consistency

Review:

* endpoint naming
* request structures
* response structures
* pagination
* filtering
* sorting
* status codes

Maintain backward compatibility.

Avoid breaking existing clients.

---

# Naming Consistency

Review:

* folders
* files
* classes
* interfaces
* enums
* DTOs
* services
* repositories
* variables

Use consistent naming conventions throughout the project.

---

# Dependency Review

Identify unnecessary dependencies.

Remove:

* unused packages
* duplicated utilities
* dead code
* unreachable code
* obsolete abstractions

Do not remove dependencies that are still actively used.

---

# Logging Review

Review application logging.

Ensure:

* meaningful log messages
* consistent log levels
* no duplicated logs
* no sensitive information

Improve observability where appropriate.

---

# Error Handling

Review:

* custom errors
* centralized error handling
* exception consistency
* HTTP responses

Eliminate duplicated error handling logic.

---

# File Organization

Review folder structure.

Ensure files are organized according to project conventions.

Avoid:

* oversized folders
* unrelated files grouped together
* inconsistent naming

---

# Technical Debt

Identify technical debt.

Examples:

* TODO comments
* duplicated code
* temporary fixes
* hardcoded values
* poor abstractions
* oversized classes
* tight coupling

Classify each item as:

* Low
* Medium
* High

Explain the reasoning.

---

# Refactoring Strategy

Implement changes incrementally.

For each improvement:

1. Explain the issue.
2. Explain why it matters.
3. Explain the proposed refactor.
4. Estimate implementation risk.
5. Apply the smallest effective change.

Avoid large rewrites.

---

# Risk Assessment

Before making changes identify:

Possible regressions

API compatibility

Database impact

Migration requirements

Testing requirements

Only proceed when risks are understood.

---

# Preserve Behavior

Never change:

Business rules

Authentication flow

Authorization logic

Database integrity

API contracts

Validation rules

unless explicitly requested.

The objective is structural improvement—not feature development.

---

# Completion Checklist

Refactoring is complete only when:

✅ No business behavior changed

✅ Duplicate logic reduced

✅ Module boundaries strengthened

✅ Architecture improved

✅ Readability improved

✅ Maintainability improved

✅ Performance maintained or improved

✅ Existing APIs preserved

✅ Existing tests continue to pass

✅ No unnecessary abstractions introduced

---

# Expected Deliverables

Produce:

## Refactoring Summary

High-level overview of improvements.

---

## Issues Identified

List every issue discovered.

Include severity.

---

## Changes Applied

Explain each refactoring.

Include affected files.

---

## Risks

Document any remaining risks.

---

## Technical Debt Remaining

List technical debt intentionally left untouched.

Explain why.

---

## Recommendations

Suggest future improvements without implementing them.

---

# Engineering Philosophy

Refactoring should make the codebase simpler—not more complicated.

Every change should have a clear justification.

When in doubt:

* reduce complexity
* remove duplication
* strengthen module boundaries
* improve readability
* preserve behavior

Leave the codebase cleaner than you found it.

Measure success not by the amount of code changed, but by the amount of complexity removed.
