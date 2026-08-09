# Review & Rating System

# Phase 1 — Review & Rating System

## Role

Act as a **Senior Staff Backend Engineer, Software Architect, Product Engineer, and Code Reviewer**.

Before writing any code, review the following project documents:

- docs/prompts/00_Project_Onboarding.md
- docs/prompts/01_Feature_Playbook.md
- docs/checklists/Feature_Checklist.md
- docs/checklists/API_Checklist.md
- docs/checklists/Security_Checklist.md
- docs/architecture/MyJudicial_Master_Build_Reference.md
- docs/architecture/AUDIT_REPORT.md
- docs/architecture/IMPLEMENTATION_ROADMAP.md

Your first responsibility is to understand the current implementation.

Do not immediately create new code.

---

# Existing Code Review

Review the current codebase and determine whether review-related functionality already exists.

Inspect:

- Prisma schema
- Booking module
- Expert module
- Authentication
- Users
- Notifications
- Administration
- Statistics
- Existing API routes
- Middleware
- Validation schemas

Determine:

- what already exists
- what is reusable
- what should be refactored
- what should not be duplicated

Reuse existing implementations whenever possible.

---

# Objective

Implement the complete Review & Rating System.

The system should allow verified clients to review experts after completed consultations.

The implementation should improve trust across the platform while preventing fraudulent or abusive reviews.

The feature should integrate seamlessly with:

- Booking
- Expert Profiles
- Notifications
- Analytics
- Administration

---

# Business Requirements

Clients may review an expert only after:

- booking exists
- booking is completed
- payment is completed
- consultation occurred

Reviews must never be allowed before a consultation finishes.

---

Every completed booking may receive only one review.

A client may edit their review within a configurable time window.

After that period, editing is locked.

---

Experts cannot review themselves.

Experts cannot review clients.

Administrators cannot create reviews.

---

Anonymous reviews are not allowed.

Every review is linked to:

- client
- booking
- expert

---

# Architecture

Follow:

- Domain-Driven Design
- Repository Pattern
- Service Layer
- Clean Architecture

Controllers remain thin.

Repositories own database access.

Services own business rules.

---

# Module

Create or extend:

```

src/modules/reviews

```

Structure:

```

controllers/
services/
repositories/
routes/
schemas/
dto/
middleware/
types/

```

Reuse existing shared utilities whenever possible.

---

# Database Review

Inspect the Prisma schema.

If review tables already exist:

Refactor instead of recreating.

If missing, recommend an appropriate schema.

Example entities:

Review

ReviewReport

ReviewReaction (future)

ReviewModerationLog

Only create models that are necessary.

---

# Review Fields

Support:

- title
- comment
- rating
- bookingId
- expertId
- clientId

Metadata:

- createdAt
- updatedAt
- editedAt
- moderatedAt

---

Rating

Support:

1

2

3

4

5

Reject values outside this range.

---

# Review Status

Support:

PENDING

PUBLISHED

HIDDEN

FLAGGED

REMOVED

Future-proof the architecture for additional moderation states.

---

# Review Workflow

Completed Booking

↓

Client submits review

↓

Validation

↓

Persist review

↓

Update expert rating

↓

Notify expert

↓

Publish review

---

# Expert Rating

Maintain aggregated statistics.

Store:

Average Rating

Total Reviews

Five-Star Count

Four-Star Count

Three-Star Count

Two-Star Count

One-Star Count

Avoid recalculating all reviews on every request.

Use efficient aggregation.

---

# Editing Reviews

Clients may edit only their own review.

Support configurable edit window.

Example:

7 days

After expiration:

Editing is rejected.

---

# Deleting Reviews

Clients may delete only within the edit window.

Administrators may hide reviews instead of deleting them.

Avoid permanent deletion whenever possible.

---

# Review Moderation

Administrators should be able to:

Hide review

Restore review

Flag review

Remove inappropriate content

Store moderation history.

---

# Review Reporting

Users should report reviews.

Reasons include:

Spam

Harassment

Offensive Language

Fake Review

Other

Reports should not automatically hide reviews.

Administrators decide moderation.

---

# Business Rules

Only completed bookings can generate reviews.

One review per booking.

Only verified clients may review.

Experts cannot review themselves.

Reviews cannot be transferred.

Ratings cannot exist without comments.

Reject empty comments.

---

# Notifications

Trigger notifications when:

Review created

Review updated

Review hidden

Review restored

Reuse existing notification infrastructure.

---

# Expert Profile Integration

Expose:

Average Rating

Review Count

Recent Reviews

Rating Distribution

Do not expose hidden reviews.

---

# Analytics Integration

Track:

Reviews Created

Average Rating

Reviews Per Month

Top Rated Experts

Most Reviewed Experts

Future dashboards should reuse these metrics.

---

# API Endpoints

Create Review

POST

/api/v1/reviews

---

Update Review

PATCH

/api/v1/reviews/:id

---

Delete Review

DELETE

/api/v1/reviews/:id

---

List Reviews

GET

/api/v1/reviews

---

Expert Reviews

GET

/api/v1/experts/:id/reviews

---

Report Review

POST

/api/v1/reviews/:id/report

---

Admin Moderation

PATCH

/api/v1/admin/reviews/:id

---

# Response Example

```json
{
  "id": "",
  "rating": 5,
  "title": "Excellent legal guidance",
  "comment": "Professional and responsive.",
  "createdAt": "",
  "client": {
    "id": "",
    "fullName": ""
  }
}
```

Never expose:

- emails
- phone numbers
- authentication data
- internal moderation notes

---

# Validation

Use Zod.

Validate:

rating

comment

title

review ownership

booking ownership

booking completion

edit window

---

# Middleware

Reuse existing middleware whenever possible.

Examples:

authenticate()

authorize()

validate()

ownership()

Do not duplicate middleware.

---

# Performance

Support:

Pagination

Sorting

Newest

Oldest

Highest Rating

Lowest Rating

Filter by:

Rating

Date

Expert

Client

Avoid N+1 queries.

---

# Security

Prevent:

Duplicate reviews

Review spam

Unauthorized edits

Unauthorized deletion

IDOR vulnerabilities

Mass assignment

Sensitive data exposure

---

# Future Extensibility

Design the architecture so it can later support:

Review reactions

Expert replies

AI sentiment analysis

AI moderation

Pinned reviews

Verified purchase badges

Review attachments

Review translation

Without major refactoring.

---

# Deliverables

Produce:

1. Existing implementation review
2. Gap analysis
3. Refactoring recommendations
4. Prisma improvements
5. Repository layer
6. Service layer
7. Controllers
8. Routes
9. DTOs
10. Validation schemas
11. Middleware
12. Aggregation strategy
13. Moderation workflow
14. API documentation

Follow the Feature Playbook throughout the implementation.

Complete the Feature Checklist before considering the feature finished.

Run the Code Review prompt after implementation.

Run the Refactoring prompt after the review is complete.