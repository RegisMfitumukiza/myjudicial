# Environment Variables Reference

**Last Updated:** 2026-06-30  
**Purpose:** Complete guide to all environment variables used in MyJudicial backend

---

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values marked with `your_*_here`

3. Verify configuration:
   ```bash
   npm run build
   npm run dev
   ```

---

## Required Variables (MVP)

These variables MUST be set for the application to start:

### Database
- `DATABASE_URL` - PostgreSQL connection string (transaction pooler)
- `DIRECT_URL` - PostgreSQL connection string (migrations)

### Authentication
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Redis
- `REDIS_URL` - Redis connection string

### Email
- `BREVO_API_KEY` - Brevo API key for sending emails
- `EMAIL_FROM_NAME` - Sender name for emails
- `EMAIL_FROM_ADDRESS` - Verified sender email address

### Frontend
- `FRONTEND_URL` - Frontend application URL (for CORS and links)
- `CORS_ORIGIN` - Allowed CORS origin

---

## Optional Variables (Feature-Specific)

### PocketBase (Real-time Chat)
**Status:** ✅ Implemented  
**Required for:** Real-time WebSocket chat features

```env
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@myjudicial.com
POCKETBASE_ADMIN_PASSWORD=generate_secure_password_here
```

**Setup Guide:** `docs/prompts/phase-1/POCKETBASE_SETUP_GUIDE.md`

**How to Get:**
1. Deploy PocketBase instance (Docker/Standalone/Cloud)
2. Access admin UI at `http://localhost:8090/_/`
3. Create admin account
4. Create collections: `messages`, `typing_indicators`
5. Configure API rules (see setup guide)

**Note:** Chat REST API works without PocketBase. WebSocket real-time features require PocketBase deployment.

---

### LiveKit (Video Consultations)
**Status:** ✅ Implemented  
**Required for:** Video consultation calls

```env
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_HOST=https://your-project.livekit.cloud
```

**How to Get:**
1. Create account at https://livekit.io
2. Create a project
3. Get API Key and Secret from Dashboard → Settings → Keys
4. Copy WebSocket URL

---

### OCI Object Storage (Document Vault)
**Status:** ✅ Implemented  
**Required for:** Encrypted document storage

```env
OCI_ENDPOINT=https://[namespace].compat.objectstorage.[region].oraclecloud.com
OCI_BUCKET_NAME=myjudicial-vault
OCI_REGION=us-ashburn-1
OCI_ACCESS_KEY_ID=your_access_key
OCI_SECRET_ACCESS_KEY=your_secret_key
OCI_KMS_ENDPOINT=https://[id]-crypto.kms.[region].oci.oraclecloud.com
OCI_KMS_MASTER_KEY_ID=ocid1.key.oc1...
OCI_SIGNED_URL_EXPIRY_SECONDS=900
```

**How to Get:**
1. OCI Console → Storage → Buckets → Create Bucket
2. OCI Console → Identity → Users → Customer Secret Keys → Generate
3. OCI Console → Identity → Vault → Create Vault → Create Master Key
4. Copy namespace from bucket details

---

## Configuration Variables

### Platform Settings

```env
PLATFORM_COMMISSION=0.15            # 15% commission rate
LOG_LEVEL=info                      # Log level (debug, info, warn, error)
NODE_ENV=development                # Environment (development, production)
PORT=3000                           # Server port
```

### Admin Seed (Development Only)

```env
ADMIN_EMAIL=admin@myjudicial.com
ADMIN_FULL_NAME=MyJudicial Admin
ADMIN_PASSWORD=Admin@MyJudicial2024!
```

**Used by:** `npm run db:seed`  
**Purpose:** Create initial admin user for testing

---

## Environment-Specific Configurations

### Development (.env)

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
POCKETBASE_URL=http://localhost:8090
```

### Production (Environment Variables in Cloud Provider)

```env
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://app.myjudicial.com
CORS_ORIGIN=https://app.myjudicial.com
LOG_LEVEL=info
POCKETBASE_URL=https://pocketbase.myjudicial.com
```

**Important:** Never commit `.env` to version control. Use cloud provider's environment variable management.

---

## Validation

The application validates required environment variables on startup. If any required variable is missing, the server will not start and will display an error message.

### Check Your Configuration

```bash
# Build to verify TypeScript compiles
npm run build

# Start server (will validate environment variables)
npm run dev
```

### Common Errors

**Error:** `REDIS_URL is missing from environment variables`  
**Fix:** Add Redis connection string to `.env`

**Error:** `SUPABASE_URL is missing from environment variables`  
**Fix:** Add Supabase project URL to `.env`

**Error:** `DATABASE_URL is missing from environment variables`  
**Fix:** Add PostgreSQL connection string to `.env`

---

## Security Best Practices

### 🔒 Never Commit Secrets

- ✅ `.env` is in `.gitignore`
- ✅ Use `.env.example` as template (no real values)
- ❌ Never commit `.env` to Git
- ❌ Never put secrets in code

### 🔐 Use Strong Credentials

- **PocketBase Admin Password:** 16+ characters, mixed case, numbers, symbols
- **Access Tokens:** Rotate regularly
- **Webhook Secrets:** 32+ random characters

### 🛡️ Production Security

- Use environment variables from cloud provider (not `.env` file)
- Rotate credentials every 90 days
- Use separate credentials for dev/staging/production
- Enable webhook signature verification
- Monitor for unauthorized access

---

## Setup Priority

For MVP deployment, configure in this order:

1. **Required (MVP won't start without these):**
   - Database (Supabase PostgreSQL)
   - Supabase Auth
   - Redis
   - Email (Brevo)
   - Frontend URL

2. **High Priority (Core features):**
   - LiveKit (Video consultations)
   - OCI Storage (Document vault)

3. **Medium Priority (Notifications):**
   - PocketBase

4. **Optional (Future):**
   - AI services (not yet implemented)
   - Calendar sync (not yet implemented)
   - Push notifications (not yet implemented)

---

## Testing Configuration

### Test Individual Services

**Test Database Connection:**
```bash
npx prisma db push
```

**Test Redis Connection:**
```bash
redis-cli -u $REDIS_URL ping
```

**Test Email:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Troubleshooting

### Issue: Server won't start

**Check:**
1. All required variables are set
2. Redis is accessible
3. Database is accessible
4. Ports are not in use

**Debug:**
```bash
# Check environment variables
node -e "console.log(process.env)"

# Test database connection
npx prisma db pull

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### Issue: PocketBase connection fails

**Check:**
1. PocketBase is running
2. URL is correct
3. Admin credentials are correct
4. Collections exist

**Debug:**
```bash
# Check PocketBase health
curl http://localhost:8090/api/health

# Check collections
curl http://localhost:8090/api/collections
```

---

## Documentation Links

- **PocketBase Setup:** `docs/prompts/phase-1/POCKETBASE_SETUP_GUIDE.md`
- **Chat Implementation:** `docs/prompts/phase-1/POCKETBASE_CHAT_COMPLETION_REPORT.md`
- **Project Onboarding:** `docs/prompts/00_Project_Onboarding.md`

---

## Summary

**Total Environment Variables:** 35

**Required for MVP:** 11  
**Optional (Features):** 18  
**Configuration:** 6

**Completion Status:**
- ✅ Database: Configured
- ✅ Authentication: Configured
- ✅ Email: Configured
- ✅ Redis: Configured
- 🔜 PocketBase: Awaiting deployment
- ✅ LiveKit: Configured
- ✅ OCI Storage: Configured

---

**Last Updated:** 2026-06-30  
**Next Review:** After each new feature implementation
