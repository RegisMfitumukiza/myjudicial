# Frontend Tasks

## Purpose

This document tracks all remaining frontend work required to complete the MyJudicial platform.

It is the operational task list for frontend development.

Completed work should be reflected in `FEATURE_STATUS.md`, not here.

Backend implementation belongs in `BACKEND_TASKS.md`.

---

# Task Status Legend

| Status | Meaning |
|----------|----------|
| ⬜ Not Started |
| 🟡 In Progress |
| ⏸ Blocked |
| ✅ Complete |

---

# Current Frontend Tasks

## Authentication

Status: ⬜

Tasks

- Login page
- Registration
- OTP verification
- Magic Link flow
- Password reset
- Session management

---

## Client Dashboard

Status: 🟡 (core pages integrated against real backend data; a few items remain)

Tasks

- ✅ Dashboard home — real stats (active bookings/pending payments/upcoming sessions/documents),
  real upcoming sessions list, real recent-activity feed (notifications)
- ✅ My Bookings — real list; `/client/dashboard/book` is now the single canonical page
  (a duplicate at `/client/dashboard/bookings` with a hardcoded fake rating, a dead "Pay
  Now" button, and two links to non-existent routes was removed; nav links retargeted)
- ✅ Consultation detail — real booking detail, cancel, join (pre-existing)
- ✅ Documents — real list/download/delete (upload deferred: needs client-side encryption design,
  same as expert dashboard)
- ✅ Payments — real payment history derived from `GET /bookings` (no dedicated payments-list
  endpoint exists; this was reused rather than adding a duplicate one)
- ✅ Notifications — real feed against the new notifications module (list, unread count, mark
  read/read-all)
- ✅ Messages — real conversations + message thread, shared `MessagesPanel` component with the
  expert dashboard (REST, not real-time/websocket)
- ✅ Settings — real preferred-language update, shared `LanguageSettingsCard` component with the
  expert dashboard
- ✅ Profile — real session data (pre-existing)
- ✅ Review submission — real rating/comment form on completed consultations, wired to
  `POST /bookings/:id/review`
- 🗑 Removed 17 orphaned/unreachable pages that were leftover generic-template scaffolding with
  no matching backend concept (billing, cases, financials, intake, join, lawyer, legal-matter,
  orders, projects, purchases, password, verify, ai-saved, booking-requests, compliance, docs)
  and a dead unused `photo-upload.tsx`
- ⬜ AI Plan (`ai-plan`) — no AI Triage backend exists yet; page left as a stub, out of scope
- ⬜ Scope (`scope`) — no matching backend concept; left as-is, not wired, candidate for removal
  in a future pass
- ⬜ Public display of reviews on expert profiles/listings (review submission is done; showing
  existing reviews to other users was not in this pass's scope)

---

## Expert Dashboard

Status: 🟡 (core pages integrated against real backend data; a few items remain)

Tasks

- ✅ Expert profile (pre-existing, real)
- ✅ Dashboard home — real stats/earnings/compliance-alerts/booking queue, real availability toggle
- ✅ Availability management — real weekly schedule editor
- ✅ Compliance status — shown on Verification page, backed by real `GET /experts/compliance`
- ✅ Verification submission — real document upload to `POST /experts/verification/submit`
- ✅ Booking Requests — real pending bookings, real decline action
- ✅ My Consultations — real tabbed Upcoming/Past/Cancelled
- ✅ My Meetings — real joinable-bookings list; "Join Call" now navigates to a real
  in-app LiveKit video room (`expert/dashboard/consultations/[id]/join`, reusing the
  citizen `ConsultationRoom` component) instead of issuing a token and showing a toast
- ✅ Documents — real list/download/delete (upload deferred: needs client-side encryption design)
- ✅ Messages — real conversations + message thread (REST, not real-time/websocket)
- ✅ Settings — real preferred-language update
- ✅ Services — every expert now gets an auto-created default "Consultation" service at
  profile creation (see `ARCHITECTURE_DECISIONS.md` Decision 24); Services page shows a
  "Default" badge on it; dashboard home nudges the expert to add more once they only have
  the default one; "Getting Started" checklist fixed to read the real onboarding-progress
  response shape instead of fields that never existed
- 🗑 Removed the orphaned duplicate `/expert/services` page and its unused, silently-failing
  create-service hooks (dead code, not linked from any navigation)
- ⬜ Earnings (dedicated page) / Analytics — real backend data exists (`GET /experts/earnings`, `GET /experts/statistics`) but the dedicated `earnings`/`analytics` pages are orphaned from the dashboard nav and were not in this pass's scope
- ⬜ Reviews (dedicated expert-facing view)
- ⬜ Subscription & Billing — no backend concept exists; nav item left as a stub
- ⬜ Notifications — backend endpoint now exists (`GET /notifications`, built for the client
  dashboard); expert dashboard nav item still not wired to it — follow-up item

---

## Client Dashboard

Status: ⬜

Tasks

- Search experts
- Booking history
- Payments
- Messages
- Reviews

---

## Map Search

Status: ⬜

Tasks

- Interactive map
- Expert markers
- Filters
- Nearby search
- Expert popup

---

## Booking Flow

Status: ✅ Complete (was stale — this section pre-dated the pages below and was never
updated once they were built)

Tasks

- ✅ Booking wizard — `/lawyers/[id]/book` (full-page, real month calendar + slot grid)
  and `<BookingModal>` (3-step modal opened from expert profile pages) both create real
  bookings via `POST /bookings`
- ✅ Calendar / time selection — real slots from `GET /bookings/expert/:id/slots`, now
  sized to the selected service's duration instead of a hardcoded 30 minutes
- ✅ Confirmation — `/bookings/success|failed` pages, now actually reachable (the backend
  payment callback previously always redirected to the dashboard regardless of outcome)
- ✅ Cancellation — real cancel flow on the consultation detail page, refund percentage
  handled server-side by cancellation timing
- 🗑 Removed the orphaned `/lawyers/[id]/book/confirm` mock page (hardcoded fake data,
  "IremboPay" branding, no inbound links, dead code)
- ⬜ `booking-modal.tsx`'s date/time picker is a separate hand-rolled implementation from
  `/lawyers/[id]/book`'s calendar — not unified into one shared component (not in this
  pass's scope)

---

## Payments

Status: ⬜

Tasks

- Checkout
- Escrow status
- Payment history
- Receipt downloads

---

## Review & Rating System

Status: ⬜

Tasks

- Review form
- Rating component
- Review list
- Edit review
- Delete review

---

## PocketBase Chat

Status: ⬜

Tasks

- Conversation list
- Chat window
- Typing indicator
- Attachments
- Notifications

---

## WhatsApp Notifications

Status: ⬜

Tasks

- Notification preferences
- Delivery status
- Message history

---

## Admin Dashboard

Status: ⬜

Tasks

- Analytics dashboard
- Charts
- User management
- Expert management
- Reports

---

## AI Assistant

Status: ⬜

Tasks

- Chat interface
- AI recommendations
- Voice input
- AI history

---

## Shared Components

Status: ⬜

Tasks

- Tables
- Cards
- Forms
- Dialogs
- Data grids
- Loading states
- Error states
- Empty states

---

## OpenAPI Integration

Status: ⬜

Tasks

- Generate Orval client
- API hooks
- Replace mock APIs
- Remove duplicate types
- Synchronize API models

---

## Testing

Status: ⬜

Tasks

- Component tests
- Integration tests
- Accessibility
- Responsive testing

---

# Maintenance

Remove completed tasks periodically.

Do not track backend implementation here.

---

# Related Documents

- FEATURE_STATUS.md
- BACKEND_TASKS.md
- FRONTEND_BACKEND_SYNC.md
- OPENAPI_WORKFLOW.md

---

# Guiding Principle

> FRONTEND_TASKS.md tracks remaining frontend implementation work. Once completed, update FEATURE_STATUS.md and remove or archive completed tasks during project maintenance.