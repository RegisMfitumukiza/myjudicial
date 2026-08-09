# WhatsApp Cloud API Integration

# Phase 1 — WhatsApp Cloud API Integration

## Role

Act as a **Senior Staff Backend Engineer, Integration Architect, Software Architect, and Security Engineer**.

Before implementing anything, review the following project documents:

- docs/prompts/00_Project_Onboarding.md
- docs/prompts/01_Feature_Playbook.md
- docs/checklists/Feature_Checklist.md
- docs/checklists/API_Checklist.md
- docs/checklists/Security_Checklist.md
- docs/architecture/MyJudicial_Master_Build_Reference.md
- docs/architecture/AUDIT_REPORT.md
- docs/architecture/IMPLEMENTATION_ROADMAP.md

Your first responsibility is to understand the existing notification architecture.

Do not immediately write code.

---

# Existing Code Review

Inspect the current implementation of:

- Notification module
- Email service
- Authentication
- OTP
- Magic Link
- Booking
- Payments
- Consultation
- BullMQ (if present)
- Background jobs
- Configuration
- Logging
- Middleware

Determine:

- what already exists
- reusable notification services
- reusable queue infrastructure
- reusable templates
- duplicated logic
- refactoring opportunities

Do not duplicate existing notification logic.

---

# Objective

Integrate the Meta WhatsApp Cloud API into MyJudicial.

The integration should support secure, reliable, and scalable WhatsApp messaging for transactional notifications.

The implementation should become the primary WhatsApp communication layer across the platform.

---

# Architecture

Follow:

- Domain-Driven Design
- Repository Pattern
- Service Layer
- Clean Architecture

Controllers remain thin.

External API communication belongs inside services.

Business logic remains separate from infrastructure.

---

# Module

Create or extend:

```
src/modules/whatsapp
```

Suggested structure:

```
controllers/
services/
repositories/
routes/
dto/
schemas/
middleware/
providers/
templates/
types/
utils/
```

Reuse existing shared services whenever possible.

---

# Provider

Use:

Meta WhatsApp Cloud API

Design the provider so it can later support:

- Twilio
- Infobip
- Africa's Talking
- Vonage

without changing business logic.

---

# Authentication

Support secure configuration using environment variables.

Example:

WHATSAPP_ACCESS_TOKEN

WHATSAPP_PHONE_NUMBER_ID

WHATSAPP_BUSINESS_ACCOUNT_ID

WHATSAPP_VERIFY_TOKEN

Never hardcode credentials.

---

# Webhook Verification

Implement Meta webhook verification.

Support:

GET verification endpoint

POST webhook endpoint

Verify signatures where applicable.

Reject invalid webhook requests.

---

# Supported Messages

Implement:

Text messages

Template messages

Authentication messages

Utility notifications

Future-proof for:

Media

Documents

Location

Interactive buttons

Lists

Flows

---

# Initial Use Cases

Support WhatsApp notifications for:

Authentication

- OTP
- Magic Link confirmation

Bookings

- Booking confirmed
- Booking cancelled
- Booking rescheduled
- Consultation reminder

Payments

- Payment received
- Escrow funded
- Escrow released
- Refund completed

Reviews

- Review request
- Review received

Administration

- Compliance approved
- Compliance rejected

---

# Template Management

Separate template definitions from business logic.

Store template identifiers centrally.

Example:

OTP_TEMPLATE

BOOKING_CONFIRMATION_TEMPLATE

PAYMENT_SUCCESS_TEMPLATE

REVIEW_REQUEST_TEMPLATE

Avoid hardcoding template names throughout the codebase.

---

# Queue Processing

Do not send WhatsApp messages synchronously.

Use background jobs.

If BullMQ already exists:

Reuse it.

Otherwise:

Design the architecture so queue integration can be added later without major refactoring.

---

# Retry Strategy

Implement configurable retries.

Retry only transient failures.

Examples:

Rate limits

Network errors

Temporary Meta outages

Do not retry permanent failures.

---

# Delivery Status

Track:

Queued

Sent

Delivered

Read

Failed

Expired

Persist delivery status if the current schema supports it.

---

# Webhook Events

Handle:

message_sent

message_delivered

message_read

message_failed

Store useful metadata.

Ignore unknown events gracefully.

---

# Business Rules

Only authenticated workflows may trigger protected notifications.

Users may receive WhatsApp notifications only if:

- phone number verified
- opted in (future support)

Prevent duplicate notifications.

---

# Error Handling

Create domain-specific errors where appropriate.

Examples:

WhatsAppConfigurationError

WhatsAppDeliveryError

WebhookVerificationError

TemplateNotFoundError

Use centralized error handling.

---

# API Endpoints

Send Test Message

POST

/api/v1/whatsapp/test

---

Webhook Verification

GET

/api/v1/whatsapp/webhook

---

Webhook Receiver

POST

/api/v1/whatsapp/webhook

---

Template List (Admin)

GET

/api/v1/admin/whatsapp/templates

---

# Validation

Use Zod.

Validate:

Phone numbers

Template identifiers

Webhook payloads

Outgoing requests

Reject invalid phone formats.

---

# Logging

Log:

Outgoing messages

Incoming webhook events

Delivery failures

Retry attempts

Do not log:

Access tokens

Verification tokens

Sensitive message content

---

# Security

Protect all administrative endpoints.

Verify webhook authenticity.

Prevent replay attacks where applicable.

Never expose credentials.

Rate-limit public endpoints.

---

# Performance

Queue outbound messages.

Avoid blocking HTTP requests.

Support batching in future.

Avoid duplicate API calls.

---

# Monitoring

Track:

Messages sent

Delivery success rate

Delivery failures

Average delivery time

Webhook processing errors

Retry count

These metrics should integrate with the future Admin Analytics Dashboard.

---

# Future Extensibility

Design the architecture so it can later support:

- Marketing campaigns
- Scheduled messages
- Broadcast messaging
- Rich media
- Interactive buttons
- WhatsApp Flows
- Customer support conversations
- Multi-provider failover

without major architectural changes.

---

# Deliverables

Produce:

1. Existing implementation review
2. Gap analysis
3. Refactoring recommendations
4. WhatsApp provider abstraction
5. Service layer
6. Queue integration
7. Webhook implementation
8. Controllers
9. Routes
10. DTOs
11. Validation schemas
12. Template management
13. Logging strategy
14. Monitoring strategy
15. API documentation

Follow the Feature Playbook throughout the implementation.

Complete the Feature Checklist before considering the feature finished.

Run the Code Review prompt after implementation.

Run the Refactoring prompt after the review is complete.