# Supabase-PostgreSQL Sync System

## Overview

The MyJudicial backend implements a comprehensive bidirectional synchronization system between Supabase Auth and PostgreSQL to ensure data consistency across both systems.

## Architecture

### Components

1. **SupabaseSyncService** (`src/infrastructure/supabase/sync.service.ts`)
   - Handles all sync operations between Supabase Auth and PostgreSQL
   - Provides methods for create, update, and delete synchronization
   - Includes full sync capability for maintenance/recovery

2. **Webhook Controller** (`src/modules/auth/webhook.controller.ts`)
   - Receives and processes Supabase Auth webhook events
   - Verifies webhook signatures for security
   - Triggers appropriate sync operations

3. **Auth Service** (`src/modules/auth/auth.service.ts`)
   - Integrated with sync service for all user operations
   - Handles conflict resolution during registration
   - Ensures both systems stay in sync during updates

## Sync Scenarios

### 1. User Registration (Create)

**Normal Flow:**
```
Client → Register API → Create Supabase Auth User → Sync to PostgreSQL
```

**Conflict Resolution:**
- **Both exist**: Return conflict error
- **PostgreSQL only**: Delete orphaned record, create fresh
- **Supabase only**: Sync existing Supabase user to PostgreSQL
- **Neither exists**: Create in both systems

### 2. User Update

**Flow:**
```
Client → Update API → Update PostgreSQL → Sync to Supabase Auth
```

All user profile updates (name, phone, language) are synced to Supabase Auth metadata.

### 3. User Delete

**From Supabase:**
```
Supabase Delete → Webhook → Sync Service → Delete from PostgreSQL
```

**From PostgreSQL:**
```
PostgreSQL Delete → Sync Service → Delete from Supabase Auth
```

### 4. Webhook Events (Supabase → PostgreSQL)

Supabase Auth events automatically trigger sync:
- `INSERT`: Create user in PostgreSQL
- `UPDATE`: Update user in PostgreSQL
- `DELETE`: Delete user from PostgreSQL

## Setup Instructions

### 1. Generate Webhook Secret

```bash
# Generate a secure random secret
openssl rand -hex 32
```

Add to `.env`:
```env
SUPABASE_WEBHOOK_SECRET=your_generated_secret_here
```

### 2. Configure Supabase Database Webhook

1. Go to Supabase Dashboard → Database → Webhooks
2. Click "Create a new webhook"
3. Configure webhook:
   - **Name**: `User Sync Webhook`
   - **Table**: `auth.users`
   - **Events**: Check `INSERT`, `UPDATE`, `DELETE`
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-api-domain.com/api/v1/auth/webhook/supabase`
   - **Headers**:
     ```
     x-webhook-signature: <signature>
     Content-Type: application/json
     ```
4. Click "Create webhook"

### 3. Set Up Webhook Signature (Production)

For production security, configure webhook signature verification in Supabase:

1. Use your `SUPABASE_WEBHOOK_SECRET` as the signing key
2. Supabase will include `x-webhook-signature` header with HMAC-SHA256 signature
3. Backend automatically verifies signature before processing

### 4. Test Webhook Locally (Development)

Use a tool like ngrok to expose your local server:

```bash
# Terminal 1: Start your backend
npm run dev

# Terminal 2: Expose via ngrok
ngrok http 4000

# Use the ngrok HTTPS URL in Supabase webhook configuration
https://abc123.ngrok.io/api/v1/auth/webhook/supabase
```

## API Endpoints

### Webhook Endpoint
```
POST /api/v1/auth/webhook/supabase
```
- **Purpose**: Receive Supabase Auth events
- **Authentication**: Webhook signature verification
- **Body**: Supabase webhook payload

### Manual Full Sync (Admin Only)
```
POST /api/v1/auth/webhook/sync/full
Authorization: Bearer <admin_access_token>
```
- **Purpose**: Manually trigger full sync between systems
- **Use Case**: Data recovery, maintenance, initial setup
- **Returns**: Sync statistics

## Sync Service Methods

### syncFromSupabaseAuth
```typescript
await SupabaseSyncService.syncFromSupabaseAuth(
  supabaseUserId: string,
  email: string, 
  metadata?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    phone?: string;
  }
)
```
Creates or updates PostgreSQL user from Supabase Auth data.

### syncDeleteFromSupabaseAuth
```typescript
await SupabaseSyncService.syncDeleteFromSupabaseAuth(userId: string)
```
Deletes PostgreSQL user when Supabase Auth user is deleted.

### syncToSupabaseAuth
```typescript
await SupabaseSyncService.syncToSupabaseAuth(user: User)
```
Updates Supabase Auth metadata from PostgreSQL user data.

### syncDeleteToSupabaseAuth
```typescript
await SupabaseSyncService.syncDeleteToSupabaseAuth(userId: string)
```
Deletes Supabase Auth user when PostgreSQL user is deleted.

### performFullSync
```typescript
await SupabaseSyncService.performFullSync()
```
Performs complete bidirectional sync. Returns statistics:
```typescript
{
  supabaseToPostgres: number;  // Users synced from Supabase
  postgresCleanup: number;      // Orphaned PostgreSQL records removed
  errors: string[];             // Any sync errors
}
```

## Common Issues & Solutions

### Issue: "User exists" error after deleting from Supabase

**Cause**: PostgreSQL record exists but Supabase Auth user doesn't

**Solution**: The register endpoint now automatically detects this and:
1. Detects the orphaned PostgreSQL record
2. Deletes it
3. Creates fresh records in both systems

### Issue: User deleted from Supabase but still in PostgreSQL

**Cause**: Webhook not configured or not firing

**Solutions**:
1. Verify webhook is configured in Supabase Dashboard
2. Check webhook logs in Supabase Dashboard → Database → Webhooks → View Logs
3. Verify `SUPABASE_WEBHOOK_SECRET` is set correctly
4. Check backend logs for webhook processing errors
5. Run manual full sync: `POST /api/v1/auth/webhook/sync/full`

### Issue: User updated in PostgreSQL but not reflected in Supabase

**Cause**: Update operation not using AuthService.updateUser

**Solution**: Always use `AuthService.updateUser()` for user updates:
```typescript
await AuthService.updateUser(userId, {
  firstName: "New Name",
  phone: "+1234567890"
}, ipAddress);
```

### Issue: Webhook signature verification failing

**Cause**: Mismatch between configured secret and actual secret

**Solutions**:
1. Regenerate webhook secret: `openssl rand -hex 32`
2. Update `.env` with new secret
3. Update Supabase webhook configuration with same secret
4. Restart backend server

## Monitoring & Maintenance

### View Sync Logs

All sync operations are logged with context:

```typescript
logger.info("Syncing user from Supabase Auth to PostgreSQL", { 
  supabaseUserId, 
  email 
});
```

Check logs for:
- Sync operations
- Conflict resolutions
- Webhook events
- Errors

### Manual Sync (Recovery)

If data gets out of sync:

1. Ensure backend is running
2. Get admin access token
3. Trigger full sync:

```bash
curl -X POST https://api.myjudicial.com/api/v1/auth/webhook/sync/full \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

4. Review sync results in response

### Regular Maintenance

**Weekly:**
- Review sync logs for errors
- Verify webhook is receiving events

**Monthly:**
- Consider running manual full sync to verify consistency
- Review webhook logs in Supabase Dashboard

## Security Considerations

1. **Webhook Signature Verification**: Always enabled in production
2. **Admin-Only Endpoints**: Full sync requires admin authentication
3. **Audit Logging**: All sync operations are logged for compliance
4. **Error Handling**: Failed syncs are logged but don't expose sensitive data

## Testing

### Test Webhook Locally

```bash
# 1. Start backend
npm run dev

# 2. Send test webhook (in another terminal)
curl -X POST http://localhost:4000/api/v1/auth/webhook/supabase \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=$(echo -n '{"type":"INSERT","record":{"id":"test-123","email":"test@example.com"}}' | openssl dgst -sha256 -hmac 'YOUR_WEBHOOK_SECRET' | cut -d ' ' -f2)" \
  -d '{
    "type": "INSERT",
    "record": {
      "id": "test-123",
      "email": "test@example.com",
      "raw_user_meta_data": {
        "full_name": "Test User",
        "role": "CITIZEN"
      }
    }
  }'
```

### Test Registration Sync

```bash
# Register new user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sync-test@example.com",
    "fullName": "Sync Test",
    "role": "CITIZEN",
    "preferredLanguage": "en"
  }'

# Verify in both systems:
# 1. Check Supabase Dashboard → Authentication → Users
# 2. Check PostgreSQL: SELECT * FROM "User" WHERE email = 'sync-test@example.com'
```

### Test Update Sync

```bash
# Update user (requires authentication)
curl -X PATCH http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }'

# Verify metadata updated in Supabase Dashboard
```

## Database Schema

The sync system relies on matching IDs:

```sql
-- PostgreSQL User table
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,  -- Must match Supabase Auth user.id
  email TEXT UNIQUE NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  role "Role" NOT NULL,
  ...
);
```

```javascript
// Supabase Auth user_metadata
{
  full_name: "First Last",
  first_name: "First",
  last_name: "Last",
  role: "CITIZEN",
  phone: "+1234567890"
}
```

## Migration Guide

If you're setting up sync on an existing system:

1. **Backup both databases** before starting
2. Run manual full sync to establish baseline
3. Configure webhook for ongoing sync
4. Monitor logs for 24 hours
5. Verify no sync errors
6. Document any custom resolution needed

## Related Documentation

- [Authentication Implementation](./ARCHITECTURE_DECISIONS.md#authentication)
- [Backend Guidelines](./BACKEND_GUIDELINES.md)
- [API Contracts](./API_CONTRACTS.md)
