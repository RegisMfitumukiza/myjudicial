# MyJudicial AI Development Prompt Library

## Purpose

This directory contains a structured Prompt Library used to guide AI coding agents (Cursor, OpenAI Codex, Claude Code, Windsurf, GitHub Copilot Agent, etc.) during the development of the MyJudicial platform.

The goal of this library is to ensure that every AI-generated implementation is:

* Consistent with the project architecture.
* Based on the project's source of truth.
* Free from duplicated functionality.
* Modular and maintainable.
* Production-ready.
* Secure by design.
* Scalable for future growth.

These prompts are not generic coding prompts. They are engineering playbooks that define how AI agents should analyze, implement, review, and improve the codebase.

---

# Project References

Before implementing any feature, AI agents should review the following documents in order:

1. `docs/architecture/MyJudicial_Master_Build_Reference.md`
2. `docs/architecture/AUDIT_REPORT.md`
3. `docs/architecture/IMPLEMENTATION_ROADMAP.md`
4. `docs/architecture/CHANGELOG.md` (when applicable)

These documents are considered the project's source of truth.

If the implementation differs from these documents, the AI should explain the discrepancy before making any changes.

---

# Development Workflow

Every feature implementation should follow the same workflow.

```text
Project Audit
      ↓
Architecture Review
      ↓
Existing Code Discovery
      ↓
Gap Analysis
      ↓
Implementation Plan
      ↓
Implementation
      ↓
Verification
      ↓
Code Review
      ↓
Refactoring (if necessary)
      ↓
Update Documentation
```

AI agents should never skip directly to implementation without first understanding the existing codebase.

---

# Prompt Library Structure

```text
docs/prompts/

README.md

00_Project_Audit.md

01_Feature_Implementation_Template.md

02_Code_Review.md

03_Refactoring.md

phase-1/
phase-2/
phase-3/
phase-4/
```

---

# Prompt Categories

## Foundation Prompts

These prompts establish project understanding before any feature work begins.

* Project Audit
* Feature Implementation Template
* Code Review
* Refactoring

---

## Feature Prompts

Each feature prompt focuses on implementing one production-ready capability while integrating with the existing architecture.

Examples include:

* Review & Rating System
* WhatsApp Cloud API
* PocketBase Chat
* Admin Analytics Dashboard
* AI Triage
* Vector Search

---

# Engineering Principles

All prompts assume the following architectural principles:

* Domain-Driven Design (DDD)
* Clean Architecture
* Repository Pattern
* Service Layer
* Thin Controllers
* Centralized Error Handling
* Zod Validation
* TypeScript Strict Mode
* Dependency Injection where appropriate
* Modular Design
* Reusable Components
* Single Responsibility Principle

---

# AI Agent Responsibilities

Before writing code, every AI agent should:

1. Read the project architecture documents.
2. Inspect the existing implementation.
3. Identify reusable modules.
4. Identify related services.
5. Identify related repositories.
6. Identify existing validation schemas.
7. Identify middleware that should be reused.
8. Explain the implementation strategy.
9. Avoid introducing duplicate functionality.

If similar functionality already exists, it should be extended or refactored rather than rewritten.

---

# Implementation Rules

Every implementation should:

* Follow the established folder structure.
* Preserve existing architecture.
* Reuse existing modules whenever possible.
* Avoid unnecessary abstractions.
* Keep controllers thin.
* Keep business logic inside services.
* Keep database access inside repositories.
* Use centralized validation.
* Use centralized error handling.
* Use existing utilities before creating new ones.

---

# Security Expectations

Every implementation should consider:

* Authentication
* Authorization
* RBAC
* Ownership validation
* Input validation
* Secure file handling
* Sensitive data protection
* Rate limiting
* Audit logging

Security is considered part of every feature, not a separate task.

---

# Quality Standards

A feature is considered complete only when:

* TypeScript compiles successfully.
* Linting passes.
* The project builds successfully.
* Validation is implemented.
* Error handling is centralized.
* Authorization is enforced.
* Existing functionality is not broken.
* No duplicate logic has been introduced.
* Documentation is updated if required.

---

# Review Before Completion

Before considering any task complete, the AI agent should verify:

* Architecture consistency.
* Business rule compliance.
* API consistency.
* Database integrity.
* Performance considerations.
* Security considerations.
* Scalability.
* Maintainability.

---

# Philosophy

The objective of this Prompt Library is not simply to generate code.

Its purpose is to ensure that AI contributes to the project in the same disciplined manner as an experienced software engineer—understanding the system first, making incremental changes, preserving architectural integrity, and delivering maintainable, production-quality solutions.
