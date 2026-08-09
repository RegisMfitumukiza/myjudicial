# MyJudicial

Legal services platform connecting citizens with verified lawyers and legal experts.

A monorepo with three services: a Next.js frontend (EN/FR/RW), an Express 5 + Prisma + PostgreSQL backend (bookings, escrow payments, notifications, video consultations, admin analytics), and a FastAPI AI service (audio transcription, translation, and AI legal triage). Everything ships as Docker Compose services behind a single reverse proxy.

## Architecture

| Service | Directory | Port | Stack |
|---------|-----------|------|-------|
| Frontend | `myjudicial-frontend/` | 3000 | Next.js 16, React, TypeScript, next-intl, MapLibre |
| Backend | `myjudicial-backend/` | 4000 | Express 5, Prisma, PostgreSQL, Redis, Node 20 |
| AI Service | `myjudicial-ai-service/` | 5000 | FastAPI, Whisper, Sentence Transformers, pgvector |

Service-to-service calls run over an internal Docker network: `frontend -> backend -> ai`. The AI service is never exposed publicly.

## Repository Structure

```
.
├── docker-compose.yml          # Full-stack orchestration (frontend + backend + ai)
├── .env.example                # Root env for compose interpolation + frontend build args
├── DEPLOY_SETUP.md             # VPS provisioning, CI/CD, reverse proxy guide
├── scripts/
│   └── vps-init.sh             # One-time VPS bootstrap (Docker + clones + env setup)
├── myjudicial-frontend/        # Next.js app (own package.json, README, tests)
├── myjudicial-backend/         # Express API (own package.json, README_DEPLOYMENT.md, tests)
└── myjudicial-ai-service/      # FastAPI service (own requirements.txt, README.md, tests)
```

## Prerequisites

- Docker + Docker Compose v2
- PostgreSQL (via Supabase or self-hosted) with pgvector if the AI embedding features are used
- API keys for the external providers you enable (Supabase, Redis, Brevo, Flutterwave/AzamPay, WhatsApp, LiveKit, Groq)

## Quick Start

```bash
# 1. Configure env files
cp .env.example .env                                   # root env (compose interpolation)
cp myjudicial-backend/.env.example myjudicial-backend/.env
cp myjudicial-ai-service/.env.example myjudicial-ai-service/.env

# 2. Fill in real values (see "Environment Files" below)

# 3. Build and start everything
docker compose up -d --build

# 4. Check health
curl -s http://localhost:4000/health
```

Frontend: http://localhost:3000 — Backend API: http://localhost:4000 (Swagger at `/api-docs`).

## Environment Files

| File | Purpose | Critical values |
|------|---------|-----------------|
| `.env` (root) | Compose variable interpolation + frontend build args | `FRONTEND_URL`, `BACKEND_URL`, `AUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `LIVEKIT_URL` |
| `myjudicial-backend/.env` | Backend container runtime | `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `CORS_ORIGIN`, `AI_SERVICE_KEY`, `SUPABASE_*`, `BREVO_API_KEY`, `AZAMPAY_*`, `OCI_*`, `LIVEKIT_*`, `ADMIN_*` |
| `myjudicial-ai-service/.env` | AI container runtime | `API_KEY` (must equal backend `AI_SERVICE_KEY`), `GROQ_API_KEY`, `DATABASE_URL` |

Secrets are git-ignored — never commit `.env` files. Generate strong values with `openssl rand -hex 32`.

## Database

The backend owns the schema via Prisma migrations (`myjudicial-backend/prisma/migrations/`). Apply them against your database:

```bash
cd myjudicial-backend
npm ci
npx prisma migrate deploy
```

For local development, `prisma db push` is available as `npm run db:push` for rapid schema iteration.

## Testing

| Service | Command | Notes |
|---------|---------|-------|
| Backend | `npm test` (in `myjudicial-backend/`) | Node `node:test` + supertest; self-provisions env vars. Coverage gate: `npm run test:coverage` |
| Frontend | `npm test` (in `myjudicial-frontend/`) | Vitest + Testing Library (jsdom) |
| AI Service | `pytest` (in `myjudicial-ai-service/`) | pytest + FastAPI TestClient |

## Deployment

Production uses the same `docker-compose.yml` on a single VPS. See `DEPLOY_SETUP.md` for the full guide:

1. Provision the VPS with `scripts/vps-init.sh`
2. Create the three `.env` files on the server
3. Apply Prisma migrations once
4. `docker compose up -d --build`
5. Put a reverse proxy (Caddy or nginx) in front with HTTPS and Cloudflare DNS, exposing only ports 80/443

### CI/CD

Each service has its own GitHub Actions workflow. Merging to `main` runs checks (build, tests, coverage) and, on success, SSHes into the VPS and redeploys the affected service. Required repository secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`, `APP_DIR`.
