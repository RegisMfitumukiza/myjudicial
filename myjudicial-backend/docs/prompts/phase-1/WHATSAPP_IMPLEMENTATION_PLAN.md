# WhatsApp Cloud API Integration — Implementation Plan

**Date:** 2026-06-30  
**Feature Reference:** docs/prompts/phase-1/02_WhatsApp_Cloud_API.md  
**Architecture Reference:** docs/architecture/MyJudicial_Master_Build_Reference.md  
**Status:** Implementation Plan - Awaiting Approval  

---

## 1. Project Overview

MyJudicial is a two-sided legal marketplace connecting citizens to verified lawyers in Rwanda. The platform currently has a production-ready backend with:
- Authentication via Supabase (OTP, Magic Links)
- Booking engine with Flutterwave payments
- LiveKit video consultations
- Encrypted document vault
- Expert verification system
- Review & rating system

**Current Notification Stack:**
- ✅ Brevo transactional emails (OTP, bookings, reminders)
- ❌ WhatsApp Cloud API (0% implemented)
- ❌ Push notifications (not started)

---

## 2. Existing Implementation Review

### 2.1 Current Notification Infrastructure

**Email Service (`src/infrastructure/email/email.service.ts`):**
- 8 email templates implemented
- Centralized `sendEmail()` function with error handling
- Templates: welcome, OTP, magic link, booking confirmation, reminder, cancellation, refund, review notification, credential expiry

**Architecture Patterns:**
- Controllers → Services → Repositories
- Centralized error handling
- Zod validation on all inputs
- Redis caching for auth tokens and user data
- Cron jobs for automated tasks (compliance, reminders)

**Queue Infrastructure:**
- Redis client with `redisSet`, `redisGet`, `redisDel`, `redisExists`
- Simple cron jobs with `node-cron` (compliance daily, booking reminders every 5 min)
- No BullMQ or advanced queue system yet

### 2.2 Reusable Components

**Authentication:**
- JWT middleware with role-based access control
- Existing `authenticate` middleware supports admin routes
- Token revocation via Redis blacklist

**Validation:**
- Zod schemas in each module (`*.schemas.ts`)
- Centralized validation middleware

**Database:**
- Prisma ORM with PostgreSQL
- `NotificationLog` table for tracking sent messages
- `AuditLog` for security events

**Error Handling:**
- Custom error classes extending `BaseError`
- Global error middleware with structured logging
- Winston logger with multiple transports

---

## 3. Gap Analysis

### 3.1 Missing Components

| Component | Current Status | Required for WhatsApp |
|-----------|----------------|---------------------|
| **WhatsApp Provider** | ❌ Not implemented | Meta Cloud API client |
| **Webhook Verification** | ❌ Not implemented | Signature validation |
| **Template Management** | ❌ Not implemented | Template ID storage |
| **Queue Processing** | 🟡 Simple cron only | Background message sending |
| **Delivery Status Tracking** | ❌ Not implemented | Webhook event handling |
| **Phone Number Validation** | ❌ Not implemented | International format validation |

### 3.2 Integration Points

**Notification Triggers:**
- Authentication: OTP codes, magic link confirmations
- Bookings: confirmation, reminders, cancellations
- Payments: success, escrow release, refunds  
- Reviews: new review notifications to experts
- Compliance: credential expiry warnings

**Existing Email → WhatsApp Mapping:**
```typescript
sendOtpEmail() → sendOtpWhatsApp()
sendBookingConfirmationEmail() → sendBookingConfirmationWhatsApp()
sendBookingReminderEmail() → sendBookingReminderWhatsApp()
// etc.
```

---

## 4. Implementation Strategy

### 4.1 Module Structure

Following existing patterns, create:

```
src/modules/whatsapp/
├── controllers/
│   ├── whatsapp.controller.ts          # Send message endpoints
│   └── whatsapp-webhook.controller.ts  # Meta webhook handler
├── services/
│   ├── whatsapp.service.ts             # Business logic
│   ├── whatsapp-provider.service.ts    # Meta Cloud API client
│   └── whatsapp-template.service.ts    # Template management
├── repositories/
│   └── whatsapp.repository.ts          # Database operations
├── routes/
│   ├── whatsapp.routes.ts              # Public routes
│   └── whatsapp-admin.routes.ts        # Admin routes
├── schemas/
│   └── whatsapp.schemas.ts             # Zod validation
├── types/
│   └── whatsapp.types.ts               # TypeScript interfaces
└── utils/
    └── phone.utils.ts                  # Phone number formatting
```

### 4.2 Database Changes

**Extend existing `NotificationLog` table:**
```prisma
enum NotificationChannel {
  EMAIL
  WHATSAPP  // Add this
  SMS       // Future
  PUSH      // Future
}

model NotificationLog {
  // ... existing fields
  channel      NotificationChannel
  whatsappId   String?              // Meta message ID
  templateId   String?              // Template identifier
  deliveryStatus String?            // sent, delivered, read, failed
  // ... rest unchanged
}
```

**New WhatsApp-specific table:**
```prisma
model WhatsAppTemplate {
  id          String  @id @default(uuid())
  name        String  @unique          # OTP_TEMPLATE, BOOKING_CONFIRMATION
  metaId      String                   # Meta template ID
  language    String  @default("en")   # Template language
  parameters  String[]                 # Parameter names
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.3 Configuration

**Environment Variables:**
```env
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=EAAGm0P...
WHATSAPP_PHONE_NUMBER_ID=155248...
WHATSAPP_BUSINESS_ACCOUNT_ID=102685...
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_123

# Webhook endpoint will be:
# https://api.myjudicial.com/v1/whatsapp/webhook
```

---

## 5. Detailed Implementation Plan

### 5.1 Phase 1: Core Infrastructure (Day 1-2)

**Step 1: Provider Service**
```typescript
// src/modules/whatsapp/services/whatsapp-provider.service.ts
export class WhatsAppProviderService {
  async sendTextMessage(to: string, text: string): Promise<string>
  async sendTemplateMessage(to: string, templateName: string, params: any[]): Promise<string>
  async verifyWebhookSignature(body: string, signature: string): boolean
  async getTemplate(templateId: string): Promise<WhatsAppTemplate>
}
```

**Step 2: Webhook Handler**
```typescript
// src/modules/whatsapp/controllers/whatsapp-webhook.controller.ts
export class WhatsAppWebhookController {
  // GET /whatsapp/webhook - Meta verification
  static async verify(req: Request, res: Response): Promise<void>
  
  // POST /whatsapp/webhook - Event receiver
  static async handleWebhook(req: Request, res: Response): Promise<void>
}
```

**Step 3: Database Repository**
```typescript
// src/modules/whatsapp/repositories/whatsapp.repository.ts
export const WhatsAppRepository = {
  logNotification: (userId: string, channel: 'WHATSAPP', event: NotificationEvent, recipient: string, whatsappId?: string) => Promise<void>
  updateDeliveryStatus: (whatsappId: string, status: string) => Promise<void>
  getTemplate: (name: string) => Promise<WhatsAppTemplate | null>
}
```

### 5.2 Phase 2: Business Logic (Day 3)

**Core Service Implementation:**
```typescript
// src/modules/whatsapp/services/whatsapp.service.ts
export const WhatsAppService = {
  // Authentication notifications
  async sendOtpMessage(phone: string, otpCode: string): Promise<void>
  async sendMagicLinkMessage(phone: string, link: string): Promise<void>
  
  // Booking notifications  
  async sendBookingConfirmation(phone: string, bookingDetails: BookingDetails): Promise<void>
  async sendBookingReminder(phone: string, bookingDetails: BookingDetails): Promise<void>
  async sendBookingCancellation(phone: string, cancellationDetails: CancellationDetails): Promise<void>
  
  // Payment notifications
  async sendPaymentSuccess(phone: string, paymentDetails: PaymentDetails): Promise<void>
  async sendEscrowRelease(phone: string, escrowDetails: EscrowDetails): Promise<void>
  async sendRefundNotification(phone: string, refundDetails: RefundDetails): Promise<void>
  
  // Admin test endpoint
  async sendTestMessage(phone: string, message: string): Promise<void>
}
```

**Template Management:**
```typescript
// src/modules/whatsapp/services/whatsapp-template.service.ts
export const TemplateService = {
  OTP_TEMPLATE: 'otp_verification_myjudicial',
  BOOKING_CONFIRMATION_TEMPLATE: 'booking_confirmed_myjudicial', 
  BOOKING_REMINDER_TEMPLATE: 'consultation_reminder_myjudicial',
  PAYMENT_SUCCESS_TEMPLATE: 'payment_received_myjudicial',
  // etc.
  
  async getTemplateId(templateName: string): Promise<string>
  async formatTemplateParams(templateName: string, params: any): Promise<any[]>
}
```

### 5.3 Phase 3: Integration Points (Day 4)

**Update existing notification services:**

```typescript
// Modify src/infrastructure/email/email.service.ts to add WhatsApp calls
import { WhatsAppService } from '../../modules/whatsapp/services/whatsapp.service.js';

export const sendOtpNotifications = async (email: string, phone: string | null, otpCode: string) => {
  // Send email (existing)
  await sendOtpEmail(email, otpCode);
  
  // Send WhatsApp if phone provided
  if (phone) {
    await WhatsAppService.sendOtpMessage(phone, otpCode);
  }
};

// Similar for other notification types...
```

**Update booking reminder cron:**
```typescript
// Modify src/infrastructure/cron/booking-reminder.cron.ts
// Add WhatsApp reminders alongside email reminders
if (booking.citizen?.phone) {
  notifications.push(
    WhatsAppService.sendBookingReminder(booking.citizen.phone, {
      expertName,
      scheduledAt,
      bookingId: booking.id,
      joinUrl,
    }).catch((e) => { logger.error("WhatsApp reminder failed", { bookingId: booking.id, e }); })
  );
}
```

### 5.4 Phase 4: Controllers & Routes (Day 5)

**Public API Endpoints:**
```typescript
// src/modules/whatsapp/routes/whatsapp.routes.ts
router.get('/webhook', WhatsAppWebhookController.verify);           // Meta verification
router.post('/webhook', WhatsAppWebhookController.handleWebhook);   // Event receiver
```

**Admin API Endpoints:**
```typescript
// src/modules/whatsapp/routes/whatsapp-admin.routes.ts
router.post('/test', authenticate, requireAdmin, WhatsAppController.sendTestMessage);
router.get('/templates', authenticate, requireAdmin, WhatsAppController.listTemplates);
router.get('/delivery-stats', authenticate, requireAdmin, WhatsAppController.getDeliveryStats);
```

---

## 6. Queue Processing Strategy

### 6.1 Current Approach: Extend Cron Pattern

Since the project uses simple cron jobs and doesn't have BullMQ yet, we'll follow the existing pattern:

```typescript
// src/modules/whatsapp/services/whatsapp-queue.service.ts
export const WhatsAppQueueService = {
  async queueMessage(type: 'OTP' | 'BOOKING_CONFIRMATION' | etc., recipient: string, params: any): Promise<void> {
    // Store in PostgreSQL with status 'QUEUED'
    await WhatsAppRepository.queueMessage({ type, recipient, params, status: 'QUEUED' });
  },
  
  async processQueue(): Promise<void> {
    // Called by cron job every 30 seconds
    const queuedMessages = await WhatsAppRepository.getPendingMessages(10); // Batch of 10
    
    for (const message of queuedMessages) {
      try {
        await WhatsAppProviderService.sendMessage(message);
        await WhatsAppRepository.markMessageSent(message.id);
      } catch (error) {
        await WhatsAppRepository.markMessageFailed(message.id, error.message);
      }
    }
  }
};
```

**New Cron Job:**
```typescript
// src/infrastructure/cron/whatsapp-queue.cron.ts  
import cron from "node-cron";
import { WhatsAppQueueService } from "../../modules/whatsapp/services/whatsapp-queue.service.js";

export const startWhatsAppQueueCron = (): void => {
  cron.schedule("*/30 * * * * *", async () => {  // Every 30 seconds
    await WhatsAppQueueService.processQueue();
  });
};
```

### 6.2 Future Upgrade Path

Architecture is designed so that later we can:
1. Replace PostgreSQL queue with BullMQ/Redis
2. Add retry logic with exponential backoff
3. Add batching for bulk messages
4. Add priority queues

The service interfaces remain the same, only the implementation changes.

---

## 7. Template Management

### 7.1 Meta WhatsApp Templates

Templates must be pre-approved by Meta. Initial template set:

```
1. otp_verification_myjudicial
   - "Your MyJudicial verification code is {{1}}. Valid for 10 minutes."

2. booking_confirmed_myjudicial  
   - "Booking confirmed! You have a consultation with {{1}} on {{2}} at {{3}}. Join: {{4}}"

3. consultation_reminder_myjudicial
   - "Reminder: Your consultation with {{1}} starts in 1 hour. Join: {{2}}"

4. payment_received_myjudicial
   - "Payment confirmed! {{1}} RWF received for booking {{2}}. Funds held in escrow until consultation completes."

5. escrow_released_myjudicial
   - "Consultation completed! {{1}} RWF released to {{2}}. Receipt: {{3}}"
```

### 7.2 Template Database

```prisma
model WhatsAppTemplate {
  id          String   @id @default(uuid())
  name        String   @unique       # OTP_TEMPLATE
  metaId      String               # otp_verification_myjudicial  
  language    String   @default("en")
  parameters  String[]             # ["code"]
  bodyText    String               # For reference only
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("whatsapp_templates")
}
```

Seed data will populate this table with Meta template IDs.

---

## 8. Error Handling & Retry Strategy

### 8.1 Error Classification

```typescript
// src/modules/whatsapp/types/whatsapp.types.ts
export enum WhatsAppErrorType {
  RATE_LIMIT = 'rate_limit',           // Retry with backoff
  INVALID_PHONE = 'invalid_phone',     // Don't retry
  TEMPLATE_NOT_FOUND = 'template_not_found',  // Don't retry  
  NETWORK_ERROR = 'network_error',     // Retry immediately
  AUTH_ERROR = 'auth_error',           // Don't retry, alert admin
  USER_BLOCKED_BOT = 'user_blocked',   // Don't retry, mark as blocked
}

export class WhatsAppError extends BaseError {
  constructor(
    message: string, 
    public errorType: WhatsAppErrorType,
    public retryable: boolean = false
  ) {
    super(message, 'WHATSAPP_ERROR');
  }
}
```

### 8.2 Retry Logic

```typescript
// src/modules/whatsapp/utils/retry.utils.ts
export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

---

## 9. Security Implementation

### 9.1 Webhook Verification

```typescript
// src/modules/whatsapp/utils/webhook-verification.ts
import crypto from 'crypto';

export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
};
```

### 9.2 Rate Limiting

```typescript
// src/modules/whatsapp/middleware/rate-limit.ts
export const whatsappRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,               // 5 messages per minute per IP
  message: 'Too many WhatsApp requests',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 9.3 Phone Number Validation

```typescript
// src/modules/whatsapp/utils/phone.utils.ts
import { parsePhoneNumber } from 'libphonenumber-js';

export const validateAndFormatPhone = (phone: string, country: string = 'RW'): string => {
  try {
    const phoneNumber = parsePhoneNumber(phone, country);
    if (!phoneNumber.isValid()) {
      throw new WhatsAppError('Invalid phone number', WhatsAppErrorType.INVALID_PHONE);
    }
    return phoneNumber.format('E.164'); // +250788123456
  } catch (error) {
    throw new WhatsAppError('Phone validation failed', WhatsAppErrorType.INVALID_PHONE);
  }
};
```

---

## 10. Monitoring & Analytics

### 10.1 Metrics to Track

```typescript
// src/modules/whatsapp/services/whatsapp-analytics.service.ts
export const WhatsAppAnalyticsService = {
  async getDeliveryStats(dateFrom: Date, dateTo: Date): Promise<DeliveryStats> {
    return {
      totalSent: number,
      totalDelivered: number,
      totalRead: number,
      totalFailed: number,
      deliveryRate: percentage,
      readRate: percentage,
      failureReasons: { [reason: string]: number }
    };
  },
  
  async getUsageByTemplate(dateFrom: Date, dateTo: Date): Promise<TemplateUsage[]> {
    // Messages sent per template type
  },
  
  async getResponseTimes(): Promise<ResponseTimeMetrics> {
    // Average time from queue to delivered
  }
};
```

### 10.2 Admin Dashboard Integration

Add endpoints for the future admin analytics dashboard:

```typescript
// GET /admin/whatsapp/stats
// GET /admin/whatsapp/templates/usage  
// GET /admin/whatsapp/delivery-failures
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// tests/modules/whatsapp/whatsapp.service.test.ts
describe('WhatsAppService', () => {
  describe('sendOtpMessage', () => {
    it('should send OTP template with correct parameters');
    it('should validate phone number format');
    it('should handle rate limiting gracefully');
    it('should log notification in database');
  });
  
  describe('webhook handling', () => {
    it('should verify Meta signature correctly');
    it('should update delivery status on webhook');
    it('should ignore unknown webhook events');
  });
});
```

### 11.2 Integration Tests

```typescript
// tests/integration/whatsapp-webhook.test.ts
describe('WhatsApp Webhook Integration', () => {
  it('should handle message delivery confirmation');
  it('should handle message read receipt');
  it('should handle message failure notification');
  it('should reject invalid webhook signatures');
});
```

### 11.3 Manual Testing

Create admin test endpoint:
```
POST /admin/whatsapp/test
{
  "phone": "+250788123456",
  "message": "Test message from MyJudicial"
}
```

---

## 12. Implementation Timeline

### Day 1: Core Infrastructure
- [ ] Create module structure (`src/modules/whatsapp/`)
- [ ] Implement `WhatsAppProviderService` with Meta Cloud API client
- [ ] Create database schema and migrations
- [ ] Set up webhook verification logic

### Day 2: Database & Repository  
- [ ] Implement `WhatsAppRepository` with notification logging
- [ ] Create template management system
- [ ] Set up phone number validation utilities
- [ ] Add error handling classes

### Day 3: Business Logic
- [ ] Implement core `WhatsAppService` methods
- [ ] Create message queueing system
- [ ] Add retry logic with backoff
- [ ] Implement template parameter formatting

### Day 4: Integration Points
- [ ] Update existing email services to include WhatsApp
- [ ] Modify booking reminder cron to send WhatsApp
- [ ] Update auth flows to send dual notifications
- [ ] Add WhatsApp to compliance warnings

### Day 5: Controllers & Routes
- [ ] Create webhook controllers (verify + handle)
- [ ] Implement admin test endpoints  
- [ ] Add rate limiting middleware
- [ ] Create OpenAPI documentation
- [ ] Set up monitoring/analytics endpoints

### Post-Implementation
- [ ] Manual testing with Meta test numbers
- [ ] Production webhook URL configuration
- [ ] Template approval process with Meta
- [ ] Load testing for high-volume scenarios

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Meta template approval delays** | High | Start approval process early, prepare fallback to SMS |
| **WhatsApp rate limiting** | Medium | Implement queue with proper backoff, monitor usage |
| **Webhook delivery failures** | Medium | Add retry mechanism, fallback to email |
| **Phone number validation complexity** | Low | Use battle-tested library (libphonenumber-js) |

### 13.2 Business Risks  

| Risk | Impact | Mitigation |
|------|--------|------------|
| **User opt-out preferences** | Medium | Implement opt-out tracking, respect preferences |
| **Spam complaints** | High | Only send transactional messages, clear opt-out |
| **International messaging costs** | Low | Focus on Rwanda (+250) initially |

### 13.3 Compliance Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **GDPR data processing** | Medium | Log consent, provide data export/deletion |
| **WhatsApp Business Policy violations** | High | Review all templates against policies |
| **Phone number data protection** | Medium | Encrypt phone numbers at rest, audit access |

---

## 14. Future Enhancements

### 14.1 Phase 2 Features (Post-MVP)

- **Rich Media Messages:** Document sharing, images, voice notes
- **Interactive Buttons:** Quick replies for booking confirmation/cancellation  
- **List Messages:** Service selection, available time slots
- **WhatsApp Flows:** Complex multi-step interactions
- **Customer Support Chat:** Two-way conversations with experts

### 14.2 Advanced Features

- **AI-Powered Responses:** Auto-respond to common queries
- **Broadcast Lists:** Marketing to opted-in users
- **Multi-Language Templates:** Kinyarwanda, French templates
- **Analytics Dashboard:** Real-time delivery metrics
- **A/B Testing:** Template performance optimization

---

## 15. Dependencies & Prerequisites

### 15.1 External Dependencies

- **Meta Business Account:** Verified business account required
- **WhatsApp Business API Access:** Cloud API access approved  
- **Template Pre-approval:** All templates submitted and approved
- **Webhook URL:** HTTPS endpoint configured in Meta dashboard

### 15.2 Code Dependencies

```json
{
  "dependencies": {
    "libphonenumber-js": "^1.10.0",    // Phone number validation
    "axios": "^1.6.0"                  // HTTP client (already in project)
  }
}
```

### 15.3 Environment Setup

```env
# Add to existing .env file
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_WEBHOOK_URL=https://api.myjudicial.com/v1/whatsapp/webhook
```

---

## 16. Success Criteria

### 16.1 Functional Requirements

- [ ] **Authentication:** OTP and magic link WhatsApp messages sent successfully
- [ ] **Bookings:** Confirmation, reminder, and cancellation WhatsApp messages
- [ ] **Payments:** Payment success and escrow release notifications via WhatsApp
- [ ] **Webhooks:** Delivery status updates received and processed correctly
- [ ] **Admin Panel:** Test message sending and delivery statistics available

### 16.2 Non-Functional Requirements

- [ ] **Performance:** Messages queued and sent within 30 seconds
- [ ] **Reliability:** 99%+ delivery rate for valid phone numbers
- [ ] **Security:** All webhooks properly verified, no unauthorized access
- [ ] **Scalability:** Support 1000+ messages per hour without performance degradation
- [ ] **Monitoring:** Delivery failures logged and alerts configured

### 16.3 Integration Requirements

- [ ] **Backward Compatibility:** Existing email notifications continue working
- [ ] **Graceful Degradation:** System functions normally if WhatsApp service fails
- [ ] **Data Consistency:** All notifications logged in database with proper status tracking
- [ ] **Admin Control:** Ability to disable WhatsApp notifications per user or globally

---

## 17. Post-Implementation Checklist

### 17.1 Code Quality
- [ ] All TypeScript compiles without errors
- [ ] ESLint passes with no violations
- [ ] Unit tests written for core functions (>80% coverage)
- [ ] Integration tests for webhook handling
- [ ] Manual testing completed with test phone numbers

### 17.2 Documentation
- [ ] OpenAPI specifications updated with new endpoints
- [ ] README updated with WhatsApp setup instructions
- [ ] Environment variable documentation complete
- [ ] Admin guide for template management created

### 17.3 Production Readiness
- [ ] Meta webhook URL configured and verified
- [ ] All templates submitted and approved by Meta
- [ ] Production environment variables configured
- [ ] Monitoring and alerting set up for failures
- [ ] Rate limiting tested and configured appropriately

### 17.4 Security Review
- [ ] Webhook signature verification tested
- [ ] Phone number validation comprehensive
- [ ] Rate limiting prevents abuse
- [ ] Admin endpoints properly protected
- [ ] No sensitive data logged in plaintext

---

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating WhatsApp Cloud API into MyJudicial while following the existing architectural patterns and maintaining production-ready quality standards.

The plan prioritizes:
1. **Reuse of existing patterns** (cron jobs, repository pattern, error handling)
2. **Graceful degradation** (WhatsApp failures don't break core functionality)  
3. **Security-first approach** (webhook verification, rate limiting, input validation)
4. **Future extensibility** (designed for rich media, interactive messages, AI integration)

**Estimated Implementation Time:** 5 days  
**Risk Level:** Medium (dependent on Meta approvals and webhook setup)  
**Business Impact:** High (enables mobile-first engagement for Rwanda market)

**Recommendation:** Proceed with implementation following this plan, starting with core infrastructure and Meta webhook setup in parallel with template approval process.

---

**Awaiting Approval to Begin Implementation**