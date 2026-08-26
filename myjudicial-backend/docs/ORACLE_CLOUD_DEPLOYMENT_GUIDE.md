# 🏛️ MyJudicial Oracle Cloud Infrastructure Deployment Guide

> **Version:** 1.0  
> **Target Platform:** Oracle Cloud Infrastructure (OCI)  
> **Estimated Setup Time:** 4-6 hours  
> **Cost:** Free Tier eligible with careful resource management

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [OCI Account Setup](#3-oci-account-setup)
4. [Compute Instance Setup](#4-compute-instance-setup)
5. [Object Storage Configuration](#5-object-storage-configuration)
6. [Database Setup Options](#6-database-setup-options)
7. [Docker Installation](#7-docker-installation)
8. [Application Deployment](#8-application-deployment)
9. [Network & Security](#9-network--security)
10. [SSL/TLS Configuration](#10-ssltls-configuration)
11. [Monitoring & Maintenance](#11-monitoring--maintenance)
12. [Cost Optimization](#12-cost-optimization)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Overview

### Architecture on OCI

```
┌─────────────────────────────────────────────────────────┐
│                    Oracle Cloud (OCI)                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Compute Instance (VM.Standard.A1.Flex)         │   │
│  │  • 4 OCPUs, 24GB RAM (Free Tier)                │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  Docker Containers:                              │   │
│  │  ├─ Node.js Backend API (Express)               │   │
│  │  ├─ PostgreSQL 16 + PostGIS                     │   │
│  │  ├─ Redis                                       │   │
│  │  ├─ PocketBase (Chat)                          │   │
│  │  ├─ LiveKit (Video)                            │   │
│  │  ├─ Ollama + Qwen 2.5 (AI)                     │   │
│  │  ├─ Whisper.cpp (Speech-to-Text)               │   │
│  │  └─ Nginx Proxy Manager                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Object Storage (S3-Compatible)                 │   │
│  │  • Bucket: myjudicial-vault                     │   │
│  │  • Encrypted document storage                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Virtual Cloud Network (VCN)                    │   │
│  │  • Public Subnet                                │   │
│  │  • Security Lists (Firewall Rules)              │   │
│  │  • Internet Gateway                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐       ┌──────────────────┐
│  External Services  │       │   Vercel/CDN     │
├─────────────────────┤       ├──────────────────┤
│ • Supabase Auth     │       │ Next.js Frontend │
│ • Brevo Email       │       └──────────────────┘
│ • Flutterwave Pay   │
└─────────────────────┘
```

### Why Oracle Cloud?


| Feature | Benefit |
|---------|---------|
| **Generous Free Tier** | 4 OCPUs (ARM), 24GB RAM, 200GB storage — always free |
| **ARM Ampere A1** | Excellent performance/cost ratio for AI workloads |
| **Object Storage** | 20GB free with S3-compatible API |
| **No Eviction Risk** | Unlike some cloud providers, OCI free tier is stable |
| **Global Presence** | Data centers in Africa-adjacent regions (Mumbai, Jeddah) |
| **Enterprise Features** | Vault encryption, IAM, monitoring — all free tier eligible |

---

## 2. Prerequisites

### Required Accounts

- [ ] Oracle Cloud account ([signup.cloud.oracle.com](https://signup.cloud.oracle.com))
- [ ] Supabase project ([supabase.com](https://supabase.com))
- [ ] Brevo account ([brevo.com](https://brevo.com))
- [ ] Flutterwave account ([flutterwave.com](https://flutterwave.com))
- [ ] Domain name (for SSL certificates)

### Local Tools

- [ ] Git
- [ ] SSH client (built-in on Linux/Mac, PuTTY for Windows)
- [ ] Text editor
- [ ] OCI CLI (optional but recommended)

---

## 3. OCI Account Setup

### Step 1: Create OCI Account


1. Go to [https://signup.cloud.oracle.com](https://signup.cloud.oracle.com)
2. Provide email, country, and cloud account name
3. Verify email and complete identity verification
4. Add payment method (required but won't be charged on free tier)
5. Choose home region (closest to Rwanda: **Mumbai** `ap-mumbai-1` or **Jeddah** `me-jeddah-1`)

⚠️ **Important:** Home region cannot be changed after account creation!

### Step 2: Verify Free Tier Limits

Navigate to: **Governance & Administration → Tenancy Details → Service Limits**

Confirm you have:
- **Compute:** 4 OCPUs for VM.Standard.A1.Flex (ARM)
- **Block Storage:** 200 GB
- **Object Storage:** 20 GB
- **VCN:** 2 VCNs, 2 Internet Gateways

---

## 4. Compute Instance Setup

### Step 1: Create Virtual Cloud Network (VCN)

1. **Navigate:** Networking → Virtual Cloud Networks
2. **Click:** "Start VCN Wizard"
3. **Select:** "Create VCN with Internet Connectivity"
4. **Configure:**
   - **Name:** `myjudicial-vcn`
   - **Compartment:** `root` (or create dedicated compartment)
   - **VCN CIDR Block:** `10.0.0.0/16`
   - **Public Subnet CIDR:** `10.0.1.0/24`
5. **Click:** "Next" → "Create"

### Step 2: Configure Security List


1. **Go to:** VCN Details → Security Lists → Default Security List
2. **Add Ingress Rules:**

| Source CIDR | Protocol | Source Port | Dest Port | Description |
|-------------|----------|-------------|-----------|-------------|
| 0.0.0.0/0 | TCP | All | 22 | SSH access |
| 0.0.0.0/0 | TCP | All | 80 | HTTP |
| 0.0.0.0/0 | TCP | All | 443 | HTTPS |
| 0.0.0.0/0 | TCP | All | 3000 | Backend API |
| 0.0.0.0/0 | TCP | All | 7880 | LiveKit |
| 0.0.0.0/0 | TCP/UDP | All | 50000-60000 | LiveKit WebRTC |
| 0.0.0.0/0 | TCP | All | 8090 | PocketBase |
| 0.0.0.0/0 | TCP | All | 81 | Nginx Proxy Manager UI |

3. **Add Egress Rule:** Allow all outbound traffic (0.0.0.0/0, All Protocols)

### Step 3: Create Compute Instance

1. **Navigate:** Compute → Instances
2. **Click:** "Create Instance"
3. **Configure:**

**Basic Settings:**
- **Name:** `myjudicial-server`
- **Compartment:** Select appropriate compartment
- **Availability Domain:** Choose any available

**Image and Shape:**
- **Image:** Ubuntu 22.04 Minimal (ARM64)
- **Shape:** VM.Standard.A1.Flex
  - **OCPUs:** 4
  - **Memory (GB):** 24

**Networking:**
- **VCN:** myjudicial-vcn
- **Subnet:** Public subnet
- **Assign public IPv4 address:** ✅ Yes

**Add SSH Keys:**
- Generate new key pair OR upload existing public key
- **Download private key** (you'll need this for SSH)


**Boot Volume:**
- **Size (GB):** 50 (within free tier limits)

4. **Click:** "Create"

⏱️ Wait 2-3 minutes for instance to provision. Note the **Public IP Address**.

### Step 4: Configure OS Firewall

SSH into your instance:

```bash
ssh -i /path/to/private-key ubuntu@<PUBLIC_IP>
```

Update system and configure firewall:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure UFW firewall
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 3000/tcp   # Backend API
sudo ufw allow 7880/tcp   # LiveKit
sudo ufw allow 50000:60000/tcp  # LiveKit WebRTC (TCP)
sudo ufw allow 50000:60000/udp  # LiveKit WebRTC (UDP)
sudo ufw allow 8090/tcp   # PocketBase
sudo ufw allow 81/tcp     # Nginx Proxy Manager

# Enable firewall
sudo ufw --force enable
sudo ufw status
```

---

## 5. Object Storage Configuration

### Step 1: Create Bucket

1. **Navigate:** Storage → Buckets
2. **Click:** "Create Bucket"
3. **Configure:**
   - **Name:** `myjudicial-vault`
   - **Default Storage Tier:** Standard
   - **Enable Object Versioning:** ✅ (optional but recommended)
   - **Encryption:** Encrypt using Oracle-managed keys
4. **Click:** "Create"


### Step 2: Create Customer Secret Keys (S3-Compatible API)

1. **Navigate:** Identity → Users → Your Username
2. **Click:** "Customer Secret Keys" (left menu)
3. **Click:** "Generate Secret Key"
4. **Name:** `myjudicial-s3-key`
5. **Click:** "Generate Secret Key"
6. **Copy and save:**
   - Access Key ID
   - Secret Key (shown only once!)

### Step 3: Get Namespace and Endpoint

1. Go to your bucket details
2. Find **Namespace** in bucket information section
3. Construct endpoint:

```
https://<namespace>.compat.objectstorage.<region>.oraclecloud.com
```

**Example:**
```
https://axabcd1234.compat.objectstorage.ap-mumbai-1.oraclecloud.com
```

### Step 4: Update .env File

Add to your backend `.env`:

```env
OCI_ENDPOINT=https://<namespace>.compat.objectstorage.<region>.oraclecloud.com
OCI_BUCKET_NAME=myjudicial-vault
OCI_REGION=ap-mumbai-1  # or your chosen region
OCI_ACCESS_KEY_ID=<access_key_from_step_2>
OCI_SECRET_ACCESS_KEY=<secret_key_from_step_2>
OCI_SIGNED_URL_EXPIRY_SECONDS=900
```

---

## 6. Database Setup Options

You have two options for PostgreSQL hosting:

### Option A: Use Supabase (Recommended for MVP)

**Pros:**
- Managed service with automatic backups
- Built-in Auth and Row-Level Security
- PostGIS already configured
- Free tier: 500MB database, 2GB bandwidth

**Cons:**
- External dependency
- Limited control over configuration
- Bandwidth costs after free tier

**Setup:**
1. Create project at [supabase.com](https://supabase.com)
2. Enable PostGIS extension: SQL Editor → `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Copy connection strings from Settings → Database
4. Use in `.env` file


### Option B: Self-Hosted PostgreSQL on OCI (Full Control)

**Pros:**
- Complete control and customization
- No external dependencies
- Better for data sovereignty

**Cons:**
- Manual backup management
- Requires maintenance
- Uses instance resources

**Setup via Docker Compose** (covered in Section 8)

---

## 7. Docker Installation

SSH into your OCI instance and install Docker:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Logout and login again for group changes to take effect
exit
```

SSH back in:
```bash
ssh -i /path/to/private-key ubuntu@<PUBLIC_IP>
```

Verify Docker works without sudo:
```bash
docker ps
```

---

## 8. Application Deployment

### Step 1: Clone Repository

```bash
cd ~
git clone https://github.com/yourusername/myjudicial-backend.git
cd myjudicial-backend
```

### Step 2: Create Production .env File


```bash
cp .env.example .env
nano .env
```

Update all values (refer to `.env.example` for detailed instructions):

**Critical Variables:**
```env
NODE_ENV=production
PORT=3000

# Database (Supabase or self-hosted)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis (Upstash recommended)
REDIS_URL=rediss://...

# OCI Object Storage
OCI_ENDPOINT=https://...
OCI_BUCKET_NAME=myjudicial-vault
OCI_ACCESS_KEY_ID=...
OCI_SECRET_ACCESS_KEY=...

# External Services
BREVO_API_KEY=xkeysib-...
FLW_SECRET_KEY=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Public URLs
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### Step 3: Create Docker Compose Configuration

Create `docker-compose.prod.yml`:

```bash
nano docker-compose.prod.yml
```


Add the following configuration (this is a comprehensive multi-service setup):

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: myjudicial-backend
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
    depends_on:
      - redis
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./logs:/app/logs

  # PostgreSQL (if self-hosting)
  postgres:
    image: postgis/postgis:16-3.4
    container_name: myjudicial-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: myjudicial
    volumes:
      - postgres_data:/var/lib/postgresql/data
    shm_size: 256mb

  # Redis
  redis:
    image: redis:7-alpine
    container_name: myjudicial-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  # PocketBase (Chat)
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: myjudicial-pocketbase
    restart: unless-stopped
    ports:
      - "8090:8090"
    volumes:
      - pocketbase_data:/pb/pb_data
    environment:
      - POCKETBASE_ADMIN_EMAIL=${POCKETBASE_ADMIN_EMAIL}
      - POCKETBASE_ADMIN_PASSWORD=${POCKETBASE_ADMIN_PASSWORD}

  # LiveKit (Video Consultations)
  livekit:
    image: livekit/livekit-server:latest
    container_name: myjudicial-livekit
    restart: unless-stopped
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882/udp"
      - "50000-60000:50000-60000/tcp"
      - "50000-60000:50000-60000/udp"
    volumes:
      - ./livekit.yaml:/livekit.yaml
    command: --config /livekit.yaml

  # Ollama (AI)
  ollama:
    image: ollama/ollama:latest
    container_name: myjudicial-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        limits:
          memory: 2G

  # Nginx Proxy Manager
  nginx-proxy:
    image: jc21/nginx-proxy-manager:latest
    container_name: myjudicial-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - nginx_data:/data
      - nginx_letsencrypt:/etc/letsencrypt

volumes:
  postgres_data:
  redis_data:
  pocketbase_data:
  ollama_data:
  nginx_data:
  nginx_letsencrypt:
```


### Step 4: Create Dockerfile

Create `Dockerfile` if it doesn't exist:

```bash
nano Dockerfile
```

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["npm", "start"]
```

### Step 5: Create LiveKit Configuration

```bash
nano livekit.yaml
```

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true

keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}

webhook:
  urls:
    - ${BASE_URL}/api/v1/webhooks/livekit

logging:
  level: info
```


### Step 6: Build and Deploy

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
```

### Step 7: Initialize Database

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate

# Seed database (optional)
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### Step 8: Download AI Models

```bash
# Pull Qwen 2.5 model
docker compose -f docker-compose.prod.yml exec ollama ollama pull qwen2.5:1.5b-instruct

# Verify model is available
docker compose -f docker-compose.prod.yml exec ollama ollama list
```

---

## 9. Network & Security

### Configure Domain DNS

Point your domain to the OCI instance public IP:

**A Records:**
```
api.yourdomain.com    → <OCI_PUBLIC_IP>
ws.yourdomain.com     → <OCI_PUBLIC_IP>  (for LiveKit)
chat.yourdomain.com   → <OCI_PUBLIC_IP>  (for PocketBase)
```

### Setup Nginx Proxy Manager

1. Access Nginx Proxy Manager UI:
   ```
   http://<OCI_PUBLIC_IP>:81
   ```

2. **Default credentials:**
   - Email: `admin@example.com`
   - Password: `changeme`
   - **Change immediately!**

3. **Add Proxy Host for Backend API:**
   - Domain: `api.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname: `backend`
   - Forward Port: `3000`
   - Cache Assets: ✅
   - Block Common Exploits: ✅
   - SSL → Request New Certificate → Use Let's Encrypt


4. **Add Proxy Host for LiveKit:**
   - Domain: `ws.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname: `livekit`
   - Forward Port: `7880`
   - Websockets Support: ✅
   - SSL → Request New Certificate

5. **Add Proxy Host for PocketBase:**
   - Domain: `chat.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname: `pocketbase`
   - Forward Port: `8090`
   - SSL → Request New Certificate

---

## 10. SSL/TLS Configuration

SSL certificates are automatically obtained via Let's Encrypt through Nginx Proxy Manager.

### Manual Certificate Renewal (if needed)

```bash
docker compose -f docker-compose.prod.yml exec nginx-proxy certbot renew
```

### Verify SSL Configuration

```bash
# Test API endpoint
curl https://api.yourdomain.com/health

# Check SSL certificate
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com
```

---

## 11. Monitoring & Maintenance

### Health Checks

Create a monitoring script:

```bash
nano ~/monitor.sh
```

```bash
#!/bin/bash

echo "=== MyJudicial System Status ==="
echo ""

echo "Docker Containers:"
docker compose -f ~/myjudicial-backend/docker-compose.prod.yml ps
echo ""

echo "Disk Usage:"
df -h | grep -E '^/dev/'
echo ""

echo "Memory Usage:"
free -h
echo ""

echo "API Health:"
curl -s http://localhost:3000/health | jq .
echo ""

echo "Redis Status:"
docker compose -f ~/myjudicial-backend/docker-compose.prod.yml exec -T redis redis-cli -a $REDIS_PASSWORD ping
echo ""
```

Make it executable:
```bash
chmod +x ~/monitor.sh
```

Run periodically:
```bash
crontab -e
```

Add:
```
*/15 * * * * ~/monitor.sh >> ~/monitor.log 2>&1
```


### Log Management

View logs:
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

Log rotation:
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/docker-containers
```

```
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
```

### Database Backups

Create backup script:
```bash
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker compose -f ~/myjudicial-backend/docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres myjudicial | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup PocketBase
docker compose -f ~/myjudicial-backend/docker-compose.prod.yml exec -T pocketbase \
  tar czf - /pb/pb_data > $BACKUP_DIR/pocketbase_$DATE.tar.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Schedule daily backups:
```bash
chmod +x ~/backup-db.sh
crontab -e
```

Add:
```
0 2 * * * ~/backup-db.sh >> ~/backup.log 2>&1
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd ~/myjudicial-backend
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build

# Clean up old images
docker image prune -a -f
```


---

## 12. Cost Optimization

### Free Tier Limits

Monitor usage to stay within free tier:

| Resource | Free Tier Limit | Your Usage |
|----------|----------------|------------|
| Compute (A1) | 4 OCPUs, 24GB RAM | 4 OCPUs, 24GB |
| Block Storage | 200 GB | ~50 GB |
| Object Storage | 20 GB | Variable |
| Outbound Transfer | 10 TB/month | Monitor |

### Resource Management Tips

1. **Memory Allocation:**
   - Ollama: 2GB (adjustable in docker-compose)
   - PostgreSQL: 4GB (if self-hosted)
   - Backend: 3GB
   - LiveKit: 4GB
   - Others: ~3GB
   - Reserve: ~8GB for OS and buffers

2. **Storage Optimization:**
   ```bash
   # Clean Docker cache
   docker system prune -a --volumes -f
   
   # Remove old logs
   sudo find /var/lib/docker/containers -name "*.log" -mtime +7 -delete
   
   # Check disk usage
   du -sh /var/lib/docker/*
   ```

3. **Prevent Instance Eviction:**
   - Add cron job to keep CPU active:
   ```bash
   */15 * * * * stress-ng --cpu 1 --timeout 60s
   ```

### Cost Monitoring

Set up billing alerts in OCI Console:
1. **Governance → Budgets**
2. **Create Budget**
3. Set alert threshold (e.g., $1 for free tier breach warning)

---

## 13. Troubleshooting

### Common Issues

#### Issue 1: Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check resource usage
docker stats

# Restart specific container
docker compose -f docker-compose.prod.yml restart backend
```


#### Issue 2: Cannot Connect to Database

```bash
# Test PostgreSQL connection
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d myjudicial -c "SELECT version();"

# Check if database is accepting connections
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Verify .env database URL
grep DATABASE_URL .env
```

#### Issue 3: SSL Certificate Fails

```bash
# Check DNS propagation
nslookup api.yourdomain.com

# Verify port 80 and 443 are open
sudo netstat -tulpn | grep -E '(:80|:443)'

# Check Let's Encrypt rate limits
# (5 failures per hour, 50 certificates per domain per week)

# Try manual certificate
docker compose -f docker-compose.prod.yml exec nginx-proxy \
  certbot certonly --standalone -d api.yourdomain.com
```

#### Issue 4: High Memory Usage

```bash
# Check per-container memory
docker stats --no-stream

# Restart memory-heavy services
docker compose -f docker-compose.prod.yml restart ollama

# Adjust Ollama memory limit in docker-compose.prod.yml
```

#### Issue 5: LiveKit WebRTC Connection Issues

```bash
# Verify UDP ports are open
sudo ufw status | grep 50000:60000

# Check LiveKit logs
docker compose -f docker-compose.prod.yml logs livekit

# Test STUN/TURN connectivity
# Use: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
```

#### Issue 6: OCI Object Storage Access Denied

```bash
# Test S3 credentials
aws s3 ls s3://myjudicial-vault \
  --endpoint-url=$OCI_ENDPOINT \
  --profile oci

# Verify bucket policy allows your access key
# OCI Console → Bucket → Edit Visibility → Public or Private with correct policies
```


### Emergency Recovery

If system becomes unresponsive:

```bash
# SSH into instance
ssh -i /path/to/key ubuntu@<PUBLIC_IP>

# Stop all containers
docker compose -f docker-compose.prod.yml down

# Check system resources
free -h
df -h

# Clear Docker resources
docker system prune -a -f

# Restart services
docker compose -f docker-compose.prod.yml up -d

# Monitor startup
docker compose -f docker-compose.prod.yml logs -f
```

### Performance Tuning

#### PostgreSQL Optimization

Edit `docker-compose.prod.yml` and add to postgres service:

```yaml
command: >
  postgres
  -c shared_buffers=1GB
  -c effective_cache_size=3GB
  -c maintenance_work_mem=256MB
  -c checkpoint_completion_target=0.9
  -c wal_buffers=16MB
  -c default_statistics_target=100
  -c random_page_cost=1.1
  -c effective_io_concurrency=200
  -c work_mem=10MB
  -c min_wal_size=1GB
  -c max_wal_size=4GB
```

#### Backend API Optimization

Add to backend service environment:

```yaml
environment:
  - NODE_ENV=production
  - NODE_OPTIONS=--max-old-space-size=2048
  - UV_THREADPOOL_SIZE=8
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] OCI account created and verified
- [ ] Compute instance running (4 OCPUs, 24GB RAM)
- [ ] VCN and security rules configured
- [ ] Object Storage bucket created with S3 credentials
- [ ] Domain DNS records pointing to OCI IP
- [ ] Supabase project created (or PostgreSQL ready)
- [ ] Redis instance ready (Upstash or self-hosted)
- [ ] All external API keys obtained (Brevo, Flutterwave, LiveKit)
- [ ] SSH access to instance working


### Deployment

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned to instance
- [ ] `.env` file configured with production values
- [ ] `docker-compose.prod.yml` created
- [ ] `Dockerfile` created
- [ ] `livekit.yaml` configured
- [ ] Docker images built successfully
- [ ] All containers started
- [ ] Database migrations applied
- [ ] AI models downloaded (Qwen 2.5)

### Post-Deployment

- [ ] Nginx Proxy Manager configured
- [ ] SSL certificates obtained for all domains
- [ ] API health endpoint responding: `https://api.yourdomain.com/health`
- [ ] LiveKit WebRTC connectivity tested
- [ ] PocketBase admin panel accessible
- [ ] Object Storage upload/download tested
- [ ] Database backups scheduled
- [ ] Monitoring cron jobs configured
- [ ] Log rotation enabled
- [ ] Firewall rules verified (UFW + OCI Security Lists)
- [ ] Frontend updated with production API URLs
- [ ] Webhooks configured:
  - [ ] Flutterwave payment webhook
  - [ ] LiveKit room events webhook
  - [ ] Supabase Auth webhook

### Security Hardening

- [ ] Changed default Nginx Proxy Manager password
- [ ] SSH key-only authentication (password auth disabled)
- [ ] Fail2ban installed and configured
- [ ] PostgreSQL password rotated from default
- [ ] Redis password set
- [ ] PocketBase admin credentials secured
- [ ] OCI Customer Secret Keys stored securely
- [ ] Environment variables not committed to git
- [ ] CORS origins limited to production domains
- [ ] Rate limiting enabled on all API endpoints

---

## Additional Resources

### Documentation Links

- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Proxy Manager](https://nginxproxymanager.com/guide/)
- [Let's Encrypt](https://letsencrypt.org/docs/)
- [LiveKit Self-Hosting](https://docs.livekit.io/deploy/)


### OCI CLI Setup (Optional)

For advanced management:

```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Configure
oci setup config

# Test
oci os bucket list --compartment-id <your-compartment-id>
```

### Support Contacts

- **OCI Support:** [https://support.oracle.com](https://support.oracle.com)
- **Community Forums:** [https://cloudcustomerconnect.oracle.com](https://cloudcustomerconnect.oracle.com)

---

## Next Steps

After successful deployment:

1. **Frontend Deployment:**
   - Deploy Next.js frontend to Vercel
   - Update environment variables with production API URLs
   - Test end-to-end user flows

2. **External Service Configuration:**
   - Set up Flutterwave webhook endpoint
   - Configure LiveKit webhook for escrow release
   - Set up Supabase Auth webhook for user sync

3. **Testing:**
   - Perform load testing
   - Test video consultation flow
   - Verify payment escrow cycle
   - Test AI triage with Kinyarwanda input
   - Verify document encryption and storage

4. **Monitoring Setup:**
   - Set up Uptime monitoring (UptimeRobot, Pingdom)
   - Configure error tracking (Sentry)
   - Set up log aggregation (if needed)

5. **Documentation:**
   - Document deployment process for team
   - Create runbooks for common operations
   - Document disaster recovery procedures

---

## Conclusion

You now have a production-ready MyJudicial deployment on Oracle Cloud Infrastructure. This setup provides:

✅ **Scalable Infrastructure** — ARM-based compute optimized for AI workloads  
✅ **Cost-Effective** — Runs entirely on OCI free tier  
✅ **Secure** — SSL/TLS, encrypted storage, firewall protection  
✅ **Resilient** — Auto-restart containers, health checks, backups  
✅ **Observable** — Logging, monitoring, health endpoints  

For questions or issues, refer to the troubleshooting section or contact your DevOps team.

**Happy deploying! 🚀**

---

*MyJudicial | Kigali, Rwanda | myjudicial.com*
