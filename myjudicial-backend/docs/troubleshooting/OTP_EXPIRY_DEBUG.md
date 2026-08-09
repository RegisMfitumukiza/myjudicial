# OTP Expiry Issue - Debugging Guide

## Problem
OTP codes are expiring within 1 minute, even though Supabase is configured for 900 seconds (15 minutes).

## Confirmed Configuration
✅ Supabase Dashboard → Email → **Email OTP expiration: 900 seconds**

## Possible Causes & Solutions

### 1. Configuration Not Applied (Most Likely)

**Symptoms:**
- Supabase dashboard shows 900 seconds
- OTP still expires after 60 seconds
- Recent configuration change

**Solutions:**

**A. Wait for Propagation (5-10 minutes)**
```bash
# Configuration changes can take time to propagate
# Wait 5-10 minutes after changing the setting
```

**B. Restart Supabase Services (for self-hosted)**
```bash
# If using Docker
docker-compose restart

# If using Supabase CLI
supabase stop
supabase start
```

**C. Clear Supabase Client Cache**
Restart your backend server:
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### 2. Email Delivery Delay

**Symptoms:**
- Email arrives 2-3 minutes after requesting OTP
- OTP works if entered immediately after email arrives
- OTP fails if entered quickly after requesting

**Check Email Delivery Time:**
1. Note the time you request OTP (check backend logs)
2. Note the time email arrives (check email headers)
3. Calculate delay

**View Email Headers in Gmail:**
- Open email → Three dots → Show original → Look for timestamps

**Solutions:**

**A. Check Brevo SMTP Performance**
1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Check **Statistics** → **Email Logs**
3. Look for delivery times

**B. Switch to Faster Email Provider (if needed)**
- SendGrid (usually faster)
- AWS SES (very fast)
- Resend (modern, fast)

### 3. Multiple OTP Requests

**Symptoms:**
- Request OTP multiple times
- Only the latest OTP is valid
- Old OTP codes fail immediately

**What Happens:**
```
Request OTP #1 → OTP: 123456 (valid for 15 min)
Request OTP #2 → OTP: 789012 (valid for 15 min)
# OTP 123456 is now INVALID (even if within 15 min)
# Only OTP 789012 works
```

**Solutions:**

**A. Rate Limit OTP Requests (Already Implemented)**
Check `auth.routes.ts` - rate limiting is applied:
```typescript
router.post("/otp/send", authLimiter, ...);
```

**B. Show Warning in Frontend**
Update frontend to warn users:
```typescript
// In sign-in form
<p className="text-sm text-yellow-600">
  Don't request a new code if you already have one. 
  Each new request invalidates previous codes.
</p>
```

### 4. Time Synchronization Issue

**Symptoms:**
- Server time doesn't match actual time
- Timestamps in logs look wrong
- Issue persists regardless of OTP age

**Check Server Time:**
```bash
# On your server
date

# Should match your actual time
# If different, server clock is wrong
```

**Solutions:**

**A. Sync Server Time**
```bash
# Ubuntu/Debian
sudo ntpdate -s time.nist.gov

# Or enable NTP
sudo timedatectl set-ntp true
```

**B. Check Database Time**
```sql
SELECT NOW() as server_time, 
       NOW() AT TIME ZONE 'UTC' as utc_time;
```

### 5. Supabase Project Issue

**Symptoms:**
- Nothing else works
- Configuration definitely set to 900s
- Recent Supabase platform issues

**Solutions:**

**A. Check Supabase Status**
Visit: https://status.supabase.com

**B. Contact Supabase Support**
1. Go to Supabase Dashboard
2. Help → Support
3. Report OTP expiry configuration not working

**C. Create Test Project**
1. Create new Supabase project
2. Set OTP expiry to 900s
3. Test if OTP works correctly
4. If yes, issue is with your project configuration

### 6. Hidden Configuration Override

**Symptoms:**
- Configuration shows 900s in dashboard
- But another setting overrides it

**Check:**

**A. Email Provider Settings**
In Supabase Dashboard:
1. Authentication → Providers → Email
2. Check if there's a "Custom SMTP" configuration
3. Some SMTP providers have their own OTP expiry

**B. Auth Hook Scripts**
If you have Supabase Edge Functions or hooks:
```sql
-- Check for auth hooks
SELECT * FROM supabase_functions.hooks;
```

## Debugging Steps

### Step 1: Add Detailed Logging (Already Done)

We've added timestamps to OTP send and verify operations. Check logs:

```typescript
// When OTP is sent:
info: OTP generated and email dispatched by Supabase {
  email: "user@example.com",
  sentAt: "2026-07-01T12:00:00.000Z",
  expiresAt: "2026-07-01T12:15:00.000Z"
}

// When OTP is verified:
info: OTP verification attempt {
  email: "user@example.com",
  attemptAt: "2026-07-01T12:05:00.000Z"
}
```

### Step 2: Test OTP Timing

**Test Script:**
```bash
#!/bin/bash

# 1. Request OTP
echo "Requesting OTP at $(date +%H:%M:%S)"
curl -X POST http://localhost:4000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# 2. Wait exactly 2 minutes
echo "Waiting 2 minutes..."
sleep 120

# 3. Try to verify (replace 123456 with actual OTP from email)
echo "Verifying OTP at $(date +%H:%M:%S)"
curl -X POST http://localhost:4000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","token":"123456"}'
```

**Expected Results:**
- **With 900s setting:** Should succeed after 2 minutes
- **With 60s setting:** Should fail after 2 minutes

### Step 3: Check Supabase Logs

1. Go to Supabase Dashboard
2. Logs → Auth Logs
3. Look for OTP generation events
4. Check if expiry time is mentioned

### Step 4: Direct Supabase API Test

Test directly with Supabase client (bypassing our backend):

```typescript
// test-otp.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// 1. Send OTP
const sendTime = new Date();
console.log('Sending OTP at:', sendTime.toISOString());

const { data, error } = await supabase.auth.signInWithOtp({
  email: 'your-email@example.com'
});

console.log('Send result:', { data, error });

// 2. Wait 2 minutes then verify manually
// Get OTP from email and verify
```

## Quick Fixes to Try

### Fix 1: Force Configuration Refresh

```bash
# 1. Change OTP expiry to 600 seconds
# 2. Save
# 3. Wait 2 minutes
# 4. Change back to 900 seconds
# 5. Save
# 6. Wait 2 minutes
# 7. Test again
```

### Fix 2: Disable and Re-enable Email Auth

In Supabase Dashboard:
1. Authentication → Providers
2. Disable "Email"
3. Save
4. Wait 1 minute
5. Re-enable "Email"
6. Set OTP expiry to 900
7. Save
8. Test

### Fix 3: Use Different Email for Testing

Sometimes, cached OTP settings are per-email:
1. Register a new test account with different email
2. Test OTP flow with that email
3. If it works, the issue might be cached for your original email

## Temporary Workaround: Custom OTP System

If Supabase OTP continues to fail, implement custom OTP:

```typescript
// src/modules/auth/custom-otp.service.ts
import crypto from 'crypto';
import { redisSet, redisGet, redisDel } from '../../infrastructure/redis/redis.client.js';

export const CustomOtpService = {
  generate: async (email: string): Promise<string> => {
    const otp = crypto.randomInt(100000, 999999).toString();
    await redisSet(`custom-otp:${email}`, otp, 900); // 15 minutes
    return otp;
  },

  verify: async (email: string, token: string): Promise<boolean> => {
    const storedOtp = await redisGet(`custom-otp:${email}`);
    if (!storedOtp || storedOtp !== token) {
      return false;
    }
    await redisDel(`custom-otp:${email}`);
    return true;
  }
};
```

## Contact Support

If nothing works, create a support ticket with:

1. **Supabase Project ID**
2. **Configuration screenshot** (showing 900s)
3. **Exact error message** from logs
4. **Timing test results** (how many seconds until OTP expires)
5. **Email provider** (Brevo SMTP)
6. **Steps to reproduce**

## Current Status

✅ Logging added for debugging
✅ Configuration confirmed at 900 seconds
⏳ Waiting to identify root cause

## Next Steps

1. Restart backend server
2. Wait 5 minutes (configuration propagation)
3. Test OTP with detailed logging
4. Check backend logs for timing information
5. Report findings

---

**Quick Command to Check Logs:**
```bash
# Backend logs (look for OTP timing)
npm run dev | grep -i "otp"
```
