#!/bin/bash

# MyJudicial Environment Setup Script
# Run this once after cloning the repository

set -e

echo "🏛️  MyJudicial Environment Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠ .env file already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
        exit 0
    fi
fi

# Copy .env.example to .env
echo "Copying .env.example to .env..."
cp .env.example .env
echo -e "${GREEN}✓${NC} .env file created"
echo ""

# Function to prompt for input with default
prompt_input() {
    local prompt=$1
    local default=$2
    local secret=$3
    
    if [ "$secret" = "true" ]; then
        read -sp "$prompt [$default]: " input
        echo
    else
        read -p "$prompt [$default]: " input
    fi
    
    echo "${input:-$default}"
}

# Function to generate random string
generate_secret() {
    openssl rand -hex 32
}

echo -e "${BLUE}Let's configure your environment variables...${NC}"
echo ""

# Basic Configuration
echo "=== Basic Configuration ==="
NODE_ENV=$(prompt_input "Node Environment (development/production)" "development")
PORT=$(prompt_input "API Port" "3000")

# Database
echo ""
echo "=== Database Configuration ==="
read -p "Use Supabase (y/n): " -n 1 -r
supabase_choice="$REPLY"
echo

if [[ $supabase_choice =~ ^[Yy]$ ]]; then
    echo "You'll need to set up a Supabase project at https://supabase.com"
    DATABASE_URL=$(prompt_input "Supabase Database URL (pooler)" "")
    DIRECT_URL=$(prompt_input "Supabase Direct URL" "")
    SUPABASE_URL=$(prompt_input "Supabase Project URL" "")
    SUPABASE_ANON_KEY=$(prompt_input "Supabase Anon Key" "")
    SUPABASE_SERVICE_ROLE_KEY=$(prompt_input "Supabase Service Role Key" "" "true")
else
    POSTGRES_PASSWORD=$(prompt_input "PostgreSQL Password" "$(generate_secret)" "true")
    DATABASE_URL="postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/myjudicial?pgbouncer=true"
    DIRECT_URL="postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/myjudicial"
fi

# Redis
echo ""
echo "=== Redis Configuration ==="
read -p "Use Upstash (y/n): " -n 1 -r
redis_choice="$REPLY"
echo

if [[ $redis_choice =~ ^[Yy]$ ]]; then
    REDIS_URL=$(prompt_input "Upstash Redis URL" "")
else
    REDIS_PASSWORD=$(prompt_input "Redis Password" "$(generate_secret)" "true")
    REDIS_URL="redis://default:$REDIS_PASSWORD@redis:6379"
fi

# OCI Object Storage
echo ""
echo "=== OCI Object Storage ==="
OCI_ENDPOINT=$(prompt_input "OCI S3 Endpoint" "https://namespace.compat.objectstorage.region.oraclecloud.com")
OCI_BUCKET_NAME=$(prompt_input "OCI Bucket Name" "myjudicial-vault")
OCI_REGION=$(prompt_input "OCI Region" "ap-mumbai-1")
OCI_ACCESS_KEY_ID=$(prompt_input "OCI Access Key ID" "")
OCI_SECRET_ACCESS_KEY=$(prompt_input "OCI Secret Access Key" "" "true")

# External Services
echo ""
echo "=== External Services ==="
BREVO_API_KEY=$(prompt_input "Brevo API Key" "" "true")
EMAIL_FROM_ADDRESS=$(prompt_input "Email From Address" "noreply@yourdomain.com")

FLW_PUBLIC_KEY=$(prompt_input "Flutterwave Public Key" "")
FLW_SECRET_KEY=$(prompt_input "Flutterwave Secret Key" "" "true")
FLW_WEBHOOK_SECRET=$(prompt_input "Flutterwave Webhook Secret" "$(generate_secret)" "true")

WHATSAPP_ACCESS_TOKEN=$(prompt_input "WhatsApp Access Token" "" "true")
WHATSAPP_PHONE_NUMBER_ID=$(prompt_input "WhatsApp Phone Number ID" "")
WHATSAPP_VERIFY_TOKEN=$(prompt_input "WhatsApp Verify Token" "$(generate_secret)" "true")

LIVEKIT_API_KEY=$(prompt_input "LiveKit API Key" "")
LIVEKIT_API_SECRET=$(prompt_input "LiveKit API Secret" "" "true")
LIVEKIT_HOST=$(prompt_input "LiveKit Host" "https://your-project.livekit.cloud")

# URLs
echo ""
echo "=== Application URLs ==="
BASE_URL=$(prompt_input "Backend API Base URL" "https://api.yourdomain.com")
FRONTEND_URL=$(prompt_input "Frontend URL" "https://yourdomain.com")
CORS_ORIGIN="$FRONTEND_URL"

# Admin Seed
echo ""
echo "=== Admin User ==="
ADMIN_EMAIL=$(prompt_input "Admin Email" "admin@myjudicial.com")
ADMIN_FULL_NAME=$(prompt_input "Admin Full Name" "MyJudicial Admin")
ADMIN_PASSWORD=$(prompt_input "Admin Password" "$(generate_secret)" "true")
# Write to .env file
echo ""
echo "Writing configuration to .env file..."

cat > .env << EOF
# =============================================
# ENVIRONMENT
# =============================================
NODE_ENV=$NODE_ENV
PORT=$PORT
LOG_LEVEL=info

# =============================================
# DATABASE
# =============================================
DATABASE_URL="$DATABASE_URL"
DIRECT_URL="$DIRECT_URL"

# =============================================
# SUPABASE AUTH
# =============================================
${SUPABASE_URL:+SUPABASE_URL=$SUPABASE_URL}
${SUPABASE_ANON_KEY:+SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY}
${SUPABASE_SERVICE_ROLE_KEY:+SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY}
${SUPABASE_WEBHOOK_SECRET:+SUPABASE_WEBHOOK_SECRET=$SUPABASE_WEBHOOK_SECRET}

# =============================================
# REDIS
# =============================================
REDIS_URL="$REDIS_URL"
${REDIS_PASSWORD:+REDIS_PASSWORD=$REDIS_PASSWORD}

# =============================================
# OCI OBJECT STORAGE
# =============================================
OCI_ENDPOINT=$OCI_ENDPOINT
OCI_BUCKET_NAME=$OCI_BUCKET_NAME
OCI_REGION=$OCI_REGION
OCI_ACCESS_KEY_ID=$OCI_ACCESS_KEY_ID
OCI_SECRET_ACCESS_KEY=$OCI_SECRET_ACCESS_KEY
OCI_SIGNED_URL_EXPIRY_SECONDS=900

# =============================================
# EMAIL (Brevo)
# =============================================
BREVO_API_KEY=$BREVO_API_KEY
EMAIL_FROM_NAME=MyJudicial
EMAIL_FROM_ADDRESS=$EMAIL_FROM_ADDRESS

# =============================================
# FLUTTERWAVE
# =============================================
FLW_PUBLIC_KEY=$FLW_PUBLIC_KEY
FLW_SECRET_KEY=$FLW_SECRET_KEY
FLW_WEBHOOK_SECRET=$FLW_WEBHOOK_SECRET

# =============================================
# WHATSAPP CLOUD API
# =============================================
WHATSAPP_ACCESS_TOKEN=$WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=$WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=${WHATSAPP_BUSINESS_ACCOUNT_ID:-}
WHATSAPP_VERIFY_TOKEN=$WHATSAPP_VERIFY_TOKEN
WHATSAPP_WEBHOOK_SECRET=${WHATSAPP_WEBHOOK_SECRET:-}

# =============================================
# LIVEKIT
# =============================================
LIVEKIT_API_KEY=$LIVEKIT_API_KEY
LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET
LIVEKIT_HOST=$LIVEKIT_HOST

# =============================================
# URLS
# =============================================
BASE_URL=$BASE_URL
FRONTEND_URL=$FRONTEND_URL
CORS_ORIGIN=$CORS_ORIGIN

# =============================================
# ADMIN SEED
# =============================================
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_FULL_NAME=$ADMIN_FULL_NAME
ADMIN_PASSWORD=$ADMIN_PASSWORD

# =============================================
# PLATFORM SETTINGS
# =============================================
PLATFORM_COMMISSION=0.15

# =============================================
# POSTGRESQL (for self-hosted)
# =============================================
${POSTGRES_PASSWORD:+POSTGRES_PASSWORD=$POSTGRES_PASSWORD}
EOF

echo -e "${GREEN}✓${NC} .env file created successfully!"
echo ""
echo "=== Next Steps ==="
echo "1. Review and edit .env file if needed: nano .env"
echo "2. Make sure all external services are set up"
echo "3. Run deployment script: ./deploy-oci.sh"
echo ""
echo -e "${YELLOW}⚠ Important:${NC} Keep your .env file secure and never commit it to git!"