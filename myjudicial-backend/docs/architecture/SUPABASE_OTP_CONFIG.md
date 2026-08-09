# Supabase OTP Configuration Guide

## Issue: OTP Expires Too Quickly

By default, Supabase OTP codes expire after **60 seconds**, which is often too short for users to:
1. Check their email
2. Find the OTP code
3. Return to the app
4. Enter the code

This results in "Invalid or expired OTP" errors even when the user enters the correct code.

## Solution: Increase OTP Expiry Time

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings** (or **Configuration**)

### Step 2: Configure OTP Expiry

Look for the **Email Auth** or **OTP Settings** section:

**Option 1: Via Dashboard UI (if available)**
1. Find "OTP Expiry Time" or "Email OTP Expiration"
2. Change from `60` seconds to `900` seconds (15 minutes)
3. Click "Save"

**Option 2: Via Auth Configuration**
1. Go to **Authentication** → **Settings**
2. Look for **Email** section
3. Find **OTP expiration** setting
4. Set to `900` (15 minutes / 900 seconds)
5. Save changes

**Option 3: Via Supabase CLI (for self-hosted)**
Update your `config.toml`:

```toml
[auth]
# OTP expiration time in seconds (default: 60, max: 86400 = 24 hours)
otp_expiry = 900  # 15 minutes
```

### Step 3: Verify Configuration

After changing the setting:

1. Restart your Supabase project (if self-hosted)
2. Test the OTP flow:
   - Request OTP
   - Wait 2-3 minutes
   - Enter the OTP code
   - Should work successfully

## Recommended Values

| Use Case | Expiry Time | Seconds |
|----------|-------------|---------|
| Development | 15 minutes | 900 |
| Production (Low Security) | 10 minutes | 600 |
| Production (Standard) | 5 minutes | 300 |
| Production (High Security) | 2 minutes | 120 |

**For MyJudicial:** We recommend **900 seconds (15 minutes)** for a good user experience.

## Common Issues

### Issue 1: Setting Not Available in Dashboard

**Solution:** Check your Supabase version. Older versions might require:
1. Contacting Supabase support
2. Using Supabase CLI for self-hosted
3. Upgrading to latest Supabase version

### Issue 2: Changes Not Taking Effect

**Solutions:**
1. Hard refresh the Supabase Dashboard (Ctrl + Shift + R)
2. Wait 1-2 minutes for changes to propagate
3. Restart your backend server
4. Clear any cached Supabase clients

### Issue 3: OTP Still Expires Quickly

**Possible Causes:**
1. Email delivery delay (check Brevo logs)
2. Frontend/backend time synchronization issues
3. Multiple OTP requests (only latest OTP is valid)
4. Configuration not saved properly

**Debug Steps:**
```typescript
// Add to auth.service.ts sendOtp method
logger.info("OTP generated", { 
  email: dto.email,
  timestamp: new Date().toISOString(),
  expectedExpiry: new Date(Date.now() + 900000).toISOString() // 15 min from now
});
```

## Alternative: Extend Verification Window

If you can't change Supabase settings, consider implementing a token refresh mechanism:

```typescript
// In auth.service.ts
sendOtp: async (dto: SendOtpDto) => {
  // Store OTP send time in Redis
  await redisSet(
    `otp:${dto.email}:sent_at`,
    Date.now().toString(),
    900 // 15 minutes
  );
  
  const { error } = await supabaseAnon.auth.signInWithOtp({
    email: dto.email,
    options: {
      shouldCreateUser: false,
    },
  });
  
  // ... rest of code
}
```

However, this won't extend the Supabase OTP itself - you'd need to implement your own OTP system.

## Supabase Email Templates

While configuring OTP, you can also customize the email template:

1. Go to **Authentication** → **Email Templates**
2. Find **Magic Link** or **OTP** template
3. Customize the message to be clear about expiry time:

```html
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
<p>This code expires in 15 minutes.</p>
```

## Testing

After configuration, test with different scenarios:

### Test 1: Immediate Use (should work)
```bash
# 1. Request OTP
curl -X POST http://localhost:4000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Immediately verify (within 30 seconds)
curl -X POST http://localhost:4000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"123456"}'
```

### Test 2: Delayed Use (should work with new setting)
```bash
# 1. Request OTP
curl -X POST http://localhost:4000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Wait 5 minutes, then verify
# Should succeed with 900s expiry, fail with 60s expiry
curl -X POST http://localhost:4000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"123456"}'
```

### Test 3: Expired OTP (should fail)
```bash
# 1. Request OTP
curl -X POST http://localhost:4000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Wait 16 minutes (beyond 900s), then verify
# Should fail with "Invalid or expired OTP"
curl -X POST http://localhost:4000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"123456"}'
```

## Monitoring

Add monitoring to track OTP issues:

```typescript
// In auth.service.ts verifyOtp method
verifyOtp: async (dto: VerifyOtpDto, ipAddress?: string) => {
  const sentAt = await redisGet(`otp:${dto.email}:sent_at`);
  const now = Date.now();
  const timeSinceSent = sentAt ? (now - parseInt(sentAt)) / 1000 : null;
  
  logger.info("OTP verification attempt", {
    email: dto.email,
    timeSinceSent: timeSinceSent ? `${timeSinceSent}s` : 'unknown',
  });
  
  const { data, error } = await supabaseAnon.auth.verifyOtp({
    email: dto.email,
    token: dto.token,
    type: "email",
  });
  
  if (error) {
    logger.warn("OTP verification failed", {
      email: dto.email,
      timeSinceSent: timeSinceSent ? `${timeSinceSent}s` : 'unknown',
      errorCode: error.code,
      errorMessage: error.message,
    });
  }
  
  // ... rest of code
}
```

## Security Considerations

### Why Not Make It Too Long?

| Expiry Time | Security Risk | User Experience |
|-------------|---------------|-----------------|
| 1 minute | Very High Security | Poor (too short) |
| 5 minutes | High Security | Good |
| 15 minutes | Medium Security | Excellent |
| 30 minutes | Low Security | Excellent but risky |
| 1 hour+ | Very Low Security | Not recommended |

**Recommendation:** 15 minutes (900 seconds) balances security and usability.

### Additional Security Measures

1. **Rate Limiting**: Limit OTP requests per email (already implemented)
2. **Attempt Limiting**: Lock account after N failed attempts
3. **IP Tracking**: Monitor suspicious IP patterns
4. **Email Verification**: Require email verification before sensitive operations

## Related Documentation

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-email)
- [OTP Best Practices](https://supabase.com/docs/guides/auth/auth-email#configuration)
- [Authentication Architecture](./ARCHITECTURE_DECISIONS.md#authentication)

## Status Checklist

Before marking as complete:

- [ ] OTP expiry set to 900 seconds in Supabase Dashboard
- [ ] Email templates updated to mention 15-minute expiry
- [ ] Tested OTP with 5-minute delay (should work)
- [ ] Tested OTP with 16-minute delay (should fail)
- [ ] Monitoring/logging added for OTP timing
- [ ] Documentation updated

---

**Quick Fix:** Go to Supabase Dashboard → Authentication → Settings → Email Auth → Set OTP Expiry to **900 seconds**
