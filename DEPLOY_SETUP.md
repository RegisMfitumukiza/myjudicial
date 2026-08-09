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

# 3. Create the three .env files
cp .env.example .env
nano .env
cp myjudicial-backend/.env.example myjudicial-backend/.env
nano myjudicial-backend/.env
cp myjudicial-ai-service/.env.example myjudicial-ai-service/.env
nano myjudicial-ai-service/.env

# 4. Apply database migrations once
cd myjudicial-backend
npm ci
npx prisma migrate deploy

# 5. Start the stack
cd /home/$USER/myjudicial
docker compose up -d --build
```

`scripts/vps-init.sh` performs steps 1-2 (plus Docker Compose) and warns about missing `.env` files.

## Environment Files Required

| File | Purpose | Critical values |
|------|---------|-----------------|
| `.env` (root) | docker-compose variable interpolation + frontend build args | `FRONTEND_URL`, `BACKEND_URL`, `AUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `LIVEKIT_URL` |
| `myjudicial-backend/.env` | backend container runtime | `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `BREVO_API_KEY`, `SUPABASE_WEBHOOK_SECRET`, `AI_SERVICE_KEY`, `AZAMPAY_*`, `OCI_*`, `LIVEKIT_*` |
| `myjudicial-ai-service/.env` | AI container runtime | `API_KEY` (must equal backend `AI_SERVICE_KEY`), `GROQ_API_KEY` (see below), `DATABASE_URL` |

> **LLM provider note:** `docker-compose.yml` forces `LLM_PROVIDER=groq` for the AI service, so `GROQ_API_KEY` in `myjudicial-ai-service/.env` is **required** (get a free key at https://console.groq.com). If you prefer local Ollama, change `LLM_PROVIDER` in `docker-compose.yml` to `ollama` and set `OLLAMA_BASE_URL`.

## GitHub Secrets Required

Configure these on the monorepo repo in **Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP address or hostname |
| `VPS_USER` | SSH username (e.g., `ubuntu`, `root`) |
| `VPS_SSH_KEY` | Private SSH key (ed25519 or RSA) |
| `VPS_PORT` | SSH port (default: `22`) |
| `APP_DIR` | Absolute path to the monorepo clone (e.g., `/home/ubuntu/myjudicial`) |

### Generating an SSH Key for CI/CD

```bash
ssh-keygen -t ed25519 -f myjudicial-cd -N ""
# Add the public key to VPS ~/.ssh/authorized_keys
# Add the private key (myjudicial-cd) to GitHub secrets as VPS_SSH_KEY
```

## CI/CD Workflows

Three path-filtered workflows live in `.github/workflows/` — GitHub Actions only reads workflows at the repo root:

| Workflow | Triggers on changes to | Checks | Deploys |
|----------|------------------------|--------|---------|
| `backend-ci.yml` | `myjudicial-backend/**` | build, tests, coverage gate (lines >= 40%, funcs >= 30%, branches >= 70%) | `docker compose build/up backend` |
| `frontend-ci.yml` | `myjudicial-frontend/**` | tsc, lint, vitest | `docker compose build/up frontend` |
| `ai-service-ci.yml` | `myjudicial-ai-service/**` | flake8, pytest | `docker compose build/up ai` |

Workflow files and `docker-compose.yml` also trigger all workflows (a compose change rebuilds everything).

## How Deployment Works

1. Developer pushes to `main` on the monorepo repo
2. GitHub Actions runs the checks for the affected service(s)
3. If checks pass, the deploy job SSHes into the VPS
4. On VPS: `git pull origin main` in the monorepo clone, then `docker compose build <service>` and `docker compose up -d <service>`
5. The service restarts with the new code; other services stay up

## Manually Deploying All Services

```bash
ssh user@vps
cd /home/user/myjudicial
git pull origin main
docker compose up -d --build
```

Startup order is enforced by `depends_on`: `ai` must be healthy before `backend` starts, and `backend` before `frontend`. On a first deploy run `docker compose up -d --build` (not per-service) so dependency ordering is respected.

`myjudicial-backend/deploy-oci.sh` automates the whole first-time bootstrap on a fresh Ubuntu box: system update, Docker + Compose install, monorepo clone (`./deploy-oci.sh <repo-url>`), env-file checks, and `docker compose up -d --build`.

## Production Reverse Proxy (Recommended)

The compose stack exposes raw ports (3000/4000/5000). For production with HTTPS, put a reverse proxy in front. Only ports 22/80/443 should be open on the instance firewall; keep 3000/4000/5000 internal (especially the AI port).

```bash
# Install Caddy (auto HTTPS)
sudo apt install -y caddy
sudo tee /etc/caddy/Caddyfile > /dev/null <<'EOF'
your-domain.com {
    handle {
        reverse_proxy localhost:3000
    }
}
api.your-domain.com {
    handle {
        reverse_proxy localhost:4000
    }
}
ai.your-domain.com {
    handle {
        reverse_proxy localhost:5000
    }
}
EOF
sudo systemctl restart caddy
```

Then update root `.env` so URLs match:
- `FRONTEND_URL=https://your-domain.com`
- `BACKEND_URL=https://api.your-domain.com` (also used by the frontend build args)

With Cloudflare: create A records for `@` and `api` pointing at the VPS IP, set SSL mode to **Full (strict)** with a Cloudflare Origin certificate installed on the proxy.

## Firewall

```bash
# Only allow SSH, HTTP/HTTPS, and the docker network (block direct access to app ports)
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw default deny incoming
sudo ufw enable
```
