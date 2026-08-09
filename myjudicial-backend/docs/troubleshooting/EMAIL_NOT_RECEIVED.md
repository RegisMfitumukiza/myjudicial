# Email Not Received - Troubleshooting Guide

## Issue
OTP emails are not arriving in inbox.

## Most Common Cause: Unverified Sender Email

**Your current configuration:**
```env
EMAIL_FROM_ADDRESS=mfitumukizaregis90@gmail.com
```

**Problem:** This email address must be **verified in Brevo** before you can send emails from it.

## Solution: Verify Sender Email in Brevo

### Step 1: Log into Brevo Dashboard

Go to [https://app.brevo.com](https://app.brevo.com) and log in.

### Step 2: Add and Verify Sender Email

1. **Navigate to**: Senders → Domains & Addresses
2. **Click**: "Add a sender"
3. **Enter your email**: `mfitumukizaregis90@gmail.com`
4. **Click**: "Add"
5. **Check your inbox**: Brevo will send a verification email
6. **Click the verification link** in the email
7. **Wait for approval**: Usually takes a few minutes

### Step 3: Check Verification Status

1. Go back to Senders → Domains & Addresses
2. Look for your email address
3. Status should show: ✅ **Verified**

### Step 4: Test Email Sending

Once verified, restart your backend and test:

```bash
# Restart backend
npm run dev

# Test OTP email
curl -X POST http://localhost:4000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

## Alternative: Use Brevo's Default Sender

If you can't verify your Gmail address quickly, use Brevo's default sender temporarily:

### Option 1: Brevo's No-Reply Email

```env
# In .env file
EMAIL_FROM_ADDRESS=noreply@sendinblue.com
EMAIL_FROM_NAME=MyJudicial
```

### Option 2: Domain-Based Email (Recommended for Production)

If you have a domain (e.g., `myjudicial.com`):

1. **Add domain in Brevo**: Senders → Domains → Add a domain
2. **Verify domain**: Add DNS records (SPF, DKIM)
3. **Use domain email**:
```env
EMAIL_FROM_ADDRESS=noreply@myjudicial.com
EMAIL_FROM_NAME=MyJudicial
```

## Check Brevo Logs

To see if emails are being sent successfully:

### Step 1: Go to Brevo Dashboard

1. Navigate to **Statistics** → **Email**
2. Or go to **Transactional** → **Email Logs**

### Step 2: Look for Recent Sends

Filter by:
- **Status**: Sent, Failed, Blocked
- **Date**: Today
- **Recipient**: Your test email

### Step 3: Check Error Messages

If emails are failing, Brevo will show why:
- ❌ **Sender not verified**
- ❌ **Blocked by recipient server**
- ❌ **Invalid recipient**
- ❌ **API key issues**

## Common Email Delivery Issues

### Issue 1: Sender Not Verified

**Error in Brevo logs:**
```
Sender email not verified
```

**Solution:** Verify sender email (see above)

### Issue 2: Gmail Blocking

**Symptom:** Email doesn't arrive in Gmail inbox

**Possible causes:**
- Gmail is blocking it as spam
- Gmail requires SPF/DKIM verification

**Solutions:**
1. Check **Gmail Spam folder**
2. Add "myjudicial" to Gmail safe senders
3. Use a proper domain email instead of Gmail sender

### Issue 3: Rate Limiting

**Symptom:** First few emails work, then stop

**Solution:**
- Check Brevo dashboard for limits
- Upgrade Brevo plan if needed
- Free tier: 300 emails/day

### Issue 4: API Key Issues

**Error in logs:**
```
Failed to send custom OTP email
error: "Unauthorized" or "Invalid API key"
```

**Solutions:**
1. Check Brevo API key is correct
2. Regenerate API key in Brevo dashboard
3. Update `.env` with new key
4. Restart backend

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Brevo API key is valid (check `.env`)
- [ ] Sender email (`EMAIL_FROM_ADDRESS`) is verified in Brevo
- [ ] Brevo account is active (not suspended)
- [ ] Backend logs show "Custom OTP email sent successfully"
- [ ] Brevo dashboard shows email was sent
- [ ] Checked spam folder in recipient email
- [ ] Checked Brevo email logs for errors

## Backend Logs to Check

When you request an OTP, look for these logs:

### Success Path:
```bash
info: Attempting to send custom OTP email {
  email: "user@example.com",
  hasBrevoKey: true,
  fromAddress: "mfitumukizaregis90@gmail.com",
  fromName: "MyJudicial"
}

info: Sending custom OTP email via Brevo {
  email: "user@example.com"
}

info: Custom OTP email sent successfully {
  email: "user@example.com",
  messageId: "abc123..."
}
```

### Failure Path:
```bash
error: Failed to send custom OTP email {
  email: "user@example.com",
  error: "Unauthorized - Sender email not verified",
  errorDetails: {...}
}
```

## Testing Email Configuration

### Test 1: Direct Brevo API Test

Create a test script to verify Brevo works:

```typescript
// test-brevo.ts
import * as Brevo from "@getbrevo/brevo";

const apiKey = "your-brevo-api-key";
const api = new Brevo.TransactionalEmailsApi();
api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

const message = new Brevo.SendSmtpEmail();
message.to = [{ email: "your-test-email@gmail.com" }];
message.sender = { 
  email: "mfitumukizaregis90@gmail.com", 
  name: "Test" 
};
message.subject = "Brevo Test";
message.htmlContent = "<p>Test email from Brevo</p>";

try {
  const response = await api.sendTransacEmail(message);
  console.log("Success:", response);
} catch (error) {
  console.error("Error:", error);
}
```

Run:
```bash
npx tsx test-brevo.ts
```

### Test 2: Check Brevo Dashboard Directly

1. Go to Brevo Dashboard
2. **Campaigns** → **Transactional** → **Templates**
3. Create a test template
4. Send test email
5. If this works, issue is in backend code
6. If this fails, issue is Brevo configuration

## Temporary Workaround: Console Logging

For development/testing, you can log OTP codes to console:

```typescript
// In custom-otp.service.ts
generate: async (email: string): Promise<string> => {
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Development: Log OTP to console
  if (process.env.NODE_ENV === 'development') {
    console.log('========================================');
    console.log('🔐 OTP CODE FOR TESTING:');
    console.log(`Email: ${email}`);
    console.log(`Code: ${otp}`);
    console.log('========================================');
  }
  
  // ... rest of code
}
```

Then you can copy the OTP from console logs during testing.

## Production Recommendations

For production deployment:

1. **Use Domain Email**: `noreply@yourdomain.com`
2. **Verify Domain**: Add SPF, DKIM, DMARC records
3. **Monitor Delivery**: Set up Brevo webhooks for delivery tracking
4. **Error Alerts**: Alert on email failures
5. **Fallback**: Consider SMS OTP as fallback

## Quick Fix Summary

**Most Likely Fix:**
1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Senders → Domains & Addresses
3. Verify `mfitumukizaregis90@gmail.com`
4. Check verification email in your Gmail
5. Click verification link
6. Wait 2-5 minutes
7. Restart backend
8. Test OTP again

**Alternative Quick Fix:**
```env
# Change to Brevo's default sender
EMAIL_FROM_ADDRESS=noreply@sendinblue.com
```

---

**Need Help?**
- Check Brevo Status: https://status.sendinblue.com
- Brevo Support: https://help.brevo.com
- Brevo Community: https://community.brevo.com
