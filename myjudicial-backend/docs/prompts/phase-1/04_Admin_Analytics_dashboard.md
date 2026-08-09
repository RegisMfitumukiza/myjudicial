# Admin Analytics Dashboard
# Phase 1 — Admin Analytics Dashboard

## Role

Act as a **Senior Staff Backend Engineer, Data Engineer, Software Architect, and Technical Lead**.

Before implementing anything, review the following project documents:

- docs/prompts/00_Project_Onboarding.md
- docs/prompts/01_Feature_Playbook.md
- docs/prompts/02_Code_Review.md
- docs/prompts/03_Refactoring.md
- docs/checklists/Feature_Checklist.md
- docs/checklists/API_Checklist.md
- docs/checklists/Security_Checklist.md
- docs/architecture/MyJudicial_Master_Build_Reference.md
- docs/architecture/AUDIT_REPORT.md
- docs/architecture/IMPLEMENTATION_ROADMAP.md

Your first responsibility is to understand the existing platform modules and reporting capabilities.

Do not immediately implement new code.

---

# Existing Code Review

Inspect the current implementation of:

- Users
- Authentication
- Experts
- Compliance
- Bookings
- Consultations
- Reviews
- Payments
- Escrow
- Notifications
- WhatsApp
- Chat
- Audit Logs
- Statistics
- Existing Admin module
- Prisma schema

Determine:

- existing statistics
- reusable repositories
- reusable services
- duplicated queries
- reusable DTOs
- reusable validation

Do not introduce duplicate reporting logic.

---

# Objective

Implement a scalable Admin Analytics Dashboard that provides administrators with real-time operational insights into the MyJudicial platform.

The dashboard should aggregate data across all major modules while remaining performant, secure, and extensible.

The dashboard should become the central reporting interface for platform administration.

---

# Architecture

Follow:

- Domain-Driven Design
- Repository Pattern
- Service Layer
- Clean Architecture

Controllers remain thin.

Repositories own database queries.

Services aggregate business metrics.

Analytics queries should be centralized.

---

# Module

Create or extend:

```
src/modules/admin-analytics
```

Structure:

```
controllers/
services/
repositories/
routes/
dto/
schemas/
middleware/
types/
cache/
```

Reuse existing modules wherever possible.

---

# Dashboard Sections

The dashboard should provide the following sections.

## Platform Overview

Display:

- Total Users
- Total Clients
- Total Experts
- Verified Experts
- Active Experts
- Suspended Experts
- New Users Today
- New Users This Month

---

## Booking Analytics

Display:

- Total Bookings
- Pending Bookings
- Confirmed Bookings
- Completed Bookings
- Cancelled Bookings
- Booking Success Rate
- Average Bookings Per Day
- Peak Booking Hours

---

## Consultation Analytics

Display:

- Total Consultations
- Completed Consultations
- Average Consultation Duration
- Upcoming Consultations
- Missed Consultations

---

## Revenue Analytics

Display:

- Total Revenue
- Revenue This Month
- Revenue Today
- Escrow Balance
- Released Escrow
- Pending Escrow
- Refund Total
- Platform Fees

Support filtering by:

- day
- week
- month
- year
- custom range

---

## Expert Analytics

Display:

- Total Experts
- Available Experts
- Online Experts
- Top Rated Experts
- Most Reviewed Experts
- Most Booked Experts
- Highest Revenue Experts
- Compliance Status Distribution

---

## Client Analytics

Display:

- Total Clients
- Active Clients
- Returning Clients
- New Clients
- Client Retention Rate

---

## Review Analytics

Display:

- Average Platform Rating
- Reviews Submitted
- Reviews Per Month
- Rating Distribution
- Flagged Reviews
- Hidden Reviews

---

## Communication Analytics

Display:

Chat:

- Active Conversations
- Messages Sent Today
- Average Response Time

WhatsApp:

- Messages Sent
- Delivery Rate
- Read Rate
- Failed Deliveries

Notifications:

- Notifications Sent
- Delivery Success

---

## Compliance Analytics

Display:

Pending Verification

Approved

Rejected

Expired

Annual Reverification Status

---

## System Health

Display:

API Requests

Average Response Time

Background Jobs

Queue Size

Failed Jobs

Storage Usage

Database Size (future)

---

# Time Filters

Support:

Today

Last 7 Days

Last 30 Days

Last 90 Days

This Year

Custom Date Range

Apply filters consistently across all dashboard widgets.

---

# Dashboard Widgets

Support reusable widgets.

Examples:

Metric Cards

Bar Charts

Pie Charts

Line Charts

Area Charts

Tables

Recent Activity

Avoid hardcoding widget implementations.

---

# Aggregation Strategy

Avoid running expensive aggregation queries for every request.

Implement reusable analytics services.

Prefer:

Cached aggregates

Grouped database queries

Precomputed statistics where appropriate

Avoid N+1 queries.

---

# Caching

Design a caching layer.

Support:

Redis (preferred)

Memory cache (fallback)

Cache expensive analytics.

Support configurable cache expiration.

---

# API Endpoints

Dashboard Summary

GET

/api/v1/admin/analytics/summary

---

Revenue Analytics

GET

/api/v1/admin/analytics/revenue

---

Booking Analytics

GET

/api/v1/admin/analytics/bookings

---

User Analytics

GET

/api/v1/admin/analytics/users

---

Expert Analytics

GET

/api/v1/admin/analytics/experts

---

Review Analytics

GET

/api/v1/admin/analytics/reviews

---

Communication Analytics

GET

/api/v1/admin/analytics/communications

---

Compliance Analytics

GET

/api/v1/admin/analytics/compliance

---

System Health

GET

/api/v1/admin/analytics/system

---

# Response Example

```json
{
  "summary": {
    "totalUsers": 1345,
    "totalExperts": 218,
    "activeExperts": 176,
    "totalBookings": 5284,
    "completedBookings": 5010,
    "platformRevenue": 82500000
  }
}
```

Never expose:

Personally identifiable information

Authentication data

Payment credentials

Private documents

Internal compliance notes

---

# Validation

Use Zod.

Validate:

Date ranges

Pagination

Sorting

Filtering

Aggregation parameters

Reject invalid ranges.

---

# Security

Only administrators may access analytics endpoints.

Enforce:

RBAC

Audit logging

Ownership where applicable

Never expose sensitive platform information.

---

# Performance

Implement:

Pagination

Caching

Efficient aggregation queries

Database indexes

Lazy loading

Avoid:

Large joins

Repeated aggregation

Full table scans

---

# Audit Logging

Log:

Dashboard access

Export requests

Failed authorization

Analytics generation failures

Reuse the existing Audit Logging module.

---

# Export Support

Design the architecture so administrators can later export analytics.

Future formats:

PDF

Excel

CSV

Do not implement exports yet.

Provide extension points.

---

# Monitoring

Track:

Dashboard load time

Cache hit rate

Analytics generation time

Failed queries

Slow queries

Future dashboards should monitor themselves.

---

# Future Extensibility

Design the architecture so it can later support:

Scheduled reports

Email reports

WhatsApp reports

Custom dashboards

Saved filters

Drill-down analytics

Real-time dashboards

Predictive analytics

AI-generated insights

Business intelligence integrations

without major architectural changes.

---

# Deliverables

Produce:

1. Existing implementation review
2. Gap analysis
3. Refactoring recommendations
4. Analytics architecture
5. Repository layer
6. Service layer
7. Controllers
8. Routes
9. DTOs
10. Validation schemas
11. Cache strategy
12. Aggregation strategy
13. Monitoring strategy
14. API documentation

Follow the Feature Playbook throughout the implementation.

Complete the Feature Checklist before considering the feature finished.

Run the Code Review prompt after implementation.

Run the Refactoring prompt after the review is complete.