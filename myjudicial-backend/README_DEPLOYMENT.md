# MyJudicial Backend - Deployment Guide

> Complete deployment solution for Oracle Cloud Infrastructure

## 📚 Documentation Structure

This repository includes comprehensive deployment documentation:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[QUICKSTART_OCI.md](./QUICKSTART_OCI.md)** | Fast deployment guide | Start here for step-by-step instructions |
| **[docs/ORACLE_CLOUD_DEPLOYMENT_GUIDE.md](./docs/ORACLE_CLOUD_DEPLOYMENT_GUIDE.md)** | Comprehensive guide | Deep dive into all aspects |
| **[DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md)** | Overview and checklist | Quick reference |

## 🚀 Quick Start

### Prerequisites

1. **Oracle Cloud account** (with Always Free Tier)
2. **Domain name** for your application
3. **External service accounts:**
   - Supabase (database) or self-host
   - Brevo (email)
   - Flutterwave (payments)
   - Meta Business (WhatsApp)
   - LiveKit (video) or self-host

### Deployment in 5 Commands

```bash
# 1. Clone repository
git clone <your-repo-url> myjudicial-backend
cd myjudicial-backend

# 2. Make scripts executable
chmod +x setup-scripts.sh && ./setup-scripts.sh

# 3. Configure environment
./setup-environment.sh

# 4. Deploy
./deploy-oci.sh

# 5. Check health
./health-check.sh
```

That's it! Your backend is now running.

## 📦 What's Included

### Automated Scripts

| Script | Description |
|--------|-------------|
| `setup-scripts.sh` | Makes all scripts executable |
| `setup-environment.sh` | Interactive .env configuration |
| `deploy-oci.sh` | Full automated deployment |
| `health-check.sh` | Verify all services are running |
| `maintenance.sh` | Interactive maintenance menu |
| `backup-db.sh` | Database backup utility |
| `monitor.sh` | System monitoring script |

### Docker Configuration

| File | Purpose |
|------|---------|
| `Dockerfile` | Optimized production image |
| `docker-compose.prod.yml` | Complete service orchestration |
| `.dockerignore` | Exclude unnecessary files |
| `livekit.yaml` | LiveKit video server config |

### Documentation

- Comprehensive deployment guides
- Architecture documentation
- Troubleshooting guides
- API documentation
- Security checklists

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│     Oracle Cloud Compute Instance           │
│     (4 OCPUs, 24GB RAM, ARM)               │
├─────────────────────────────────────────────┤
│  Docker Services:                           │
│  ├─ Backend API (Node.js + Express)        │
│  ├─ PostgreSQL 16 + PostGIS                │
│  ├─ Redis (cache)                           │
│  ├─ PocketBase (chat)                       │
│  ├─ LiveKit (video)                         │
│  ├─ Ollama + Qwen 2.5 (AI)                 │
│  └─ Nginx Proxy Manager (SSL)              │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│     OCI Object Storage (20GB Free)          │
│     • Encrypted document vault              │
└─────────────────────────────────────────────┘
```

## 💰 Cost Estimate

### Oracle Cloud (Always Free)
- **Compute:** 4 OCPUs, 24GB RAM ✅ **$0/month**
- **Storage:** 200GB block storage ✅ **$0/month**
- **Object Storage:** 20GB ✅ **$0/month**
- **Network:** 10TB outbound ✅ **$0/month**

### External Services (Free Tiers Available)
- **Supabase:** 500MB database, 2GB bandwidth → **$0/month**
- **Upstash Redis:** 10K commands/day → **$0/month**
- **Brevo:** 300 emails/day → **$0/month**
- **Vercel:** 100GB bandwidth → **$0/month**
- **Flutterwave:** Transaction fees only → **~2% per transaction**
- **WhatsApp:** 1K conversations/month → **$0/month**

**Total Monthly Cost:** **$0-10** (depending on usage beyond free tiers)

## 🔒 Security Features

- ✅ TLS 1.3 encryption on all endpoints
- ✅ Automated SSL certificate management (Let's Encrypt)
- ✅ UFW firewall + OCI Security Lists
- ✅ Non-root container execution
- ✅ Environment variable isolation
- ✅ Rate limiting on all API endpoints
- ✅ Database connection pooling
- ✅ Regular security updates via Docker

## 📊 Resource Allocation

| Service | Memory | CPU Priority |
|---------|--------|--------------|
| Backend API | 3 GB | High |
| PostgreSQL | 4 GB | High |
| LiveKit | 4 GB | High |
| Ollama/AI | 2 GB | Medium |
| Redis | 512 MB | Low |
| PocketBase | 1 GB | Medium |
| Nginx | 512 MB | Low |
| System/Buffer | ~8 GB | - |

## 🛠️ Management Tools

### Maintenance Menu

Access interactive management:
```bash
./maintenance.sh
```

Features:
- View service status
- Stream logs
- Restart services
- Database backup/restore
- System resource monitoring
- Docker cleanup
- Update and rebuild

### Health Monitoring

Comprehensive health check:
```bash
./health-check.sh
```

Checks:
- Backend API health
- Database connectivity
- Redis availability
- Service ports
- Container status
- System resources

### Automated Backups

Schedule daily backups:
```bash
# Edit crontab
crontab -e

# Add this line for 2 AM daily backups
0 2 * * * ~/myjudicial-backend/backup-db.sh >> ~/backup.log 2>&1
```

## 📖 Step-by-Step Guides

### For First-Time Deployment

1. **Read:** [QUICKSTART_OCI.md](./QUICKSTART_OCI.md)
2. **Follow:** Step-by-step instructions
3. **Verify:** Run health check
4. **Configure:** External webhooks

### For Detailed Information

1. **Read:** [docs/ORACLE_CLOUD_DEPLOYMENT_GUIDE.md](./docs/ORACLE_CLOUD_DEPLOYMENT_GUIDE.md)
2. **Understand:** Architecture decisions
3. **Customize:** Based on your needs
4. **Optimize:** Performance and costs

### For Troubleshooting

1. **Check:** Troubleshooting section in comprehensive guide
2. **Run:** `./health-check.sh`
3. **View logs:** `docker compose -f docker-compose.prod.yml logs`
4. **Consult:** Community or documentation

## 🔄 Update Procedure

```bash
cd ~/myjudicial-backend

# Pull latest changes
git pull

# Rebuild images
docker compose -f docker-compose.prod.yml build

# Restart with new images
docker compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate

# Verify
./health-check.sh
```

## 🆘 Common Issues & Solutions

### Service Won't Start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Check resources
docker stats
free -h

# Restart
docker compose -f docker-compose.prod.yml restart <service-name>
```

### Can't Access API
```bash
# Check DNS
nslookup api.yourdomain.com

# Check firewall
sudo ufw status

# Check service
curl http://localhost:3000/health
```

### Out of Memory
```bash
# Check usage
docker stats

# Adjust limits in docker-compose.prod.yml
# Restart services
docker compose -f docker-compose.prod.yml restart
```

## 📞 Support

### Documentation
- [Comprehensive Deployment Guide](./docs/ORACLE_CLOUD_DEPLOYMENT_GUIDE.md)
- [Quick Start Guide](./QUICKSTART_OCI.md)
- [Architecture Reference](./docs/architecture/MyJudicial_Master_Build_Reference.md)

### Community
- GitHub Issues
- Project Documentation
- OCI Community Forums

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] OCI account created
- [ ] Compute instance running
- [ ] Domain DNS configured
- [ ] Object Storage bucket created
- [ ] External service accounts ready
- [ ] All API keys obtained

### Deployment
- [ ] Scripts made executable
- [ ] Environment configured (.env)
- [ ] Docker images built
- [ ] Services started
- [ ] Migrations run
- [ ] Health check passed

### Post-Deployment
- [ ] SSL certificates obtained
- [ ] External webhooks configured
- [ ] Backups scheduled
- [ ] Monitoring enabled
- [ ] Frontend deployed
- [ ] End-to-end testing complete

## 🎯 Next Steps

After successful deployment:

1. **Deploy Frontend:**
   - Deploy Next.js frontend to Vercel
   - Configure environment variables
   - Test integration

2. **Configure Webhooks:**
   - Flutterwave payment webhook
   - WhatsApp Cloud API webhook
   - LiveKit room events

3. **Test Thoroughly:**
   - User registration/login
   - Expert discovery
   - Booking flow
   - Video consultations
   - Payment processing

4. **Go Live:**
   - Announce launch
   - Monitor performance
   - Gather feedback

---

**Ready to deploy? Start with [QUICKSTART_OCI.md](./QUICKSTART_OCI.md)!** 🚀

*MyJudicial | Kigali, Rwanda | myjudicial.com*
