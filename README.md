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
- API keys for the external providers you enable (Supabase, Redis, Brevo, Flutterwave/AzamPay, LiveKit, Groq)

## Quick Start (local)

```bash
# 1. Configure env files
cp .env.example .env                                   # root env (compose interpolation)
cp .env.local.example .env.local                       # optional localhost overrides

# 2. Fill in real values (see "Environment Files" below)

# 3. Build and start everything
docker compose up -d --build        # auto-merges docker-compose.override.yml:
                                    # publishes 3000/4000/5000, disables cloudflared
```

Frontend: http://localhost:3000 — Backend API: http://localhost:4000 (Swagger at `/api-docs`).

> Local runs should point at a dev database, never production Supabase —
> see `.env.local` / DEPLOY_SETUP.md ("Staging Environment").

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

For schema changes: edit `schema.prisma`, generate a migration against your **local/dev**
database with `npx prisma migrate dev --name <change>`, and commit the new folder under
`prisma/migrations/`. Avoid `db push` on any shared database — it bypasses migration
history (see `DEPLOY_SETUP.md > Database Migrations` for how drift bit us before).

## Testing

| Service | Command | Notes |
|---------|---------|-------|
| Backend | `npm test` (in `myjudicial-backend/`) | Node `node:test` + supertest; self-provisions env vars. Coverage gate: `npm run test:coverage` |
| Frontend | `npm test` (in `myjudicial-frontend/`) | Vitest + Testing Library (jsdom) |
| AI Service | `pytest` (in `myjudicial-ai-service/`) | pytest + FastAPI TestClient |

## Deployment

Production runs on a single VPS from the same `docker-compose.yml`. CI builds
images to Docker Hub and the VPS only pulls. See `DEPLOY_SETUP.md`:

1. Provision the VPS with `scripts/vps-init.sh` (Docker, swap, clone)
2. Create the root `.env`, log in to Docker Hub, apply Prisma migrations once
3. `docker compose pull && docker compose up -d`
4. Public traffic enters via Cloudflare Tunnel (no open web ports)

### CI/CD

Each service has its own GitHub Actions workflow. Merging to `main` runs
checks (build, tests, coverage), pushes a SHA-tagged image to
`docker.io/mfitumukiza250/myjudicial:{backend,frontend,ai}-<sha>`, then SSHes into the VPS: pins the tag in `.env`,
pulls, restarts the affected service only, and gates on its healthcheck.
Rollback = re-pin the previous SHA (see DEPLOY_SETUP.md).
