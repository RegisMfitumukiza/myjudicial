# 📋 MyJudicial Pre-Deployment Checklist

Before you begin deployment, use this checklist to ensure you have everything ready.

## ✅ Oracle Cloud Infrastructure

### Account Setup
- [ ] Oracle Cloud account created at [cloud.oracle.com](https://cloud.oracle.com)
- [ ] Payment method added (required even for free tier)
- [ ] Home region selected (Mumbai `ap-mumbai-1` or Jeddah `me-jeddah-1` recommended for Rwanda)
- [ ] Identity verification completed

### Free Tier Verification
- [ ] Confirmed 4 OCPUs available for VM.Standard.A1.Flex
- [ ] Confirmed 200GB block storage available
- [ ] Confirmed 20GB object storage available

### Network
- [ ] VCN (Virtual Cloud Network) created
- [ ] Public subnet configured
- [ ] Internet Gateway attached
- [ ] Security Lists configured (ports 22, 80, 443, etc.)

### Compute
- [ ] VM.Standard.A1.Flex instance created (4 OCPUs, 24GB RAM)
- [ ] Ubuntu 22.04 ARM64 image selected
- [ ] SSH key pair generated/uploaded
- [ ] Public IP address assigned
- [ ] Public IP address noted: `___________________`

### Object Storage
- [ ] Bucket created (name: `myjudicial-vault`)
- [ ] Customer Secret Keys generated
- [ ] Access Key ID saved: `___________________`
- [ ] Secret Access Key saved: `___________________`
- [ ] Namespace noted: `___________________`
- [ ] Region noted: `___________________`

## ✅ Domain & DNS

### Domain
- [ ] Domain name registered
- [ ] Domain name: `___________________`
- [ ] Access to DNS management panel

### DNS Records Ready
- [ ] A record for API: `api.yourdomain.com` → OCI IP
- [ ] A record for WebSocket: `ws.yourdomain.com` → OCI IP
- [ ] A record for Chat: `chat.yourdomain.com` → OCI IP
- [ ] (Optional) A record for main app: `yourdomain.com` → Vercel

## ✅ External Services - Database

### Option A: Supabase (Recommended)
- [ ] Account created at [supabase.com](https://supabase.com)
- [ ] New project created
- [ ] Project region selected (closest to Rwanda)
- [ ] PostGIS extension enabled: `CREATE EXTENSION IF NOT EXISTS postgis;`
- [ ] Database URL (pooler) copied: `postgresql://...`
- [ ] Direct URL copied: `postgresql://...`
- [ ] Project URL copied: `https://xxx.supabase.co`
- [ ] Anon Key copied: `eyJ...`
- [ ] Service Role Key copied: `eyJ...`

### Option B: Self-Hosted PostgreSQL
- [ ] Will use self-hosted PostgreSQL on OCI
- [ ] Strong password generated for PostgreSQL

## ✅ External Services - Redis

### Option A: Upstash (Recommended)
- [ ] Account created at [upstash.com](https://upstash.com)
- [ ] Redis database created
- [ ] Region selected (closest to Rwanda)
- [ ] Redis URL copied: `rediss://...`

### Option B: Self-Hosted Redis
- [ ] Will use self-hosted Redis on OCI
- [ ] Strong password generated for Redis

## ✅ External Services - Email

### Brevo (Required)
- [ ] Account created at [brevo.com](https://brevo.com)
- [ ] Domain verified for sending
- [ ] API key generated
- [ ] API key saved: `xkeysib-...`
- [ ] Sender email verified: `___________________`

## ✅ External Services - Payments

### Flutterwave (Required)
- [ ] Account created at [flutterwave.com](https://flutterwave.com)
- [ ] Business verification completed
- [ ] Test mode enabled for initial testing
- [ ] Public Key copied: `FLWPUBK...`
- [ ] Secret Key copied: `FLWSECK...`
- [ ] Webhook secret generated: `___________________`
- [ ] Webhook URL ready: `https://api.yourdomain.com/api/v1/payments/webhook`

## ✅ External Services - WhatsApp

### Meta Business (Required)
- [ ] Meta Business account created
- [ ] WhatsApp Business API enabled
- [ ] Phone number registered
- [ ] Access token generated
- [ ] Access token saved: `___________________`
- [ ] Phone Number ID copied: `___________________`
- [ ] Business Account ID copied: `___________________`
- [ ] Webhook verify token generated: `___________________`
- [ ] Webhook URL ready: `https://api.yourdomain.com/api/v1/whatsapp/webhook`
- [ ] Message templates submitted for approval

## ✅ External Services - Video

### Option A: LiveKit Cloud (Recommended for MVP)
- [ ] Account created at [livekit.io](https://livekit.io)
- [ ] Project created
- [ ] API Key copied: `___________________`
- [ ] API Secret copied: `___________________`
- [ ] WebSocket URL copied: `wss://...`

### Option B: Self-Hosted LiveKit
- [ ] Will use self-hosted LiveKit on OCI
- [ ] API keys generated locally

## ✅ External Services - Chat

### PocketBase (Self-Hosted)
- [ ] Will use self-hosted PocketBase on OCI
- [ ] Admin email decided: `___________________`
- [ ] Strong admin password generated

## ✅ Local Tools & Access

### Required Tools
- [ ] SSH client installed (OpenSSH, PuTTY, or similar)
- [ ] Git installed and configured
- [ ] Text editor available (nano, vim, VS Code, etc.)
- [ ] (Optional) OCI CLI installed

### SSH Access
- [ ] Can SSH into OCI instance
- [ ] SSH command tested: `ssh -i key ubuntu@<IP>`
- [ ] SSH key file location: `___________________`

## ✅ Environment Variables Prepared

### Required Values
- [ ] `NODE_ENV`: `production`
- [ ] `PORT`: `3000`
- [ ] `DATABASE_URL`: From Supabase or self-hosted
- [ ] `DIRECT_URL`: From Supabase or self-hosted
- [ ] `SUPABASE_URL`: From Supabase
- [ ] `SUPABASE_ANON_KEY`: From Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY`: From Supabase
- [ ] `REDIS_URL`: From Upstash or self-hosted
- [ ] `OCI_ENDPOINT`: Your OCI endpoint
- [ ] `OCI_BUCKET_NAME`: `myjudicial-vault`
- [ ] `OCI_ACCESS_KEY_ID`: From OCI
- [ ] `OCI_SECRET_ACCESS_KEY`: From OCI
- [ ] `BREVO_API_KEY`: From Brevo
- [ ] `EMAIL_FROM_ADDRESS`: Your verified email
- [ ] `FLW_PUBLIC_KEY`: From Flutterwave
- [ ] `FLW_SECRET_KEY`: From Flutterwave
- [ ] `FLW_WEBHOOK_SECRET`: Generated secret
- [ ] `WHATSAPP_ACCESS_TOKEN`: From Meta
- [ ] `WHATSAPP_PHONE_NUMBER_ID`: From Meta
- [ ] `WHATSAPP_VERIFY_TOKEN`: Generated secret
- [ ] `LIVEKIT_API_KEY`: From LiveKit
- [ ] `LIVEKIT_API_SECRET`: From LiveKit
- [ ] `LIVEKIT_HOST`: Your LiveKit URL
- [ ] `BASE_URL`: `https://api.yourdomain.com`
- [ ] `FRONTEND_URL`: `https://yourdomain.com`
- [ ] `ADMIN_EMAIL`: Your admin email
- [ ] `ADMIN_PASSWORD`: Strong password

## ✅ Security Preparation

### Passwords & Secrets
- [ ] Strong admin password generated (min 12 chars)
- [ ] PostgreSQL password generated (if self-hosting)
- [ ] Redis password generated (if self-hosting)
- [ ] PocketBase admin password generated
- [ ] Webhook secrets generated (32+ random characters)
- [ ] All passwords stored securely (password manager)

### Security Best Practices
- [ ] Will NOT commit .env file to git
- [ ] Will change default Nginx Proxy Manager password
- [ ] Will use SSH keys only (no password authentication)
- [ ] Will enable UFW firewall
- [ ] Will keep system updated

## ✅ Repository Setup

### Code Ready
- [ ] Repository cloned locally for review
- [ ] Frontend repository available (if separate)
- [ ] All dependencies documented
- [ ] Build process tested locally

### Git Configuration
- [ ] Git credentials configured
- [ ] Repository URL accessible: `___________________`
- [ ] SSH keys added to Git provider (if using SSH)

## ✅ Backup & Recovery Plan

### Backup Strategy
- [ ] Backup location decided (local, S3, etc.)
- [ ] Backup frequency decided (daily recommended)
- [ ] Retention policy decided (7 days minimum)
- [ ] Recovery procedure documented

### Disaster Recovery
- [ ] Backup restoration tested
- [ ] Alternative deployment region identified
- [ ] Failover plan documented
- [ ] Team contacts for emergencies

## ✅ Monitoring & Alerting

### Monitoring Setup
- [ ] Health check endpoints identified
- [ ] Monitoring frequency decided (every 5-15 minutes)
- [ ] Alert recipients identified
- [ ] Incident response plan outlined

### Optional Services
- [ ] Uptime monitoring (UptimeRobot, Pingdom) - Optional
- [ ] Error tracking (Sentry) - Optional
- [ ] Log aggregation (Papertrail, Loggly) - Optional

## ✅ Team & Documentation

### Team Access
- [ ] Team members identified
- [ ] Access levels defined
- [ ] OCI access shared (if team)
- [ ] Shared secrets location decided

### Documentation
- [ ] Deployment guide reviewed
- [ ] Architecture understood
- [ ] API documentation available
- [ ] Runbook created for common operations

## ✅ Testing Plan

### Post-Deployment Testing
- [ ] Health check endpoints
- [ ] User registration/login
- [ ] Expert discovery and map
- [ ] Booking creation
- [ ] Payment flow
- [ ] Video consultation
- [ ] Document upload/download
- [ ] Email notifications
- [ ] WhatsApp notifications

### Load Testing (Optional but Recommended)
- [ ] Load testing tool chosen
- [ ] Test scenarios defined
- [ ] Expected capacity documented

## ✅ Timeline & Schedule

### Deployment Schedule
- [ ] Deployment date/time decided
- [ ] Team availability confirmed
- [ ] Maintenance window communicated
- [ ] Rollback plan prepared

### Estimated Timeline
- OCI Setup: 30-60 minutes
- Server Configuration: 20-30 minutes
- Application Deployment: 30-45 minutes
- SSL Configuration: 20-30 minutes
- Testing: 30-60 minutes
- **Total: 2-3 hours**

## ✅ Final Checks

### Before Starting Deployment
- [ ] All checkboxes above completed
- [ ] All credentials saved securely
- [ ] Deployment documentation reviewed
- [ ] Team notified of deployment
- [ ] Backup of current state (if updating)

### Emergency Contacts
- [ ] OCI support contact saved
- [ ] Team lead contact: `___________________`
- [ ] DevOps contact: `___________________`
- [ ] On-call contact: `___________________`

---

## 🎯 Ready to Deploy?

Once all items are checked:

1. **Review** [QUICKSTART_OCI.md](./QUICKSTART_OCI.md)
2. **SSH into your OCI instance**
3. **Run**: `./setup-environment.sh`
4. **Run**: `./deploy-oci.sh`
5. **Verify**: `./health-check.sh`

**Good luck! 🚀**

---

*Last updated: $(date)*
