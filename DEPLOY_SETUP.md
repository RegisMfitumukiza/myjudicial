# MyJudicial — VPS Setup & CI/CD Guide

## Repository Structure

Single monorepo repo. One clone on the VPS contains everything:

```
~/myjudicial/                    # monorepo clone (APP_DIR)
├── docker-compose.yml           # Full-stack orchestration
├── .env.example                 # Root env (compose interpolation + frontend build args)
├── scripts/
│   └── vps-init.sh              # One-time VPS bootstrap
├── myjudicial-backend/          # Express API (also has its own deploy/health/maintenance scripts)
├── myjudicial-frontend/         # Next.js app
└── myjudicial-ai-service/       # FastAPI service
```

## One-Time VPS Setup

Run `scripts/vps-init.sh` on your VPS, or follow these steps manually:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh && rm get-docker.sh
sudo usermod -aG docker $USER

# 2. Create app directory and clone the monorepo
mkdir -p /home/$USER/myjudicial
cd /home/$USER/myjudicial
git clone <your-monorepo-url> .

# 3. Create the single root .env (configures the entire stack)
cp .env.example .env
nano .env

# The per-service .env.example files (myjudicial-backend/, myjudicial-ai-service/)
# are for LOCAL development only — docker compose does not read them.
# Keep myjudicial-backend/.env locally if you run backend migrations via
# `npx prisma migrate deploy` from that directory.

# 4. Apply database migrations once
cd myjudicial-backend
npm ci
npx prisma migrate deploy

# 5. Start the stack
cd /home/$USER/myjudicial
docker compose up -d --build
```

`scripts/vps-init.sh` performs steps 1-2 (plus Docker Compose) and warns about missing `.env` files.

## Environment File Required

One file configures the whole stack. `docker-compose.yml` reads every service's
variables from it via explicit `environment:` mappings; the frontend build args
are derived from the same values.

| File | Purpose | Critical values |
|------|---------|-----------------|
| `.env` (root) | single source of truth for compose + all containers | `FRONTEND_URL`, `BACKEND_URL`, `AUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `BREVO_API_KEY`, `AI_SERVICE_KEY`, `GROQ_API_KEY`, `AZAMPAY_*`, `OCI_*`, `LIVEKIT_*`, `ADMIN_*` |

The per-service `.env` files under `myjudicial-backend/`, `myjudicial-ai-service/`
and `myjudicial-frontend/` are for **local development only** and are ignored by
docker compose.

> **LLM provider note:** `docker-compose.yml` defaults the AI service to
> `LLM_PROVIDER=groq`, so `GROQ_API_KEY` in the root `.env` is **required**
> (get a free key at https://console.groq.com). If you prefer local Ollama, set
> `LLM_PROVIDER=ollama` and `OLLAMA_BASE_URL` in the root `.env`.

## GitHub Secrets Required

Configure these on the monorepo repo in **Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP address or hostname |
| `VPS_USER` | SSH username (e.g., `ubuntu`, `root`) |
| `VPS_SSH_KEY` | Private SSH key (ed25519 or RSA) |
| `VPS_PORT` | SSH port (default: `22`) |
| `APP_DIR` | Absolute path to the monorepo clone (e.g., `/home/ubuntu/myjudicial`) |
| `NEXT_PUBLIC_APP_URL` | `https://myjudicial.com` (inlined into frontend bundle at CI build time) |
| `NEXT_PUBLIC_API_URL` | `https://api.myjudicial.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase anon key (public by design) |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit URL |
| `AUTH_SECRET` | NextAuth secret used by the frontend |
| `QUAY_USERNAME` | Quay robot account, e.g. `regismfitumukiza+myjudicial-ci` |
| `QUAY_TOKEN` | Quay robot account token (shown once at creation) |

> **Why quay.io and not ghcr.io?** The VPS's network path to ghcr.io's
> Azure-hosted edge drops ~50% of connections (Oracle↔Azure routing).
> quay.io is reliably reachable from the VPS and offers free private repos.

### One-time VPS: authenticate to Quay

Images are pushed by CI as **private** repositories. The VPS pulls them with
the same robot account:

```bash
ssh user@vps
echo "<QUAY_TOKEN>" | docker login quay.io -u "regismfitumukiza+myjudicial-ci" --password-stdin
```

Until this is done, deploy workflows automatically fall back to building
images on the VPS (slower, uses disk). After it, the VPS only ever pulls.

### Generating an SSH Key for CI/CD

```bash
ssh-keygen -t ed25519 -f myjudicial-cd -N ""
# Add the public key to VPS ~/.ssh/authorized_keys
# Add the private key (myjudicial-cd) to GitHub secrets as VPS_SSH_KEY
```

## CI/CD Workflows

Three path-filtered workflows live in `.github/workflows/`:

| Workflow | Triggers on changes to | Checks | Ships |
|----------|------------------------|--------|-------|
| `backend-ci.yml` | `myjudicial-backend/**` | tests (+coverage gate locally via npm script) | image to quay.io (`sha` + `latest`, linux/arm64), then pulls onto VPS |
| `frontend-ci.yml` | `myjudicial-frontend/**` | tsc, lint, vitest | same, with prod build args from repo secrets |
| `ai-service-ci.yml` | `myjudicial-ai-service/**` | flake8, pytest | same |

Workflow files and `docker-compose.yml` also trigger all workflows (a compose change rebuilds everything).

## How Deployment Works

1. Push to `main`
2. GitHub Actions runs checks for affected services
3. Passing builds are pushed to `quay.io/regismfitumukiza/myjudicial-{backend,frontend,ai}` tagged with the commit SHA + `latest` (arm64)
4. The deploy step SSHes to the VPS: `git pull`, pins `<SVC>_TAG=<sha>` in `.env`, `docker compose pull <svc> && up -d <svc>`
5. A post-deploy health gate fails the workflow if the container never becomes healthy
6. Deploys are serialized per service via concurrency groups (no racing pulls)

**Build once, run anywhere:** images are built in CI for `linux/arm64`; the
VPS never compiles code again. Disk stays flat; deploys take seconds.

## Rollback

Every deploy is an immutable SHA tag. To roll back any service:

```bash
cd ~/myjudicial
sed -i 's/^BACKEND_TAG=.*/BACKEND_TAG=<previous-sha>/' .env   # or FRONTEND_TAG / AI_TAG
docker compose pull backend && docker compose up -d backend
```

## Staging Environment

Staging lives in a second clone + second Cloudflare tunnel so experiments can
never touch production traffic or data. Full checklist in `.env.staging.example`.

```bash
# 1. Second clone
git clone <repo> ~/myjudicial-staging && cd ~/myjudicial-staging
cp ~/myjudicial/.env .env && nano .env   # apply overrides from .env.staging.example

# 2. Separate tunnel (NEVER reuse production credentials)
cloudflared tunnel login
cloudflared tunnel create myjudicial-staging
cp ~/.cloudflared/<STAGING_ID>.json caddy/staging-credentials.json
# point staging compose at caddy/staging-config.yml + staging credentials

# 3. Migrations against the STAGING database only
cd myjudicial-backend && npx prisma migrate deploy && cd ..

# 4. Start (pull-only; no compilers needed)
docker compose pull && docker compose up -d
```

Create proxied DNS records: `staging.myjudicial.com` and
`api.staging.myjudicial.com` -> `<STAGING_TUNNEL_ID>.cfargotunnel.com`.

Local development uses the same separation: `docker compose up` merges
`docker-compose.override.yml` (localhost ports, tunnel disabled); copy
`.env.local` over your root `.env` values so local runs hit a dev database,
not production Supabase.

## Manually Deploying All Services

```bash
ssh user@vps
cd /home/user/myjudicial
git pull origin main
docker compose pull && docker compose up -d
```

Startup order is enforced by `depends_on`: `ai` must be healthy before `backend` starts, and `backend` before `frontend`.

`myjudicial-backend/deploy-oci.sh` automates the whole first-time bootstrap on a fresh Ubuntu box: system update, Docker + Compose install, monorepo clone (`./deploy-oci.sh <repo-url>`), env-file checks, and `docker compose up -d`.

## Production Ingress (Cloudflare Tunnel)

Ingress is handled by the `cloudflared` service in `docker-compose.yml` — no
host reverse proxy, no open web ports, no certificate management:

- TLS terminates at the Cloudflare edge; origins are plain HTTP over the tunnel
- Routing lives in `caddy/config.yml`, credentials in `caddy/credentials.json`
  (git-ignored — never commit or copy it anywhere)
- Cloudflare DNS: proxied CNAME records for `@`, `www`, `api` pointing at
  `<TUNNEL_ID>.cfargotunnel.com`

If you change routing, edit `caddy/config.yml` and push — the
`tunnel-deploy.yml` workflow recreates the tunnel container automatically.

> Historical note: earlier versions used a host-level Caddy reverse proxy on
> ports 80/443. That setup was replaced by the tunnel; the `caddy/` directory
> name only remains for legacy reasons.

## Firewall

cloudflared makes only OUTBOUND connections (QUIC/7844 to Cloudflare edge),
so the VPS needs no inbound web ports at all:

```bash
sudo ufw allow OpenSSH
sudo ufw default deny incoming
sudo ufw enable
```

Nothing else needs opening: all services communicate over the internal
Docker network, and public traffic enters exclusively through the tunnel.
