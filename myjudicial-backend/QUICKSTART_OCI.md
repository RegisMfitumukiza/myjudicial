# 🚀 MyJudicial Oracle Cloud - Quick Start Guide

## Overview

This guide will get your MyJudicial platform running on Oracle Cloud Infrastructure in under 2 hours.

## Prerequisites Checklist

Before starting, ensure you have:

### Accounts
- [ ] Oracle Cloud account created
- [ ] Domain name registered and accessible
- [ ] Supabase project created OR plan to self-host PostgreSQL
- [ ] Brevo account (for emails)
- [ ] Flutterwave account (for payments)
- [ ] Meta Business account (for WhatsApp)
- [ ] LiveKit account OR plan to self-host

### Local Setup
- [ ] SSH client installed
- [ ] Git installed
- [ ] Access to your domain's DNS settings

## Step-by-Step Deployment

### Phase 1: OCI Setup (30 minutes)

#### 1.1 Create Compute Instance

1. **Login to OCI Console:** https://cloud.oracle.com
2. **Navigate to:** Compute → Instances → Create Instance
3. **Configure:**
   - **Name:** myjudicial-server
   - **Image:** Ubuntu 22.04 (ARM64)
   - **Shape:** VM.Standard.A1.Flex (4 OCPUs, 24GB RAM)
   - **Network:** Create new VCN or use existing
   - **SSH Keys:** Generate new or upload existing
4. **Click:** Create
5. **Note:** Save the public IP address

#### 1.2 Configure Network Security

1. **Navigate to:** Networking → Virtual Cloud Networks → Your VCN
2. **Go to:** Security Lists → Default Security List
3. **Add Ingress Rules:**

```
Port 22   (SSH)
Port 80   (HTTP)
Port 443  (HTTPS)
Port 3000 (Backend API - optional for direct access)
Port 7880 (LiveKit)
Port 50000-60000 (WebRTC - both TCP and UDP)
Port 8090 (PocketBase)
Port 81   (Nginx Admin)
```

#### 1.3 Create Object Storage Bucket

1. **Navigate to:** Storage → Buckets → Create Bucket
2. **Name:** myjudicial-vault
3. **Click:** Create
4. **Generate S3 Keys:**
   - Identity → Users → Your User → Customer Secret Keys
   - Generate Secret Key
   - **Save:** Access Key ID and Secret Key

### Phase 2: Server Setup (20 minutes)

#### 2.1 Connect to Instance

```bash
# Windows (use IP from OCI console)
ssh -i path\to\private-key ubuntu@<PUBLIC_IP>

# Linux/Mac
ssh -i /path/to/private-key ubuntu@<PUBLIC_IP>
```

#### 2.2 Configure OS Firewall

```bash
# Allow required ports
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 7880/tcp
sudo ufw allow 50000:60000/tcp
sudo ufw allow 50000:60000/udp
sudo ufw allow 8090/tcp
sudo ufw allow 81/tcp

# Enable firewall
sudo ufw --force enable
```

#### 2.3 Install Docker

```bash
# Run installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Logout and login again for changes to take effect
exit
```


### Phase 3: Application Deployment (30 minutes)

#### 3.1 Clone Repository

```bash
# SSH back into your instance
ssh -i /path/to/private-key ubuntu@<PUBLIC_IP>

# Clone the repository
cd ~
git clone https://github.com/yourusername/myjudicial-backend.git
cd myjudicial-backend
```

#### 3.2 Configure Environment

**Option A: Interactive Setup (Recommended)**
```bash
chmod +x setup-environment.sh
./setup-environment.sh
```

**Option B: Manual Setup**
```bash
# Copy example file
cp .env.example .env

# Edit configuration
nano .env
```

**Required Variables:**
- `DATABASE_URL` - Your Supabase or PostgreSQL connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)
- `REDIS_URL` - Upstash Redis or self-hosted
- `OCI_ENDPOINT`, `OCI_ACCESS_KEY_ID`, `OCI_SECRET_ACCESS_KEY` - From Phase 1
- `BREVO_API_KEY` - From Brevo dashboard
- `FLW_SECRET_KEY` - From Flutterwave
- `WHATSAPP_ACCESS_TOKEN` - From Meta Business
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` - From LiveKit
- `BASE_URL`, `FRONTEND_URL` - Your domain URLs

#### 3.3 Deploy with Automation

```bash
# Make script executable
chmod +x deploy-oci.sh

# Run deployment
./deploy-oci.sh
```

**Or Deploy Manually:**
```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# Run migrations
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate

# Download AI models
docker compose -f docker-compose.prod.yml exec ollama ollama pull qwen2.5:1.5b-instruct
```

#### 3.4 Verify Deployment

```bash
# Make health check executable
chmod +x health-check.sh

# Run health check
./health-check.sh
```

Expected output: All services showing ✓ OK

### Phase 4: Domain & SSL Setup (20 minutes)

#### 4.1 Configure DNS

Point these records to your OCI public IP:

```
A    api.yourdomain.com        → <OCI_PUBLIC_IP>
A    ws.yourdomain.com         → <OCI_PUBLIC_IP>
A    chat.yourdomain.com       → <OCI_PUBLIC_IP>
```

Wait 5-10 minutes for DNS propagation.

#### 4.2 Setup Nginx Proxy Manager

1. **Access Admin UI:**
   ```
   http://<OCI_PUBLIC_IP>:81
   ```

2. **Login with default credentials:**
   - Email: `admin@example.com`
   - Password: `changeme`
   - **Change these immediately!**

3. **Add Proxy Host for Backend API:**
   - **Hosts** → **Add Proxy Host**
   - **Domain Names:** `api.yourdomain.com`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `backend`
   - **Forward Port:** `3000`
   - **SSL** → Request New SSL Certificate
   - **Force SSL:** ✅
   - **HTTP/2 Support:** ✅

4. **Add Proxy Host for LiveKit:**
   - **Domain Names:** `ws.yourdomain.com`
   - **Forward Hostname/IP:** `livekit`
   - **Forward Port:** `7880`
   - **Websockets Support:** ✅
   - **SSL** → Request New SSL Certificate

5. **Add Proxy Host for PocketBase:**
   - **Domain Names:** `chat.yourdomain.com`
   - **Forward Hostname/IP:** `pocketbase`
   - **Forward Port:** `8090`
   - **SSL** → Request New SSL Certificate

#### 4.3 Test SSL Configuration

```bash
# Test API
curl https://api.yourdomain.com/health

# Should return: {"status":"ok"}
```

### Phase 5: Integration & Testing (30 minutes)

#### 5.1 Configure External Webhooks

**Flutterwave:**
1. Dashboard → Settings → Webhooks
2. URL: `https://api.yourdomain.com/api/v1/payments/webhook`
3. Secret: Use value from `.env` (`FLW_WEBHOOK_SECRET`)

**WhatsApp:**
1. Meta Business Suite → WhatsApp → Configuration
2. Webhook URL: `https://api.yourdomain.com/api/v1/whatsapp/webhook`
3. Verify Token: Use value from `.env` (`WHATSAPP_VERIFY_TOKEN`)
4. Subscribe to: `messages`, `message_status`

**LiveKit:**
1. LiveKit Dashboard → Webhooks
2. URL: `https://api.yourdomain.com/api/v1/webhooks/livekit`
3. Events: `room_finished`

#### 5.2 Create Admin User

```bash
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

#### 5.3 Test Core Functionality

**API Health:**
```bash
curl https://api.yourdomain.com/health
```

**PocketBase:**
```bash
curl https://chat.yourdomain.com/api/health
```

**LiveKit:**
```bash
curl https://ws.yourdomain.com/
```

### Phase 6: Frontend Deployment

#### 6.1 Deploy to Vercel

```bash
# In your frontend directory
cd ~/myjudicial-frontend

# Update .env.production
nano .env.production
```

Add:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_LIVEKIT_URL=wss://ws.yourdomain.com
NEXT_PUBLIC_POCKETBASE_URL=https://chat.yourdomain.com
```

Deploy:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### 6.2 Update CORS

Update backend `.env`:
```bash
CORS_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Restart backend:
```bash
docker compose -f docker-compose.prod.yml restart backend
```


## Post-Deployment

### Set Up Automated Backups

```bash
# Make backup script executable
chmod +x ~/myjudicial-backend/backup-db.sh

# Schedule daily backups at 2 AM
crontab -e
```

Add this line:
```
0 2 * * * ~/myjudicial-backend/backup-db.sh >> ~/backup.log 2>&1
```

### Set Up Monitoring

```bash
# Make monitoring script executable
chmod +x ~/myjudicial-backend/monitor.sh

# Schedule checks every 15 minutes
crontab -e
```

Add this line:
```
*/15 * * * * ~/myjudicial-backend/monitor.sh >> ~/monitor.log 2>&1
```

### Set Up Maintenance Tool

```bash
# Make maintenance script executable
chmod +x ~/myjudicial-backend/maintenance.sh

# Run it anytime for management
~/myjudicial-backend/maintenance.sh
```

## Ongoing Operations

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services
```bash
# All services
docker compose -f docker-compose.prod.yml restart

# Specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Update Application
```bash
cd ~/myjudicial-backend
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Check System Health
```bash
cd ~/myjudicial-backend
./health-check.sh
```

### Access Maintenance Menu
```bash
cd ~/myjudicial-backend
./maintenance.sh
```

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check resources
docker stats
free -h
df -h
```

### Can't Access API
```bash
# Check if services are running
docker compose -f docker-compose.prod.yml ps

# Check if ports are open
sudo ufw status
sudo netstat -tulpn | grep -E '(80|443|3000)'

# Check DNS
nslookup api.yourdomain.com
```

### SSL Certificate Issues
```bash
# Check DNS first
nslookup api.yourdomain.com

# Verify port 80 is accessible (required for Let's Encrypt)
curl -I http://api.yourdomain.com

# Try manual certificate in Nginx Proxy Manager UI
```

### Database Connection Errors
```bash
# Test database connection
docker compose -f docker-compose.prod.yml exec backend npm run db:validate

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify DATABASE_URL in .env
grep DATABASE_URL .env
```

### Out of Memory
```bash
# Check memory usage
free -h
docker stats

# Adjust memory limits in docker-compose.prod.yml
# Restart services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

## Performance Optimization

### Reduce Memory Usage

Edit `docker-compose.prod.yml` and adjust memory limits:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Reduce as needed
```

### Enable Swap (if needed)
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Security Hardening

### Disable SSH Password Authentication
```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### Install Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates
```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Docker image updates
cd ~/myjudicial-backend
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Cost Management

### Stay Within Free Tier

**Monitor Usage:**
- OCI Console → Governance → Budgets
- Set alert at $1 (to catch any billing)

**Optimize Resources:**
- Review container memory limits
- Clean up old Docker images: `docker image prune -a`
- Rotate logs regularly
- Use Object Storage wisely (20GB free)

### External Services Budget

| Service | Free Tier | Monthly Cost (estimated) |
|---------|-----------|--------------------------|
| Supabase | 500MB DB | $0 (within free tier) |
| Upstash Redis | 10K commands/day | $0 (within free tier) |
| Brevo | 300 emails/day | $0 (within free tier) |
| Vercel | 100GB bandwidth | $0 (within free tier) |
| Flutterwave | No fee | Transaction fees only |
| WhatsApp | 1K conversations | $0 (within free tier) |
| **Total** | | **$0-10/month** |

## Success Checklist

- [ ] All services running (check with `./health-check.sh`)
- [ ] API accessible via HTTPS
- [ ] SSL certificates obtained for all domains
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] AI models downloaded
- [ ] External webhooks configured
- [ ] Frontend deployed and connected
- [ ] Backups scheduled
- [ ] Monitoring enabled
- [ ] Security hardening applied
- [ ] Documentation reviewed

## Support

### Documentation
- **Full Guide:** `docs/ORACLE_CLOUD_DEPLOYMENT_GUIDE.md`
- **Environment Variables:** `docs/ENVIRONMENT_VARIABLES.md`
- **Architecture:** `docs/architecture/MyJudicial_Master_Build_Reference.md`

### Useful Commands Quick Reference
```bash
# View all running containers
docker ps

# View service status
docker compose -f docker-compose.prod.yml ps

# Follow logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Execute command in container
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate

# Check system resources
htop
docker stats
df -h
free -h

# Run maintenance menu
./maintenance.sh

# Check health
./health-check.sh
```

---

**Congratulations! Your MyJudicial platform is now live on Oracle Cloud! 🎉**

*For questions or issues, refer to the comprehensive deployment guide or troubleshooting section.*
