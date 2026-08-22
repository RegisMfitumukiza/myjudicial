#!/usr/bin/env bash
# ============================================
# MyJudicial VPS Initialization (monorepo)
# One-time setup for a fresh Ubuntu VPS (arm64 or x86_64)
# ============================================
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/myjudicial}"
REPO_URL="${REPO_URL:-https://github.com/RegisMfitumukiza/myjudicial.git}"

echo "=== MyJudicial VPS Initialization ==="
echo "App directory: $APP_DIR"

# --- Docker ---
if ! command -v docker &>/dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker "$USER"
    rm /tmp/get-docker.sh
else
    echo "Docker already installed."
fi

# --- Swap (OCI free tier boxes ship with none; AI service reserves 2G) ---
if ! sudo swapon --show=NAME --noheadings | grep -q .; then
    echo "Creating 2G swapfile..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
    sudo sysctl -qw vm.swappiness=10
    echo "Swap enabled."
else
    echo "Swap already present."
fi

# --- Clone the monorepo ---
mkdir -p "$APP_DIR"
cd "$APP_DIR"
if [ -d .git ]; then
    echo "Monorepo already cloned."
    git pull origin main || true
else
    git clone "$REPO_URL" .
fi

# --- .env check ---
if [ ! -f .env ]; then
    cp .env.example .env
    echo "NOTE: created .env from example — fill in real values now: nano $APP_DIR/.env"
fi

echo ""
echo "=== Init complete. Remaining manual steps ==="
cat <<EOF
  1. Fill in .env:            nano $APP_DIR/.env
  2. Docker Hub login (pulls): echo "<DOCKERHUB_TOKEN>" | docker login docker.io -u mfitumukiza250 --password-stdin
     (skip if images are public; CI falls back to building on-VPS without it)
  3. Migrations (once):       cd $APP_DIR/myjudicial-backend && npm ci && npx prisma migrate deploy && cd ..
  4. Start stack:             cd $APP_DIR && docker compose pull && docker compose up -d
EOF