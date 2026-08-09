# PocketBase Chat Integration

# Phase 1 — PocketBase Real-time Chat

## Role

Act as a **Senior Staff Backend Engineer, Software Architect, Realtime Systems Engineer, and Security Engineer**.

Before implementing anything, review the following project documents:

- docs/prompts/00_Project_Onboarding.md
- docs/prompts/01_Feature_Playbook.md
- docs/checklists/Feature_Checklist.md
- docs/checklists/API_Checklist.md
- docs/checklists/Security_Checklist.md
- docs/architecture/MyJudicial_Master_Build_Reference.md
- docs/architecture/AUDIT_REPORT.md
- docs/architecture/IMPLEMENTATION_ROADMAP.md

Your first responsibility is to understand the current communication and booking architecture.

Do not immediately write code.

---

# Existing Code Review

Inspect the implementation of:

- Authentication
- Users
- Expert Profiles
- Booking
- Consultation
- File Storage
- Notifications
- Audit Logs
- Middleware
- Authorization
- Existing Socket/WebSocket code (if any)

Determine:

- reusable modules
- reusable middleware
- reusable validation
- reusable repositories
- duplicated communication logic

Do not introduce duplicate functionality.

---

# Objective

Implement a secure, scalable, real-time communication system powered by PocketBase Realtime.

The chat system should enable communication between clients and experts before, during, and after consultations while respecting booking permissions and privacy.

The implementation should integrate seamlessly with:

- Authentication
- Booking
- File Storage
- Notifications
- Admin
- Analytics

---

# Architecture

Follow:

- Domain-Driven Design
- Repository Pattern
- Service Layer
- Clean Architecture

Controllers remain thin.

Business logic belongs inside services.

Repositories own persistence.

PocketBase should act only as the realtime transport layer.

Business rules must never depend directly on PocketBase.

---

# Module

Create or extend:

```

src/modules/chat

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
providers/
types/
utils/

```

PocketBase integration should live inside:

```

providers/

```

to allow replacing it in the future.

---

# Conversation Types

Support:

Private Consultation

Support Chat (future)

System Conversation (future)

Group Consultation (future)

Do not hardcode conversation types.

---

# Conversation Rules

Clients may only chat with experts when:

- booking exists

AND

- booking is confirmed

OR

- consultation has started

Administrators may participate only where authorized.

Experts cannot initiate conversations with unrelated users.

---

# Conversation Lifecycle

Booking Created

↓

Conversation Created

↓

Participants Added

↓

Realtime Messaging Enabled

↓

Consultation Ends

↓

Conversation Archived

Conversations should remain readable after completion.

---

# Participants

Support:

Client

Expert

Administrator (future)

Moderator (future)

Future-proof for multiple participants.

---

# Messages

Support:

Text

Emoji

Images

PDF

Word Documents

Future:

Voice Notes

Video

Location

Contacts

Stickers

---

# File Attachments

Reuse the existing File Storage module.

Do not duplicate upload logic.

Support configurable file size limits.

Validate MIME types.

Store attachment metadata separately.

---

# Message Metadata

Track:

Sender

Conversation

Timestamp

Edited

Deleted

Read

Delivered

Pinned (future)

Forwarded (future)

---

# Read Receipts

Support:

Sent

Delivered

Read

Unread count

Read timestamps

---

# Typing Indicators

Support:

Typing Started

Typing Stopped

Automatically expire typing events.

Do not persist typing status.

---

# Message Editing

Allow editing within a configurable time window.

Edited messages should indicate they were modified.

Track:

Edited At

Edited By

---

# Message Deletion

Support:

Delete for Me

Delete for Everyone (time-limited)

Soft delete preferred.

Avoid permanent deletion.

---

# Search

Support searching by:

Message text

Participant

Date

Conversation

Attachment type

Future-proof for full-text search.

---

# Notifications

Integrate with the Notification module.

Trigger notifications when:

New message

Mention (future)

Attachment received

Unread reminder

Do not notify users actively viewing the conversation.

---

# Presence

Support:

Online

Offline

Last Seen

Future:

Busy

In Consultation

Away

Presence should update automatically.

---

# Security

Users may access only conversations they participate in.

Prevent:

Unauthorized message access

Conversation enumeration

Message spoofing

IDOR vulnerabilities

Sensitive metadata exposure

Validate every message sender.

---

# Moderation

Administrators should be able to:

View conversations (where authorized)

Flag conversations

Suspend messaging

Export conversations

Moderation actions must be audited.

---

# Audit Logging

Log:

Conversation created

Participant added

Message sent

Message edited

Message deleted

Conversation archived

Reuse the Audit Logging module.

---

# API Endpoints

Create Conversation

POST

/api/v1/chat/conversations

---

List Conversations

GET

/api/v1/chat/conversations

---

Conversation Details

GET

/api/v1/chat/conversations/:id

---

Send Message

POST

/api/v1/chat/messages

---

Edit Message

PATCH

/api/v1/chat/messages/:id

---

Delete Message

DELETE

/api/v1/chat/messages/:id

---

Conversation Messages

GET

/api/v1/chat/conversations/:id/messages

---

Mark Read

POST

/api/v1/chat/messages/read

---

Typing Indicator

POST

/api/v1/chat/typing

---

# Response Example

```json
{
  "id": "",
  "conversationId": "",
  "senderId": "",
  "message": "Good afternoon, Counsel.",
  "type": "TEXT",
  "sentAt": "",
  "status": "DELIVERED"
}
```

Never expose:

Internal PocketBase IDs

Authentication tokens

Private user information

Internal moderation metadata

---

# Validation

Use Zod.

Validate:

Conversation ownership

Message length

Attachment size

Attachment type

Conversation state

Participant membership

Reject empty messages.

---

# Performance

Support:

Pagination

Infinite scrolling

Lazy loading

Cursor pagination

Efficient message retrieval

Avoid loading full conversations unnecessarily.

---

# PocketBase Integration

Use PocketBase Realtime only for:

Realtime subscriptions

Presence

Typing indicators

Delivery events

Do not store business logic inside PocketBase.

The backend remains the source of truth.

---

# Analytics

Track:

Messages sent

Active conversations

Average response time

Average consultation messages

Unread counts

Attachment usage

These metrics should integrate with the future Admin Analytics Dashboard.

---

# Future Extensibility

Design the architecture so it can later support:

Voice calls

Video consultations

Screen sharing

AI message summaries

AI translation

AI moderation

Message reactions

Pinned messages

Threaded replies

Voice transcription

Conversation export

Encrypted messaging

Multi-device synchronization

without major architectural changes.

---

# Deliverables

Produce:

1. Existing implementation review
2. Gap analysis
3. Refactoring recommendations
4. Conversation architecture
5. PocketBase provider abstraction
6. Repository layer
7. Service layer
8. Controllers
9. Routes
10. DTOs
11. Validation schemas
12. Presence implementation
13. Read receipt implementation
14. Typing indicator implementation
15. Attachment integration
16. Analytics integration
17. API documentation

Follow the Feature Playbook throughout the implementation.

Complete the Feature Checklist before considering the feature finished.

Run the Code Review prompt after implementation.

Run the Refactoring prompt after the review is complete.