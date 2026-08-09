#!/bin/bash

# MyJudicial OCI Deployment Script
# Run this script on your OCI instance after initial setup

set -e

echo "🏛️  MyJudicial Oracle Cloud Deployment"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running on Ubuntu
if [ ! -f /etc/lsb-release ]; then
    print_error "This script is designed for Ubuntu. Exiting."
    exit 1
fi

print_success "Running on Ubuntu"

# Update system
echo ""
echo "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Install Docker
echo ""
echo "Step 2: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker installed"
else
    print_warning "Docker already installed"
fi

# Install Docker Compose plugin
echo ""
echo "Step 3: Installing Docker Compose plugin..."
if ! docker compose version &> /dev/null; then
    sudo apt install -y docker-compose-plugin
    print_success "Docker Compose plugin installed"
else
    print_warning "Docker Compose plugin already installed"
fi

# Verify Docker is working
echo ""
echo "Step 4: Verifying Docker..."
docker --version
docker compose version
print_success "Docker is ready"

# Enable Docker to start on boot
echo ""
echo "Step 5: Enabling Docker on boot..."
sudo systemctl enable docker
sudo systemctl start docker

# Clone the repository (skip if already present)
echo ""
echo "Step 6: Cloning the repository..."
DEPLOY_DIR=~/myjudicial
REPO_URL="${1:-https://github.com/My-Judicial/myjudicial.git}"
if [ ! -d "$DEPLOY_DIR" ]; then
    git clone "$REPO_URL" "$DEPLOY_DIR"
    print_success "Repository cloned to $DEPLOY_DIR"
else
    cd "$DEPLOY_DIR"
    git pull
    print_success "Repository already present, pulled latest changes"
fi

# Configure environment
echo ""
echo "Step 7: Configuring environment..."
cd "$DEPLOY_DIR/myjudicial-backend"
if [ ! -f .env ]; then
    print_warning ".env not found. Run ./setup-environment.sh to create it."
    print_warning "For now, copying from .env.example if available..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Copied .env.example to .env (REVIEW the values before continuing!)"
    fi
fi

# Make scripts executable
echo ""
echo "Step 8: Making scripts executable..."
chmod +x *.sh
print_success "Scripts are executable"

# Build and start
echo ""
echo "Step 9: Building and starting services..."
cd "$DEPLOY_DIR"
docker compose up -d --build
print_success "Services started"

# Wait for services to be healthy
echo ""
echo "Step 10: Waiting for services to become healthy..."
sleep 15
cd "$DEPLOY_DIR/myjudicial-backend"
./health-check.sh || print_warning "Some services may still be starting. Re-run ./health-check.sh in a minute."

echo ""
echo "======================================"
echo -e "${GREEN}✓${NC} Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Configure your DNS + reverse proxy to point at this server"
echo "  2. Run ./health-check.sh to verify all services"
echo "  3. Use ./maintenance.sh for ongoing operations"
echo ""
echo "IMPORTANT: If you copied .env.example, set real secrets before going live!"

