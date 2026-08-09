# 🏛 MyJudicial.com — Master Build Reference

> **Version:** 1.0 — Consolidated from all project documents  
> **Project Runway:** 6 Weeks to MVP  
> **Target Market:** Rwanda (with East Africa expansion planned)  
> **Mission:** Expert legal help, accessible to everyone, everywhere, instantly.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [What Has to Be Built](#2-what-has-to-be-built)
3. [Full Technology Stack](#3-full-technology-stack)
4. [Infrastructure & Deployment Architecture](#4-infrastructure--deployment-architecture)
5. [Database Schema & Data Models](#5-database-schema--data-models)
6. [API Surface](#6-api-surface)
7. [Autonomous & Self-Healing Systems](#7-autonomous--self-healing-systems)
8. [Security Model](#8-security-model)
9. [Design System & Brand Identity](#9-design-system--brand-identity)
10. [Resource Allocation](#10-resource-allocation)
11. [Roadmap](#11-roadmap)

---

## 1. Product Overview

MyJudicial is a **two-sided legal marketplace** connecting citizens and businesses to nearby verified lawyers via an interactive geo-pinned map. It is built to operate in low-bandwidth environments, support Kinyarwanda voice input, and process payments in RWF via mobile money.

### Core Value Proposition

| Feature | Description |
|---------|-------------|
| Geo-pinned expert discovery | Find lawyers by office location on a live MapLibre map |
| Instant booking | No phone tag — select a slot and pay in one flow |
| Flat-fee transparent pricing | No surprise billing; RWF/TZS pricing via Azam Pay |
| Kinyarwanda AI triage | Voice or text intake processed locally with Whisper.cpp + Qwen 2.5 |
| Secure video consultation | Browser-based WebRTC via LiveKit, no app install required |
| Encrypted document vault | AES-256-GCM client-side encryption, stored on OCI Object Storage |
| Automated escrow | Funds held and auto-released after verified consultation completion |
| Expert credential enforcement | Automated compliance checks with map pin suspension on expiry |


---

## 2. What Has to Be Built

This is the complete build checklist grouped by system domain.

---

### 2.1 Authentication & User Management

- [ ] User registration (client + expert roles)
- [ ] Magic link / Email OTP login (Supabase Auth)
- [ ] JWT token issuance and refresh rotation
- [ ] Role-Based Access Control: `client | expert | admin`
- [ ] OAuth social login (Google / LinkedIn)
- [ ] Expert onboarding flow (credential upload, bar number, headshot)
- [ ] Google Drive / OneDrive OAuth scope for video recording passthrough
- [ ] Account suspension and reinstatement logic

---

### 2.2 Expert Discovery & Map Interface

- [ ] MapLibre GL JS map rendering with OpenStreetMap tiles
- [ ] PostGIS `ST_DWithin` geospatial radius queries
- [ ] Expert geo-pins with specialty tags and profile previews
- [ ] Filter bar: legal specialty, language, availability, price range, rating
- [ ] Browser GPS tracking ("Track My Location" button)
- [ ] Map pin visibility toggle (hidden when expert is `SUSPENDED_COMPLIANCE`)
- [ ] Hyper-local SEO static pages per expert pin
- [ ] `map_markers` table with `is_visible` flag

---

### 2.3 Booking Engine

- [ ] Available time slot display (synced from expert calendar)
- [ ] Service type selection (Discovery Call, Compliance Review, etc.)
- [ ] Flat-fee display before checkout
- [ ] Azam Pay payment initiation (Mobile Money)
- [ ] Booking state machine: `PENDING → CONFIRMED → ACTIVE → COMPLETED / CANCELLED / REFUNDED`
- [ ] Azam Pay MNO checkout (Mobile Money USSD push)
- [ ] Email confirmation (Brevo) + WhatsApp notification (Meta Cloud API)
- [ ] Cancellation policy and refund trigger


---

### 2.4 AI Triage Agent

- [ ] Conversational intake chat panel (anchored beside workspace)
- [ ] Microphone intake button with animated audio processing indicator
- [ ] Whisper.cpp speech-to-text (Kinyarwanda base checkpoint)
- [ ] Mozilla Common Voice (RW) + Digital Umuganda data integration
- [ ] Qwen 2.5 (1.5B Instruct) via Ollama for legal intent extraction
- [ ] Mbaza NLP Corpus loaded as vector store for Qwen context
- [ ] Structured JSON output: `{ jurisdiction, specialty, urgency_level, budget_range }`
- [ ] Cosine similarity matching against expert specialty embeddings
- [ ] Top-3 expert recommendations with booking CTAs
- [ ] Triage session history storage (`triage_sessions` table)
- [ ] Multilingual support: Kinyarwanda, English, French

---

### 2.5 Video Consultation Suite

- [ ] LiveKit WebRTC room creation on booking confirmation
- [ ] Signed room token generation (`POST /bookings/:id/join`)
- [ ] Browser-based video (no app install)
- [ ] AES-DTLS-SRTP encrypted media streams
- [ ] In-session text chat with document sharing
- [ ] Optional consent-gated session recording
- [ ] Video recording passthrough to lawyer's Google Drive / OneDrive (bypasses server storage)
- [ ] LiveKit webhook listener for session `COMPLETED` event
- [ ] Maximum session duration configurable per booking type (default 60 min)
- [ ] Connection quality monitoring with adaptive bitrate

---

### 2.6 Escrow & Payment System

- [ ] Azam Pay payment initiation at booking creation
- [ ] `escrow_ledger` table with states: `PENDING → LOCKED → HELD_IN_ESCROW → DISBURSED_TO_EXPERT`
- [ ] Escrow hold on payment confirmation
- [ ] Dual-verification release: LiveKit session webhook + minimum duration (≥ 300s)
- [ ] Automatic 85% payout to lawyer MoMo wallet (Azam Pay payout API)
- [ ] 15% platform commission retained
- [ ] Refund path for early termination / cancellation
- [ ] Retry logic on failed payout (`AUTONOMOUS_SETTLEMENT_RETRY_TRIGGERED`)
- [ ] PDF escrow receipt delivery via Brevo + WhatsApp
- [ ] Immutable escrow state audit trail


---

### 2.7 Document Vault

- [ ] AES-256-GCM client-side encryption before upload (zero-knowledge)
- [ ] Pre-signed OCI Object Storage upload URL endpoint
- [ ] Per-document access tokens with expiry timestamps
- [ ] Document listing, download (time-limited signed URL), share, delete
- [ ] Audit log on all access, downloads, and shares
- [ ] Supported types: PDF, DOCX, DOC, TXT, ODT, JPG, PNG, TIFF, XLSX, CSV, ZIP
- [ ] Case brief drag-and-drop upload zone in auth flow
- [ ] File verification state indicator (`text-brand-green` on success)

---

### 2.8 Expert Verification & Compliance

- [ ] 5-step expert onboarding: ID + headshot → bar certificate → format validation → manual review → background check
- [ ] Admin review queue with 72-hour SLA
- [ ] Verified badge applied on approval
- [ ] `credentials_expiry` field on `legal_experts` table
- [ ] Automated 30-day advance warning email via `pg_net` + Listmonk
- [ ] Auto-suspend on expiry (`account_status = 'SUSPENDED_COMPLIANCE'`)
- [ ] Map pin auto-hidden on suspension (`map_markers.is_visible = FALSE`)
- [ ] Annual re-verification trigger
- [ ] Complaint-triggered review suspension

---

### 2.9 Notifications & Messaging

- [ ] Brevo transactional email: OTP codes, magic links, booking confirmations, reminders, PDF receipts
- [ ] Meta WhatsApp Cloud API: quick reply buttons (Approve Escrow / Reject), list menus, media templates
- [ ] WhatsApp voice message → OCI Whisper.cpp → transcription + inference pipeline
- [ ] Push notifications for booking state changes
- [ ] Listmonk email automation for compliance warnings and platform newsletters
- [ ] PocketBase real-time in-app text messaging between client and lawyer

---

### 2.10 Admin Panel

- [ ] Expert verification workflow (review queue, approve/reject)
- [ ] Platform analytics dashboard
- [ ] Content moderation tools
- [ ] Booking dispute management
- [ ] Compliance override controls
- [ ] Expert account suspension / reinstatement


---

## 3. Full Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js (React) | SSR presentation engine, PWA, fast initial loading |
| Tailwind CSS | Responsive utility-first design system |
| shadcn/ui | Accessible components and layouts |
| MapLibre GL JS | Client-side map rendering, vector overlays, geo-pins |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js LTS | Primary API runtime |
| Express.js | Core routing, middleware, webhook handling |
| Zod | Input validation and type safety on all API inputs |
| Prisma ORM | Type-safe PostgreSQL access layer |

### Database & Cache
| Technology | Purpose |
|------------|---------|
| PostgreSQL 16 | Primary relational database |
| PostGIS | Geospatial extension — `ST_DWithin`, `ST_MakePoint`, GIST indexes |
| Supabase | Managed PostgreSQL + Row-Level Security + Auth |
| Redis | Session store, rate limiting, pub/sub |
| PocketBase | Isolated lightweight DB for real-time in-app chat |

### Authentication
| Technology | Purpose |
|------------|---------|
| Supabase Auth | JWT tokens, magic links, email OTP |
| Auth.js (NextAuth) | Passwordless auth workflows on Next.js frontend |
| RBAC | `client \| expert \| admin` role enforcement |

### AI & ML
| Technology | Purpose |
|------------|---------|
| Ollama | Local LLM container management on OCI |
| Qwen 2.5 (1.5B Instruct) | Legal intent extraction, multilingual JSON output |
| Whisper.cpp (Base) | CPU-optimized Kinyarwanda speech-to-text |
| Mbaza NLP Corpus | Vector store context layer for Qwen |
| Mozilla Common Voice (RW) | Kinyarwanda training / transcription data |
| Digital Umuganda Open Data | Kinyarwanda voice and text training data |
| NISR Spatial Data | Rwanda shapefiles loaded into PostGIS |

### Video & Real-Time
| Technology | Purpose |
|------------|---------|
| LiveKit | Open-source WebRTC server (hosted on OCI) |
| WebRTC (Pion) | Peer-to-peer encrypted video |
| PocketBase | Real-time in-app chat between client and lawyer |

### Payments & Financial
| Technology | Purpose |
|------------|---------|
| Azam Pay | Mobile Money (MNO) checkout, split payments, expert payouts, refunds |
| Escrow Ledger (PostgreSQL) | Immutable state-tracked payment holding |

### Communications
| Technology | Purpose |
|------------|---------|
| Brevo | Transactional email — OTP, confirmations, receipts |
| Meta WhatsApp Cloud API | Interactive messaging, voice routing, quick replies |
| Listmonk | Email automation, compliance warnings, newsletters |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker + Docker Compose | Containerization and local/production deployment |
| Vercel | Frontend hosting with global edge delivery |
| Google Cloud Run | Stateless backend API, scale-to-zero |
| Oracle Cloud Infrastructure (OCI) | AI compute, LiveKit, Whisper.cpp, Object Storage |
| Nginx Proxy Manager | Reverse proxy + SSL on OCI |
| Renovate | Automated dependency patch/minor updates |


---

## 4. Infrastructure & Deployment Architecture

### Multi-Cloud Layout

```
[ Citizen / Lawyer Browser or Mobile Device ]
                  │
                  ▼
         Vercel — Next.js Frontend
         (Global Edge, SSR, PWA)
                  │
                  ▼
     Google Cloud Run — Express.js API
     (Stateless, Docker, Scale-to-Zero)
                  │
     ┌────────────┼────────────────┐
     ▼            ▼                ▼
  Supabase    Oracle Cloud      Messaging
  (PostgreSQL  (Ollama/Qwen,    (Brevo Email,
   Auth, RLS)   Whisper.cpp,     WhatsApp,
                LiveKit,         Listmonk)
                OCI Storage)
                  │
               Redis (OCI)
               PocketBase (OCI)
```

### Environment Breakdown

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | `localhost:3000` / `localhost:8080` | Docker Compose, local dev |
| Staging | `staging.myjudicial.com` | QA and UAT before production |
| Production | `app.myjudicial.com` | Live platform |

### Docker Compose Services (Core)

| Service | Image | Restart Policy |
|---------|-------|----------------|
| `backend-api` | `myjudicial-backend:latest` | `always` (with healthcheck) |
| `db-spatial` | `postgis/postgis:16-3.4` | `unless-stopped` |
| `redis` | `redis:7-alpine` | `unless-stopped` |
| `pocketbase` | `ghcr.io/muchobien/pocketbase` | `unless-stopped` |
| `ollama` | `ollama/ollama` | `unless-stopped` |
| `livekit` | `livekit/livekit-server` | `unless-stopped` |
| `listmonk` | `listmonk/listmonk` | `unless-stopped` |
| `nginx-proxy` | `jc21/nginx-proxy-manager` | `unless-stopped` |

### OCI Anti-Eviction Strategy

OCI free tier reclaims idle instances. Mitigation:
- Cron jobs run lightweight tasks every 15 minutes
- CPU and memory usage kept above reclamation thresholds
- LiveKit and Ollama naturally consume baseline resources


---

## 5. Database Schema & Data Models

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | All platform users (clients and experts) |
| `legal_experts` | Extended expert profile, credentials, compliance status |
| `services` | Bookable service types per expert |
| `bookings` | Consultation appointments linking client, expert, service |
| `escrow_ledger` | Payment hold and disbursement state machine |
| `map_markers` | Geo-pin visibility and location per expert |
| `documents` | Metadata for encrypted vault files |
| `triage_sessions` | AI triage conversation history |
| `reviews` | Post-consultation ratings |
| `audit_logs` | All access events on documents and system actions |

### Key Schema Fragments

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  role          VARCHAR(20) CHECK (role IN ('client','expert','admin')),
  full_name     VARCHAR(255),
  phone         VARCHAR(20),
  language      VARCHAR(10) DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Experts
CREATE TABLE legal_experts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  bar_number          VARCHAR(100),
  specialties         TEXT[],
  location            GEOGRAPHY(POINT, 4326),
  office_address      TEXT,
  verified            BOOLEAN DEFAULT FALSE,
  account_status      VARCHAR(50) DEFAULT 'PENDING',
  credentials_expiry  DATE,
  avg_rating          NUMERIC(3,2),
  total_bookings      INTEGER DEFAULT 0,
  bio                 TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_experts_location ON legal_experts USING GIST(location);

-- Bookings
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES users(id),
  expert_id       UUID REFERENCES legal_experts(id),
  service_id      UUID REFERENCES services(id),
  status          VARCHAR(30),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER,
  price_rwf       NUMERIC(12,2),
  flw_tx_ref      VARCHAR(100),
  video_room_id   VARCHAR(100),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Escrow Ledger
CREATE TABLE escrow_ledger (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             VARCHAR(100) UNIQUE NOT NULL,
  booking_id          UUID REFERENCES bookings(id),
  lawyer_wallet_phone VARCHAR(20),
  total_fee_rwf       NUMERIC(12,2),
  status              VARCHAR(50) DEFAULT 'PENDING',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  settled_at          TIMESTAMPTZ
);
```

### Booking State Machine

```
PENDING → CONFIRMED → ACTIVE → COMPLETED
                    ↘ CANCELLED → REFUNDED
```

### Escrow State Machine

```
PENDING → LOCKED → HELD_IN_ESCROW → DISBURSED_TO_EXPERT
                 ↘ REFUNDED
```


---

## 6. API Surface

**Base URL:** `https://api.myjudicial.com/v1`  
**Auth:** Bearer JWT in `Authorization` header (except public search endpoints)

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create client or expert account |
| POST | `/auth/login` | Authenticate, returns access + refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Current authenticated user |

### Expert Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/experts` | List/search with geo-radius filters |
| GET | `/experts/:id` | Full expert profile |
| GET | `/experts/:id/services` | Bookable services for an expert |
| GET | `/experts/:id/slots` | Available slots for a date range |
| POST | `/experts/me` | Create own expert profile |
| PATCH | `/experts/me` | Update own expert profile |

**Query params:** `lat`, `lng`, `radius_km`, `specialty`, `lang`, `max_fee`, `page`, `limit`

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create booking + initiate Azam Pay Mobile Money payment |
| GET | `/bookings` | List bookings for authenticated user |
| GET | `/bookings/:id` | Booking details |
| PATCH | `/bookings/:id` | Reschedule or cancel |
| POST | `/bookings/:id/join` | Generate signed LiveKit room token |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Request pre-signed OCI upload URL |
| GET | `/documents` | List accessible documents |
| GET | `/documents/:id/download` | Time-limited signed download URL |
| POST | `/documents/:id/share` | Share with another user |
| DELETE | `/documents/:id` | Permanently delete |

### AI Triage

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/triage/sessions` | Start new triage session |
| POST | `/triage/sessions/:id` | Send next message |
| GET | `/triage/sessions/:id` | Full conversation history |
| GET | `/triage/sessions/:id/matches` | Expert matches after triage |

### Webhooks

| Event | Trigger |
|-------|---------|
| `booking.confirmed` | Azam Pay payment success |
| `booking.cancelled` | Either party cancels |
| `booking.completed` | LiveKit session ended |
| `expert.verified` | Admin approves credentials |
| `document.shared` | Document shared with user |
| `payment.refunded` | Azam Pay refund processed |
| `livekit.room.finished` | Triggers escrow release evaluation |

All webhook payloads are HMAC-SHA256 signed.


---

## 7. Autonomous & Self-Healing Systems

### A. Container Health & Crash Recovery

- `restart: always` on all critical services
- Docker healthcheck on `/api/health` every 30s
- Automatic container restart on failure (3 retries before alert)

### B. Automated Compliance Lifecycle (PostgreSQL + pg_net)

Runs daily via `pg_cron`:

```sql
-- Step 1: Warn 30 days before expiry
PERFORM net.http_post('http://listmonk-api:9000/api/tx', ...)
FROM legal_experts WHERE credentials_expiry = CURRENT_DATE + INTERVAL '30 days';

-- Step 2: Suspend expired experts
UPDATE legal_experts SET account_status = 'SUSPENDED_COMPLIANCE'
WHERE credentials_expiry <= CURRENT_DATE AND account_status = 'ACTIVE';

-- Step 3: Hide their map pins
UPDATE map_markers SET is_visible = FALSE
WHERE expert_id IN (SELECT id FROM legal_experts WHERE account_status = 'SUSPENDED_COMPLIANCE');
```

**Requires:** `pg_net` and `pg_cron` extensions (available on Supabase by default)

### C. Event-Driven Escrow Release

Triggered by LiveKit `room.finished` webhook:

1. Verify `x-livekit-signature` header
2. Check `status === 'COMPLETED'` and `duration_seconds >= 300`
3. Confirm escrow is `HELD_IN_ESCROW`
4. Initiate Azam Pay payout: 85% to lawyer MoMo wallet
5. Update ledger to `DISBURSED_TO_EXPERT`
6. On error: return `AUTONOMOUS_SETTLEMENT_RETRY_TRIGGERED` for queue retry

### D. Automated Dependency Maintenance (Renovate)

- Auto-merge patch updates to `dependencies` on Monday before 4am
- Auto-merge patch + minor updates to `devDependencies`
- Major version bumps require manual review PR

### E. WhatsApp Voice Pipeline

```
WhatsApp Voice Message → Meta Webhook
       → Google Cloud Run (routing)
       → OCI Whisper.cpp container
       → Transcription JSON
       → Qwen 2.5 intent extraction
       → Triage session update
```


---

## 8. Security Model

| Layer | Control |
|-------|---------|
| Transport | TLS 1.3 mandatory on all endpoints; HSTS enforced |
| Authentication | JWT (RS256), 15-min access tokens, 30-day refresh rotation |
| Authorization | RBAC: `client \| expert \| admin`; Supabase Row-Level Security |
| Data at Rest | AES-256 on PostgreSQL and OCI Object Storage |
| Document Vault | Client-side AES-256-GCM before upload — server never holds plaintext |
| Video Streams | DTLS-SRTP end-to-end encryption on all WebRTC media |
| Rate Limiting | Redis-backed per-IP and per-user on all API endpoints |
| Input Validation | Zod schema on all API inputs; parameterized SQL (no raw interpolation) |
| Secrets | Stored in Vercel, GCR, and OCI secret stores — never in codebase or `.env` commits |
| CORS | Requests from unapproved origins rejected |
| Escrow Integrity | Immutable state transitions with full audit trail |

### Data Privacy & Compliance

| Requirement | Implementation |
|-------------|----------------|
| GDPR (Europe) | Right to erasure endpoint, data portability export, DPA agreements |
| Rwanda Data Protection Law No. 058/2021 | Personal data handling compliance |
| Legal Privilege | Consultation content classified attorney-client privileged; not used for model training |
| Data Retention | Booking records: 7 years. Documents: user-controlled. Session logs: 90 days |
| Breach Notification | 72-hour SLA to supervisory authorities (GDPR Article 33) |

---

## 9. Design System & Brand Identity

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-canvas` | `#f8fafc` | Global app background |
| `brand-dark` | `#0b2545` | Navigation, headers, sidebar, structure |
| `brand-blue` | `#1d4ed8` | CTAs, map pins, microphone button, OTP focus |
| `brand-border` | `#e2e8f0` | Borders, dividers, upload zones |
| `brand-green` | `#134021` | Success states, escrow held, verified badge |
| `brand-alert` | `#d32f2f` | Warnings, expiry deadlines, urgent actions |

### Key UI Components

| Component | Token | Behavior |
|-----------|-------|----------|
| Sidebar & header | `bg-brand-dark` | Institutional dark blue structure |
| Expert map pins | `fill-brand-blue` | Clickable, hidden when suspended |
| Microphone button | `bg-brand-blue` | Triggers Whisper.cpp recording |
| Audio indicator | `ring-brand-blue/30` | Animated wave during AI processing |
| OTP input focus | `focus:border-brand-blue` | Smooth border color transition |
| Escrow status | `text-brand-green` | `HELD_IN_ESCROW` indicator |
| Compliance alerts | `text-brand-alert` | Expiring credentials, pending payments |
| File upload zone | `border-brand-border` | Dashed drag-and-drop area |
| File success state | `text-brand-green` | Checkmark on successful upload |

### Design Principles

- **Mobile-first** — optimized for unstable cellular networks
- **Accessibility** — high-contrast, readable typography, reduced cognitive overload
- **Professional identity** — institutional dark blue, minimal visual noise
- **Immediate feedback** — color-coded states for every user action


---

## 10. Resource Allocation

### Server Memory (24 GB RAM — OCI Instance)

| Service | Allocation |
|---------|------------|
| Ollama / Qwen 2.5 | 1.1 GB |
| LiveKit WebRTC | 4 GB |
| PostgreSQL 16 | 4 GB |
| Next.js / Node.js API | 3 GB |
| PocketBase + Redis + Microservices + OS | 11.9 GB |
| **Total** | **24 GB** |

### Disk Storage (45 GB)

| Component | Allocation |
|-----------|------------|
| Ubuntu Linux base | 10 GB |
| PostGIS tables + NISR shapefiles | 15 GB |
| Docker logs + application data | 15 GB |
| AI models (Qwen 2.5, Whisper base) | 5 GB |
| **Total** | **45 GB** |

### External Storage

| Type | Provider | Specification |
|------|----------|---------------|
| Case files / documents | OCI Object Storage | 20 GB free tier; AES-256-GCM encrypted at client |
| Video recordings | Google Drive / OneDrive | API passthrough — bypasses server storage entirely |

### AI Model Memory Footprint

| Model | RAM |
|-------|-----|
| Qwen2.5-1.5B-Instruct (Q4 quantized) | ~1.1 GB |
| Whisper.cpp Base | ~74 MB |
| **Total AI** | **~1.2 GB** |

---

## 11. Roadmap

| Milestone | Timeline | Deliverables |
|-----------|----------|--------------|
| v1.0 — MVP | Week 6 | Auth, map discovery, booking engine, Azam Pay escrow, basic video, AI triage, document vault |
| v1.1 — Mobile | Post-MVP | React Native iOS + Android, push notifications, offline mode |
| v1.2 — Calendar Sync | Q2 | Native sync with Clio, Outlook, Google Calendar; real-time availability |
| v1.3 — Multi-Jurisdiction | Q3 | Kenya, Uganda, Tanzania, South Sudan expansion; multi-currency |
| v2.0 — Agentic AI | Q4 | AI auto-drafts routine documents, compliance checkers, smart reminders |
| v3.0 — Global Scale | Year 2 | 1M users, 50+ jurisdictions, B2B enterprise API for law firms |

### Known Technical Debt (v1.0)

- [ ] Calendar sync is one-way at launch (expert updates manually) — bidirectional planned v1.2
- [ ] AI triage limited to Kinyarwanda, English, French — Swahili in v1.3
- [ ] Video max 2 participants (client + expert) — group sessions post-v1.0
- [ ] Auth.js vs Supabase Auth needs final reconciliation before auth module build
- [ ] `pg_net` extension must be verified on Supabase project before compliance function deploys
- [ ] Escrow early termination path (consultation < 5 min) needs defined refund policy

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | RS256 private key for JWT signing |
| `JWT_PUBLIC_KEY` | Yes | RS256 public key for JWT verification |
| `AZAMPAY_APP_NAME` | Yes | Azam Pay merchant app name |
| `AZAMPAY_CLIENT_ID` | Yes | Azam Pay client ID |
| `AZAMPAY_CLIENT_SECRET` | Yes | Azam Pay client secret |
| `AZAMPAY_WEBHOOK_SECRET` | Yes | Azam Pay webhook HMAC-SHA256 signing secret |
| `LIVEKIT_API_KEY` | Yes | LiveKit API key |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API secret |
| `LIVEKIT_WEBHOOK_SECRET` | Yes | LiveKit webhook signature verification |
| `BREVO_API_KEY` | Yes | Brevo transactional email |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Meta WhatsApp Cloud API token |
| `WEBHOOK_VERIFY_TOKEN` | Yes | Meta webhook verification token |
| `OCI_BUCKET_NAME` | Yes | OCI Object Storage bucket |
| `OCI_ACCESS_KEY_ID` | Yes | OCI S3-compatible access key |
| `OCI_SECRET_ACCESS_KEY` | Yes | OCI S3-compatible secret |
| `OLLAMA_HOST` | Yes | Ollama API host (OCI internal) |
| `POCKETBASE_URL` | Yes | PocketBase instance URL |
| `LISTMONK_API_URL` | Yes | Listmonk API base URL |
| `LISTMONK_API_KEY` | Yes | Listmonk API credentials |
| `LOG_LEVEL` | No | `error\|warn\|info\|debug` (default: `info`) |

---

*MyJudicial | Kigali, Rwanda | myjudicial.com*
