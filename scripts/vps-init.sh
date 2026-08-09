#!/usr/bin/env bash
# ============================================
# MyJudicial VPS Initialization Script
# One-time setup for a fresh Ubuntu VPS
# ============================================
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/myjudicial}"
GITHUB_ORG="${GITHUB_ORG:-My-Judicial}"
GITHUB_USER="${GITHUB_USER:-RegisMfitumukiza}"

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

# --- Create app directory ---
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# --- Clone repos (if not already cloned) ---
repos=(
    "myjudicial-backend:$GITHUB_ORG/myjudicial-backend"
    "myjudicial-frontend:$GITHUB_ORG/myjudicial-frontend"
    "myjudicial-ai-service:$GITHUB_USER/myjudicial-ai-service"
)

for entry in "${repos[@]}"; do
    dir="${entry%%:*}"
    repo="${entry##*:}"
    if [ -d "$dir" ]; then
        echo "$dir already exists, skipping clone."
    else
        echo "Cloning $repo..."
        git clone "https://github.com/$repo.git" "$dir"
    fi
done

# --- docker-compose.yml ---
if [ ! -f docker-compose.yml ]; then
    echo "ERROR: docker-compose.yml not found in $APP_DIR"
    echo "Copy it from the workspace or create it manually."
    exit 1
fi

# --- .env ---
if [ ! -f .env ]; then
    echo "WARNING: .env not found. Copy .env.example to .env and fill in values."
fi

echo ""
echo "=== VPS initialization complete ==="
echo ""
echo "Next steps:"
echo "  1. Set up GitHub Secrets in each repo:"
echo "     - VPS_HOST   (this machine's IP)"
echo "     - VPS_USER   ($USER)"
echo "     - VPS_SSH_KEY (private SSH key for CI/CD)"
echo "     - VPS_PORT   (22)"
echo "     - APP_DIR    ($APP_DIR)"
echo ""
echo "  2. Copy your public SSH key to ~/.ssh/authorized_keys on this VPS:"
echo "     echo '<your-public-key>' >> ~/.ssh/authorized_keys"
echo ""
echo "  3. Fill in .env with production credentials"
echo ""
echo "  4. Start the stack:"
echo "     cd $APP_DIR && docker compose up -d --build"
echo ""
