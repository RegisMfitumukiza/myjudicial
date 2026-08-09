# Review & Rating System — Implementation Plan

**Date:** 2026-06-30  
**Feature:** Phase 1 — Review & Rating System  
**Reference Documents:**
- docs/prompts/phase-1/01_Review_Rating_System.md
- docs/prompts/00_Project_Onboarding.md
- docs/prompts/01_Feature_Playbook.md
- docs/architecture/MyJudicial_Master_Build_Reference.md
- docs/architecture/AUDIT_REPORT.md

---

## 1. Project Understanding Summary

### Product Overview
MyJudicial is a two-sided legal marketplace connecting citizens with verified lawyers in Rwanda through a geo-pinned map interface. The platform handles bookings, payments via Flutterwave, video consultations via LiveKit, and secure document storage on OCI.

### Architecture Summary
- **Domain-Driven Design** with clean architecture
- **Repository Pattern** — database access isolated to repositories
- **Service Layer** — business logic in services
- **Thin Controllers** — handle HTTP only
- **Prisma ORM** — type-safe PostgreSQL access
- **Zod Validation** — input validation on all endpoints
- **Centralized Error Handling** — custom error classes
- **Audit Logging** — comprehensive tracking

### Technology Stack
- Node.js + Express.js + TypeScript
- PostgreSQL 16 + PostGIS (via Supabase)
- Prisma ORM
- Zod validation
- JWT authentication
- Brevo (transactional email)

---

## 2. Existing Implementation Review

### ✅ What Already Exists

**Database Schema:**
- ✅ `Review` table exists with proper structure:
  - `id`, `bookingId` (unique), `citizenId`, `expertId`
  - `rating` (Int), `comment` (String)
  - `createdAt` timestamp
  - Proper foreign keys and indexes
- ✅ `ExpertProfile` has denormalized fields:
  - `averageRating` (Decimal 3,2)
  - `reviewCount` (Int, default 0)
- ✅ `AuditLog` supports `REVIEW` resource type
- ✅ `AuditAction` enum includes CREATE, UPDATE, DELETE

**Infrastructure:**
- ✅ Authentication middleware (`authenticate.ts`)
- ✅ Authorization middleware (role-based)
- ✅ Validation middleware (`validate.ts`)
- ✅ Error handling (custom errors + global handler)
- ✅ Audit logging utility (`audit.ts`)
- ✅ Email service (Brevo integration)
- ✅ Logger utility

**Booking Module:**
- ✅ Complete booking workflow (PENDING → CONFIRMED → COMPLETED)
- ✅ Booking status validation
- ✅ Ownership verification pattern
- ✅ Repository pattern implemented
- ✅ Service layer with business logic
- ✅ Thin controllers

**Existing Patterns to Follow:**
- Controller: thin, delegates to service
- Service: orchestrates business logic, calls repositories
- Repository: Prisma queries only
- Schema: Zod validation
- Routes: Express router with middleware chain
- Error handling: throw custom errors, caught by global handler

### ❌ What is Missing

1. **Review Module** — 0% implemented
   - No controllers
   - No services
   - No repositories
   - No validation schemas
   - No routes
   - No DTOs

2. **Rating Aggregation Logic** — not implemented
   - Denormalized fields exist but not updated
   - No trigger mechanism

3. **Review Moderation** — not implemented
   - No admin moderation endpoints
   - No moderation status (schema only supports basic fields)

4. **Review Reporting** — not implemented
   - No reporting mechanism
   - No report table

5. **Edit Window Enforcement** — not implemented
   - No time-based edit restrictions

---

## 3. Gap Analysis

### Critical Gaps (MVP Blockers)
1. Review submission after completed bookings
2. Rating aggregation on ExpertProfile
3. Review listing (by expert, by citizen)
4. Edit window enforcement
5. Delete within window

### Secondary Gaps (Post-MVP)
1. Review moderation by admin
2. Review reporting system
3. Review reactions/helpful votes
4. Expert replies to reviews
5. Review status (PENDING, PUBLISHED, HIDDEN, FLAGGED, REMOVED)

---

## 4. Database Review

### Current Schema Assessment

The existing `Review` table is production-ready but minimal:

```prisma
model Review {
  id String @id @default(uuid())

  bookingId String  @unique    // ✅ One review per booking
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  citizenId String
  citizen   User   @relation(fields: [citizenId], references: [id])

  expertId String
  expert   ExpertProfile @relation(fields: [expertId], references: [id])

  rating  Int        // ✅ 1-5 stars
  comment String?    // ✅ Optional comment

  createdAt DateTime @default(now())  // ✅ Creation timestamp

  @@index([expertId])
  @@index([citizenId])
  @@map("reviews")
}
```

### ✅ Strengths
- Unique constraint on `bookingId` prevents duplicate reviews
- Proper foreign keys with cascade delete
- Indexed for fast expert and citizen lookups
- Simple, focused schema

### 🟡 Limitations (for future enhancement)
- No `updatedAt` field (cannot track edits)
- No `editedAt` field (cannot enforce edit window)
- No moderation status enum
- No admin moderation fields
- No title field
- No helpful/unhelpful reaction counts

### Recommendation: DO NOT MODIFY SCHEMA YET

**Rationale:**
- Current schema supports MVP requirements
- Adding fields now would be premature optimization
- Edit tracking can be done via audit logs initially
- Moderation can be Phase 2

**Future Schema Extensions (Phase 2):**
```prisma
model Review {
  // ... existing fields
  title String?  // Review headline
  updatedAt DateTime @updatedAt
  editedAt DateTime?
  status ReviewStatus @default(PUBLISHED)
  moderatedBy String?
  moderatedAt DateTime?
  moderationReason String?
  helpfulCount Int @default(0)
  unhelpfulCount Int @default(0)
}

enum ReviewStatus {
  PENDING
  PUBLISHED
  HIDDEN
  FLAGGED
  REMOVED
}

model ReviewReport {
  id String @id @default(uuid())
  reviewId String
  reportedBy String
  reason String
  createdAt DateTime @default(now())
}
```

---

## 5. Implementation Strategy

### Phase 1: Core Review Functionality (MVP)

**Deliverables:**
1. Review submission API
2. Review retrieval APIs
3. Rating aggregation
4. Edit within 7-day window
5. Delete within 7-day window
6. Basic validation
7. Ownership enforcement
8. Email notifications

**Out of Scope for Phase 1:**
- Admin moderation UI
- Review reporting
- Review status workflow
- Expert replies
- Review reactions

---

## 6. Detailed Implementation Plan

### 6.1 File Structure

Create new module: `src/modules/reviews/`

```
src/modules/reviews/
├── review.controller.ts      # HTTP handlers
├── review.service.ts         # Business logic
├── review.repository.ts      # Database access
├── review.schemas.ts         # Zod validation
├── review.routes.ts          # Express routes
└── dto/
    ├── create-review.dto.ts  # (optional, inline in schemas is fine)
    └── update-review.dto.ts
```

### 6.2 API Endpoints

#### Public/Authenticated Endpoints

**1. POST /api/v1/bookings/:bookingId/review**
- **Auth:** Required (citizen only)
- **Body:** `{ rating: number, comment?: string }`
- **Business Rules:**
  - Booking must exist
  - Booking must be COMPLETED
  - Booking.citizenId must match authenticated user
  - No existing review for this booking
  - Rating must be 1-5
  - Comment max 2000 characters
- **Response:** Created review object
- **Side Effects:**
  - Update ExpertProfile.averageRating
  - Update ExpertProfile.reviewCount
  - Send email to expert
  - Write audit log

**2. PATCH /api/v1/reviews/:id**
- **Auth:** Required (owner only)
- **Body:** `{ rating?: number, comment?: string }`
- **Business Rules:**
  - Review must exist
  - Review.citizenId must match authenticated user
  - Review.createdAt must be within 7 days
  - Rating must be 1-5 (if provided)
- **Response:** Updated review object
- **Side Effects:**
  - Recalculate ExpertProfile.averageRating
  - Write audit log

**3. DELETE /api/v1/reviews/:id**
- **Auth:** Required (owner only)
- **Business Rules:**
  - Review must exist
  - Review.citizenId must match authenticated user
  - Review.createdAt must be within 7 days
- **Response:** Success message
- **Side Effects:**
  - Soft delete (or hard delete)
  - Recalculate ExpertProfile.averageRating
  - Update ExpertProfile.reviewCount
  - Write audit log

**4. GET /api/v1/experts/:expertId/reviews**
- **Auth:** Optional
- **Query:** `?page=1&limit=10&sort=newest|oldest|highest|lowest`
- **Response:** Paginated list of reviews
- **Filters:**
  - By expert
  - Exclude deleted/hidden reviews
  - Sort options

**5. GET /api/v1/reviews/my-reviews**
- **Auth:** Required
- **Query:** `?page=1&limit=10`
- **Response:** Paginated list of user's reviews

**6. GET /api/v1/reviews/:id**
- **Auth:** Optional (but enforce ownership for private reviews)
- **Response:** Single review object

#### Admin Endpoints (Phase 2)

**7. PATCH /api/v1/admin/reviews/:id/moderate**
- **Auth:** Required (ADMIN only)
- **Body:** `{ action: 'hide'|'restore'|'remove', reason?: string }`

**8. GET /api/v1/admin/reviews/flagged**
- **Auth:** Required (ADMIN only)
- **Response:** List of flagged reviews

**9. POST /api/v1/reviews/:id/report**
- **Auth:** Required
- **Body:** `{ reason: string, details?: string }`

---

## 7. Business Logic Specification

### 7.1 Review Submission

```typescript
// Pseudocode
async createReview(bookingId: string, citizenId: string, dto: CreateReviewDto) {
  // 1. Fetch booking with relations
  const booking = await BookingRepository.findById(bookingId);
  
  // 2. Validate booking exists
  if (!booking) throw NotFoundError("Booking not found");
  
  // 3. Validate ownership
  if (booking.citizenId !== citizenId) {
    throw AuthorizationError("Cannot review booking you did not participate in");
  }
  
  // 4. Validate booking is completed
  if (booking.status !== "COMPLETED") {
    throw ValidationError("Can only review completed bookings");
  }
  
  // 5. Validate no existing review
  const existing = await ReviewRepository.findByBookingId(bookingId);
  if (existing) throw ConflictError("Review already exists for this booking");
  
  // 6. Validate rating range
  if (dto.rating < 1 || dto.rating > 5) {
    throw ValidationError("Rating must be between 1 and 5");
  }
  
  // 7. Create review
  const review = await ReviewRepository.create({
    bookingId,
    citizenId,
    expertId: booking.expertId,
    rating: dto.rating,
    comment: dto.comment,
  });
  
  // 8. Update expert aggregated stats
  await ReviewRepository.updateExpertRatingStats(booking.expertId);
  
  // 9. Send notification email to expert
  await sendReviewNotificationEmail(booking.expert.user.email, {
    expertName: booking.expert.displayName,
    rating: dto.rating,
    reviewId: review.id,
  });
  
  // 10. Write audit log
  await writeAuditLog({
    actorId: citizenId,
    action: "CREATE",
    resource: "REVIEW",
    resourceId: review.id,
    description: `Created review for booking ${bookingId}`,
  });
  
  return review;
}
```

### 7.2 Rating Aggregation

```typescript
async updateExpertRatingStats(expertId: string) {
  const stats = await prisma.review.aggregate({
    where: { expertId },
    _avg: { rating: true },
    _count: { id: true },
  });
  
  await prisma.expertProfile.update({
    where: { id: expertId },
    data: {
      averageRating: stats._avg.rating ?? null,
      reviewCount: stats._count.id,
    },
  });
}
```

### 7.3 Edit Window Enforcement

```typescript
const EDIT_WINDOW_DAYS = 7;

function canEditReview(createdAt: Date): boolean {
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= EDIT_WINDOW_DAYS;
}

async updateReview(reviewId: string, citizenId: string, dto: UpdateReviewDto) {
  const review = await ReviewRepository.findById(reviewId);
  
  if (!review) throw NotFoundError("Review not found");
  if (review.citizenId !== citizenId) {
    throw AuthorizationError("Cannot edit someone else's review");
  }
  
  if (!canEditReview(review.createdAt)) {
    throw ValidationError(`Review can only be edited within ${EDIT_WINDOW_DAYS} days`);
  }
  
  // ... proceed with update
}
```

---

## 8. Validation Schemas (Zod)

```typescript
// review.schemas.ts

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(2000, "Comment must be at most 2000 characters").optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
}).refine(data => data.rating !== undefined || data.comment !== undefined, {
  message: "At least one field (rating or comment) must be provided",
});

export const listReviewsSchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});
```

---

## 9. Email Notifications

### New Email Template Required

**Template:** Review Notification Email

**Recipient:** Expert  
**Trigger:** New review submitted  
**Content:**

```
Subject: New Review Received

Hi {{expertName}},

You've received a new {{rating}}-star review from a client.

"{{comment}}"

View your reviews and manage your profile at {{profileLink}}.

Best,
The MyJudicial Team
```

**Implementation:**
- Add template to `src/infrastructure/email/email.service.ts`
- Follow existing pattern (e.g., `sendBookingConfirmationEmail`)

---

## 10. Security Considerations

### Authorization Matrix

| Action | Citizen (Owner) | Expert | Admin | Other Citizen |
|--------|----------------|--------|-------|---------------|
| Create review | ✅ (own booking) | ❌ | ❌ | ❌ |
| View review | ✅ | ✅ | ✅ | ✅ (public) |
| Edit review | ✅ (within 7 days) | ❌ | ❌ | ❌ |
| Delete review | ✅ (within 7 days) | ❌ | ❌ | ❌ |
| Moderate review | ❌ | ❌ | ✅ (Phase 2) | ❌ |

### Sensitive Data Handling

**Never Expose:**
- Citizen phone numbers
- Citizen full personal details beyond name
- Expert contact information
- Booking payment details

**Always Include:**
- Citizen first name + last initial (e.g., "John D.")
- Rating
- Comment (sanitized)
- Review date

---

## 11. Performance Considerations

### Database Indexes

**Existing (sufficient):**
```prisma
@@index([expertId])  // ✅ Fast expert review lookups
@@index([citizenId]) // ✅ Fast citizen review lookups
@@unique([bookingId]) // ✅ Fast booking → review lookup
```

**No additional indexes needed for MVP.**

### Denormalization Strategy

- `averageRating` and `reviewCount` on `ExpertProfile` prevent expensive aggregations on every request
- Update strategy: recalculate on every review create/update/delete
- Trade-off: Slight inconsistency risk (acceptable) vs. massive performance gain

### N+1 Query Prevention

```typescript
// ✅ Good: Include relations in single query
const reviews = await prisma.review.findMany({
  where: { expertId },
  include: {
    citizen: { select: { firstName: true, lastName: true } },
  },
});

// ❌ Bad: Separate queries per review
const reviews = await prisma.review.findMany({ where: { expertId } });
for (const review of reviews) {
  const citizen = await prisma.user.findUnique({ where: { id: review.citizenId } });
}
```

---

## 12. Testing Strategy (Phase 2)

### Unit Tests
- `ReviewService.createReview()`
- `ReviewService.updateReview()`
- `ReviewService.deleteReview()`
- `ReviewRepository.updateExpertRatingStats()`
- Edit window validation logic

### Integration Tests
- POST /api/v1/bookings/:id/review
- PATCH /api/v1/reviews/:id
- DELETE /api/v1/reviews/:id
- GET /api/v1/experts/:id/reviews

### Test Cases
- ✅ Create review for completed booking
- ❌ Create review for non-completed booking
- ❌ Create duplicate review
- ❌ Create review for someone else's booking
- ❌ Edit review after 7 days
- ✅ Edit review within 7 days
- ❌ Delete review after 7 days
- ✅ Rating aggregation updates correctly

---

## 13. Migration Plan

### No Migration Required

The `Review` table already exists in production schema. No database changes needed.

---

## 14. Rollout Plan

### Phase 1 Implementation Order

**Step 1: Repository Layer** (1 hour)
- `review.repository.ts`
- CRUD operations
- Rating aggregation helper

**Step 2: Service Layer** (2 hours)
- `review.service.ts`
- Business logic
- Edit window enforcement
- Rating aggregation trigger

**Step 3: Validation Schemas** (30 min)
- `review.schemas.ts`
- Zod schemas for all DTOs

**Step 4: Controller Layer** (1 hour)
- `review.controller.ts`
- HTTP handlers
- Error handling

**Step 5: Routes** (30 min)
- `review.routes.ts`
- Middleware chain
- Authentication/authorization

**Step 6: Email Notification** (30 min)
- Add template to email service
- Fire-and-forget notification

**Step 7: Integration** (30 min)
- Register routes in main app
- Update API documentation

**Step 8: Manual Testing** (1 hour)
- Test all endpoints
- Verify business rules
- Check email delivery

**Total Estimated Time: 7 hours**

---

## 15. Risks & Mitigation

### Risk 1: Rating Manipulation
**Threat:** Users creating fake bookings to leave fraudulent reviews  
**Mitigation:** 
- Enforce COMPLETED booking requirement
- Require payment completion
- One review per booking (unique constraint)

### Risk 2: Offensive Content
**Threat:** Inappropriate comments in reviews  
**Mitigation:**
- Phase 1: Manual moderation (admin can delete)
- Phase 2: Automated content moderation (AI-based)

### Risk 3: Edit Abuse
**Threat:** Users editing reviews to change meaning maliciously  
**Mitigation:**
- 7-day edit window
- Audit logs track all changes
- Phase 2: Show "edited" badge

### Risk 4: Performance Degradation
**Threat:** Aggregation queries slow down expert profile loads  
**Mitigation:**
- Denormalized fields (averageRating, reviewCount)
- Proper indexing
- Pagination on review lists

---

## 16. Success Metrics

### MVP Success Criteria

1. ✅ Citizens can review completed bookings
2. ✅ Reviews appear on expert profiles
3. ✅ Rating aggregation updates automatically
4. ✅ Edit window enforced (7 days)
5. ✅ Authorization working (owner-only edits)
6. ✅ Email notifications sent
7. ✅ No duplicate reviews possible
8. ✅ Performance acceptable (<200ms p95)

### Post-Launch Metrics (Phase 2)

- Review submission rate (% of completed bookings)
- Average time to first review
- Expert response rate (Phase 2 feature)
- Flagged review rate
- Average rating distribution

---

## 17. Documentation Requirements

### API Documentation

Add to OpenAPI/Swagger specs:
- All 6 review endpoints
- Request/response schemas
- Error responses
- Examples

### Architecture Documentation

Update:
- `docs/architecture/AUDIT_REPORT.md` — mark review system as complete
- `docs/architecture/IMPLEMENTATION_ROADMAP.md` — move to "Recently Completed"

### Code Documentation

- JSDoc comments on all public service methods
- Inline comments for complex business logic
- README in `src/modules/reviews/` explaining module structure

---

## 18. Next Steps

### Immediate Actions

1. **Review this plan with stakeholders** — confirm business rules
2. **Validate edit window duration** — is 7 days correct?
3. **Confirm email notification copy** — review template text
4. **Begin implementation** — follow file creation order above

### Future Enhancements (Phase 2)

1. Admin moderation workflow
2. Review reporting system
3. Review status lifecycle
4. Expert replies to reviews
5. Helpful/unhelpful voting
6. Verified purchase badges
7. AI sentiment analysis
8. Content moderation automation

---

## 19. Definition of Done

This feature is complete when:

- ✅ All Phase 1 endpoints implemented
- ✅ Business rules enforced
- ✅ Validation complete
- ✅ Authorization working
- ✅ Rating aggregation accurate
- ✅ Email notifications sent
- ✅ Audit logs written
- ✅ No duplicate reviews possible
- ✅ Edit window enforced
- ✅ Error handling complete
- ✅ TypeScript compiles
- ✅ Linting passes
- ✅ Manual testing complete
- ✅ API documentation updated
- ✅ Architecture docs updated
- ✅ Code review complete

---

**End of Implementation Plan**
