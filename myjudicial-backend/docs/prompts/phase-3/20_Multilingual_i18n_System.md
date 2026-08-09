# Multilingual i18n System — Requirements Document

> **Feature ID:** Phase 3.20  
> **Priority:** High (Foundation for Rwanda + East Africa expansion)  
> **Roadmap:** v1.0 MVP (Week 6) → v1.3 Multi-Jurisdiction (Q3)  
> **Dependencies:** Existing `users.preferredLanguage` field, expert `languages` array

---

## 1. Product Context

MyJudicial operates in **multilingual East Africa**, where citizens and legal experts communicate in:
- **Kinyarwanda** (Rwanda national language)
- **English** (regional business language)
- **French** (official language in Rwanda, DRC, Burundi)
- **Swahili** (planned for Kenya, Tanzania, Uganda expansion in v1.3)

### Current State

✅ **Already Implemented:**
- Database field: `users.preferredLanguage` (`en` | `fr` | `rw`)
- API endpoints: `POST /auth/register`, `PATCH /auth/me` accept/update language preference
- Frontend component: `LanguageSettingsCard.tsx` with dropdown selector
- Expert spoken languages: `legal_experts.languages` array (Kinyarwanda, English, French, Swahili)

❌ **Missing:**
- Translation library integration (next-intl or react-i18next)
- Translation dictionaries for UI text
- Language-aware content rendering
- Email template translations
- WhatsApp message templates per language
- Admin content management for multi-language announcements

---

## 2. User Stories

### 2.1 Citizen / Client

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| L-01 | Kinyarwanda-speaking citizen | See the entire interface in Kinyarwanda | I can navigate without language barriers |
| L-02 | French-speaking user | Switch language to French in settings | The UI updates immediately without re-login |
| L-03 | User with low literacy | Hear voice prompts in my preferred language | I can use the platform without reading |
| L-04 | Mobile user in rural area | Load translations efficiently (small bundle) | The app works on slow 2G/3G networks |

### 2.2 Legal Expert

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| L-05 | Multilingual lawyer | Specify which languages I speak | Clients can filter by language during search |
| L-06 | French-speaking expert | Receive booking notifications in French | I understand communications without translation |
| L-07 | Expert with Swahili clients | See client language preference before consultation | I can prepare in the right language |

### 2.3 Admin

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| L-08 | Platform admin | Send announcements in multiple languages | All users receive messages in their preferred language |
| L-09 | Content moderator | View content in original language + auto-translation | I can moderate Kinyarwanda content even if I only speak English |

---

## 3. Technical Requirements

### 3.1 Frontend i18n System

#### 3.1.1 Library Selection: **next-intl**

**Rationale:**
- Built for Next.js 13+ App Router (matches project architecture)
- Server component support (better SEO for static pages)
- Type-safe translations (compile-time error detection)
- Smaller bundle size than react-i18next (~40% lighter)
- Simple setup for 3-language support

**Installation:**
```bash
npm install next-intl
```

#### 3.1.2 Directory Structure

```
myjudicial-frontend/
├── messages/
│   ├── en.json          # English translations
│   ├── fr.json          # French translations
│   ├── rw.json          # Kinyarwanda translations
│   └── (sw.json)        # Swahili (v1.3)
├── src/
│   ├── i18n.ts          # next-intl configuration
│   ├── middleware.ts    # Locale detection middleware
│   └── app/
│       └── [locale]/    # Locale-based routing
```

#### 3.1.3 Translation File Schema

**Format:** Nested JSON with namespacing

```json
{
  "common": {
    "welcome": "Welcome to MyJudicial",
    "loading": "Loading...",
    "save": "Save Changes",
    "cancel": "Cancel"
  },
  "auth": {
    "login": "Log In",
    "register": "Create Account",
    "otp_sent": "OTP code sent to {email}",
    "invalid_credentials": "Invalid email or password"
  },
  "search": {
    "find_lawyer": "Find a Lawyer",
    "filters": {
      "specialty": "Legal Specialty",
      "language": "Spoken Language",
      "location": "Location",
      "price_range": "Price Range"
    }
  },
  "booking": {
    "confirm": "Confirm Booking",
    "payment_pending": "Payment Pending",
    "session_starts_in": "Session starts in {minutes} minutes"
  },
  "triage": {
    "ai_assistant": "AI Triage Assistant",
    "describe_issue": "Describe your legal issue",
    "analyzing": "Analyzing your case...",
    "top_matches": "Top {count} Recommended Lawyers"
  }
}
```

**Dynamic Values:**
- Use ICU MessageFormat for plurals: `{count, plural, one {# lawyer} other {# lawyers}}`
- Use variables: `{expertName} is available at {time}`

#### 3.1.4 URL Strategy

**Option A: Path-based (Recommended)**
```
app.myjudicial.com/en/search
app.myjudicial.com/fr/recherche
app.myjudicial.com/rw/gushakisha
```

**Option B: Domain-based (Future)**
```
en.myjudicial.com
fr.myjudicial.com
rw.myjudicial.com
```

**Option C: Cookie/Header-based (No SEO benefit)**
- Use for authenticated pages only (dashboard, settings)

**Hybrid Approach (Recommended):**
- Public pages: Path-based (`/en/search`)
- Authenticated pages: Cookie-based (no `/en/` in URL after login)

#### 3.1.5 Locale Detection Logic

Priority order:
1. **Explicit user selection** (from settings)
2. **Cookie** (`NEXT_LOCALE` persisted on user choice)
3. **Accept-Language header** (browser preference)
4. **Default fallback** (`en`)

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'fr', 'rw'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Hide /en/ for default locale
});
```

#### 3.1.6 Component Usage Pattern

```tsx
// Client component
"use client";
import { useTranslations } from 'next-intl';

export function SearchBar() {
  const t = useTranslations('search');
  return (
    <input placeholder={t('find_lawyer')} />
  );
}

// Server component
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('search');
  return <h1>{t('find_lawyer')}</h1>;
}
```

### 3.2 Backend i18n Support

#### 3.2.1 Email Templates (Brevo)

**Current State:** Hardcoded English templates

**Required:**
- Store templates per language in Brevo dashboard
- Send emails based on `user.preferredLanguage`
- Fallback to English if translation missing

**Templates to Translate:**
1. OTP Code (`otp-code-en`, `otp-code-fr`, `otp-code-rw`)
2. Booking Confirmation
3. Booking Reminder (24h, 1h before)
4. Escrow Receipt
5. Expert Verification Approval
6. Compliance Warning (30 days before expiry)

**API Call Pattern:**
```typescript
// src/modules/notifications/services/email.service.ts
async sendOTP(email: string, code: string, language: 'en' | 'fr' | 'rw') {
  const templateMap = {
    en: 'otp-code-en',
    fr: 'otp-code-fr',
    rw: 'otp-code-rw',
  };
  
  await brevoClient.sendTransactionalEmail({
    templateId: getTemplateId(templateMap[language]),
    to: [{ email }],
    params: { otp_code: code },
  });
}
```

#### 3.2.2 WhatsApp Templates (Meta Cloud API)

**Requirements:**
- Register message templates in 3 languages with Meta
- Select template based on user language
- Quick reply buttons must match language

**Example Template Structure:**
```json
{
  "name": "booking_confirmation",
  "language": "en",
  "components": [
    {
      "type": "body",
      "text": "Your consultation with {{1}} is confirmed for {{2}}."
    },
    {
      "type": "button",
      "buttons": [
        { "type": "quick_reply", "text": "View Details" },
        { "type": "quick_reply", "text": "Reschedule" }
      ]
    }
  ]
}
```

**Database Update:**
```sql
-- WhatsApp template storage
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  language VARCHAR(10),
  meta_template_id VARCHAR(100),
  body_text TEXT,
  parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data
INSERT INTO whatsapp_templates (name, language, meta_template_id, body_text, parameters)
VALUES 
  ('booking_confirmation', 'en', 'tmpl_booking_en', 'Your consultation...', '["expertName", "dateTime"]'),
  ('booking_confirmation', 'fr', 'tmpl_booking_fr', 'Votre consultation...', '["expertName", "dateTime"]'),
  ('booking_confirmation', 'rw', 'tmpl_booking_rw', 'Inama yawe...', '["expertName", "dateTime"]');
```

#### 3.2.3 API Response Messages

**Current:** Error messages hardcoded in English

**Required:** Language-aware error responses

**Implementation:**
```typescript
// src/shared/utils/i18n-messages.ts
const errorMessages = {
  INVALID_CREDENTIALS: {
    en: "Invalid email or password",
    fr: "E-mail ou mot de passe invalide",
    rw: "Imeri cyangwa ijambobanga bidakwiye",
  },
  BOOKING_UNAVAILABLE: {
    en: "This time slot is no longer available",
    fr: "Ce créneau horaire n'est plus disponible",
    rw: "Iyi gihe ntikiri iboneka",
  },
};

export function getErrorMessage(
  code: keyof typeof errorMessages,
  language: 'en' | 'fr' | 'rw' = 'en'
): string {
  return errorMessages[code]?.[language] || errorMessages[code].en;
}

// Usage in route handler
app.post('/auth/login', async (req, res) => {
  const userLang = req.user?.preferredLanguage || 'en';
  
  if (!isValidCredentials) {
    return res.status(401).json({
      error: getErrorMessage('INVALID_CREDENTIALS', userLang)
    });
  }
});
```

### 3.3 Database Schema Updates

#### 3.3.1 Translation Storage for Dynamic Content

```sql
-- Multilingual legal specialty descriptions
CREATE TABLE specialty_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_code VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  UNIQUE(specialty_code, language)
);

-- Example data
INSERT INTO specialty_translations (specialty_code, language, display_name, description)
VALUES 
  ('PROPERTY_LAW', 'en', 'Property Law', 'Land disputes, title deeds, boundary conflicts'),
  ('PROPERTY_LAW', 'fr', 'Droit de la propriété', 'Litiges fonciers, titres de propriété, conflits de limites'),
  ('PROPERTY_LAW', 'rw', 'Amategeko y\'imitungo', 'Amakimbirane ku butaka, ibyangombwa by\'ubutaka');

-- Admin announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en VARCHAR(255) NOT NULL,
  title_fr VARCHAR(255),
  title_rw VARCHAR(255),
  body_en TEXT NOT NULL,
  body_fr TEXT,
  body_rw TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3.2 Audit Language Preference Changes

```sql
-- Track when users change language (analytics)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Example log
INSERT INTO audit_logs (user_id, action, metadata)
VALUES (
  'user-uuid',
  'LANGUAGE_CHANGED',
  '{"from": "en", "to": "rw", "timestamp": "2025-07-16T10:30:00Z"}'::jsonb
);
```

### 3.4 AI Triage Multilingual Support

**Requirements:**
1. Qwen 2.5 must accept input in 3 languages
2. Return structured JSON regardless of input language
3. Context from Mbaza NLP Corpus loaded in Kinyarwanda

**Prompt Engineering:**
```typescript
const triagePrompt = {
  en: "Analyze this legal query and extract: jurisdiction, specialty, urgency_level, budget_range. Return JSON only.",
  fr: "Analysez cette question juridique et extrayez : juridiction, spécialité, niveau_urgence, fourchette_budget. Retournez JSON uniquement.",
  rw: "Sura iki kibazo cy'amategeko ukure: intara, ubwoko, urwego rw'ihutirwa, ingano y'ingengo y'imari. Garuka JSON gusa.",
};

async function triageMessage(text: string, language: 'en' | 'fr' | 'rw') {
  const systemPrompt = triagePrompt[language];
  const response = await ollamaClient.generate({
    model: 'qwen2.5:1.5b-instruct',
    prompt: `${systemPrompt}\n\nUser query: ${text}`,
    format: 'json',
  });
  
  return JSON.parse(response.text);
}
```

**Expected Output (language-agnostic):**
```json
{
  "jurisdiction": "RWANDA_KIGALI",
  "specialty": "PROPERTY_LAW",
  "urgency_level": "HIGH",
  "budget_range": "10000-50000"
}
```

---

## 4. Implementation Plan

### Phase 1: Frontend Foundation (Week 1)

- [ ] Install `next-intl` package
- [ ] Create `messages/` directory with initial translations
- [ ] Configure middleware for locale detection
- [ ] Wrap app in `NextIntlClientProvider`
- [ ] Migrate 20 most-used UI strings (auth, navigation, common actions)
- [ ] Update `LanguageSettingsCard` to trigger full UI re-render on save

### Phase 2: Backend Email/SMS (Week 1)

- [ ] Create Brevo templates in 3 languages
- [ ] Update email service to select template by user language
- [ ] Register WhatsApp templates with Meta (3 languages each)
- [ ] Add `whatsapp_templates` table
- [ ] Update WhatsApp service to query language-specific template

### Phase 3: Translation Expansion (Week 2)

- [ ] Translate all remaining UI strings (search, booking, triage, settings)
- [ ] Translate form validation messages
- [ ] Translate error states
- [ ] Add dynamic date/time formatting per locale
- [ ] Add currency formatting (RWF vs TZS vs KES based on language/region)

### Phase 4: API Error Messages (Week 2)

- [ ] Create centralized error message dictionary
- [ ] Update all route handlers to use `getErrorMessage(code, lang)`
- [ ] Add `Accept-Language` header parsing for unauthenticated requests

### Phase 5: Admin CMS (Week 3)

- [ ] Add multilingual announcement creation UI
- [ ] Create API endpoint: `POST /admin/announcements` (accepts all 3 languages)
- [ ] Display announcements to users in their preferred language

### Phase 6: Testing & QA (Week 3)

- [ ] Manual testing: Switch language in settings → verify UI updates
- [ ] Test email/WhatsApp delivery in 3 languages
- [ ] Test AI triage with Kinyarwanda voice input
- [ ] Verify fallback to English when translation missing
- [ ] Test RTL language support (future Arabic expansion)

---

## 5. API Specifications

### 5.1 Update User Language Preference

**Endpoint:** `PATCH /auth/me`

**Request:**
```json
{
  "preferredLanguage": "rw"
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "preferredLanguage": "rw",
    "updatedAt": "2025-07-16T10:30:00Z"
  }
}
```

**Behavior:**
- Update `users.preferredLanguage` in PostgreSQL
- Sync to Supabase Auth metadata
- Invalidate user cache in Redis
- Return updated user object

### 5.2 Get Localized Specialty List

**Endpoint:** `GET /experts/specialties?lang=rw`

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "code": "PROPERTY_LAW",
      "displayName": "Amategeko y'imitungo",
      "description": "Amakimbirane ku butaka, ibyangombwa by'ubutaka"
    },
    {
      "code": "FAMILY_LAW",
      "displayName": "Amategeko y'umuryango",
      "description": "Gushyingiranwa, gutandukana, kureza abana"
    }
  ]
}
```

### 5.3 Create Multilingual Announcement (Admin)

**Endpoint:** `POST /admin/announcements`

**Request:**
```json
{
  "title": {
    "en": "System Maintenance Notice",
    "fr": "Avis de maintenance système",
    "rw": "Itangazo ryo kubungabunga sisitemu"
  },
  "body": {
    "en": "MyJudicial will undergo scheduled maintenance on July 20.",
    "fr": "MyJudicial subira une maintenance programmée le 20 juillet.",
    "rw": "MyJudicial izakora ibikorwa byo kubungabunga ku ya 20 Nyakanga."
  },
  "publishAt": "2025-07-18T08:00:00Z"
}
```

**Response:**
```json
{
  "status": 201,
  "data": {
    "id": "announcement-uuid",
    "publishedAt": "2025-07-18T08:00:00Z"
  }
}
```

---

## 6. Translation Guidelines

### 6.1 Key Principles

1. **Clarity over literal translation** — legal terms must be understandable
2. **Consistent terminology** — use same word for "lawyer" throughout
3. **Cultural adaptation** — "Mobile Money" → "MTN MoMo / Airtel Money" in Rwanda
4. **Gender-neutral language** — avoid gendered pronouns where possible
5. **Respectful tone** — maintain professional legal context

### 6.2 Priority Translation List (MVP)

| Category | String Count | Priority |
|----------|--------------|----------|
| Authentication | 25 | P0 |
| Navigation | 15 | P0 |
| Search & Filters | 30 | P0 |
| Booking Flow | 40 | P0 |
| AI Triage | 20 | P1 |
| Settings | 15 | P1 |
| Error Messages | 50 | P1 |
| Email Templates | 6 templates | P0 |
| WhatsApp Templates | 8 templates | P0 |
| Legal Specialties | 20 terms | P2 |

**Total MVP Strings:** ~220 strings × 3 languages = **660 translations**

### 6.3 Translation Workflow

1. **Extract:** Developer adds string to `en.json`
2. **Flag:** Mark untranslated strings with `__TODO__` prefix in `fr.json`/`rw.json`
3. **Translate:** Professional translator reviews and replaces `__TODO__` markers
4. **Review:** Native speaker QA reviews all translations
5. **Commit:** Merge translations into `main` branch

**Tooling:**
- Use `next-intl` CLI to extract missing keys
- GitHub PR auto-comments on untranslated keys
- CI fails if `__TODO__` markers exist in production build

---

## 7. Performance Considerations

### 7.1 Bundle Size Impact

**next-intl library:** ~12 KB gzipped  
**Translation files:** ~8 KB per language × 3 = 24 KB  
**Total overhead:** ~36 KB (acceptable for mobile)

**Optimization:**
- Load only active language (code-split other languages)
- Use CDN caching for translation files
- Enable Brotli compression (40% smaller than gzip)

### 7.2 Runtime Performance

- Translations cached in memory after first load
- No runtime lookups after hydration
- Server-side translation for static pages (instant rendering)

### 7.3 SEO Impact

**Benefits:**
- Each language gets unique URL (`/en/search`, `/fr/recherche`)
- Search engines index all language variants
- `hreflang` tags link alternate language versions

**Implementation:**
```tsx
// app/[locale]/layout.tsx
export async function generateMetadata({ params }: { params: { locale: string } }) {
  return {
    alternates: {
      canonical: `https://app.myjudicial.com/${params.locale}`,
      languages: {
        'en': 'https://app.myjudicial.com/en',
        'fr': 'https://app.myjudicial.com/fr',
        'rw': 'https://app.myjudicial.com/rw',
      },
    },
  };
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// __tests__/i18n/translations.test.ts
import { getTranslations } from 'next-intl';

describe('Translation Coverage', () => {
  it('should have all keys in all languages', () => {
    const enKeys = Object.keys(require('../../messages/en.json'));
    const frKeys = Object.keys(require('../../messages/fr.json'));
    const rwKeys = Object.keys(require('../../messages/rw.json'));
    
    expect(frKeys).toEqual(enKeys);
    expect(rwKeys).toEqual(enKeys);
  });
  
  it('should format dynamic values correctly', async () => {
    const t = await getTranslations({ locale: 'en' });
    expect(t('booking.session_starts_in', { minutes: 15 }))
      .toBe('Session starts in 15 minutes');
  });
});
```

### 8.2 E2E Tests (Playwright)

```typescript
test('User can switch language and see UI update', async ({ page }) => {
  await page.goto('/en/settings');
  await page.selectOption('select[name="language"]', 'fr');
  await page.click('button:has-text("Save Changes")');
  
  // Verify navigation changed to French
  await expect(page.locator('nav a')).toContainText('Recherche');
});
```

### 8.3 Visual Regression Testing

- Take screenshots of key pages in all 3 languages
- Verify text does not overflow containers (Kinyarwanda can be verbose)
- Check RTL language handling (future Arabic/Hebrew)

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Translation coverage | 100% of MVP strings | Automated key extraction |
| Language switch time | < 200ms | Performance monitoring |
| Email delivery (translated) | 99.5% success rate | Brevo analytics |
| User language distribution | 60% rw, 30% en, 10% fr | PostgreSQL analytics |
| Bounce rate (non-English users) | < 15% | Google Analytics by language |
| Support tickets re: language | < 5% of total | Zendesk tagging |

---

## 10. Future Enhancements (Post-MVP)

### v1.3 — Multi-Jurisdiction Expansion (Q3)

- [ ] Add Swahili translations (`sw.json`)
- [ ] Add Tanzania-specific legal terms
- [ ] Add Kenya-specific legal terms
- [ ] Support multiple dialects (Kenyan English vs Rwandan English)
- [ ] Currency localization (KES, TZS, UGX)

### v2.0 — Agentic AI Translation (Q4)

**Note:** This is DIFFERENT from v1.0 static translations. These features use AI to dynamically translate/generate content:

- [ ] AI auto-generates legal documents (contracts, letters) in user's preferred language
- [ ] AI translates lawyer bios from English → French/Kinyarwanda on-demand
- [ ] Real-time video consultation transcription + translation (Kinyarwanda → English for lawyer)
- [ ] AI summarizes case law in simple language (any of 3 languages)
- [ ] AI suggests contract clause improvements in user's native language

**Technology Difference:**
- **v1.0 (Phase 3):** Human-translated static UI text (next-intl JSON files)
- **v2.0 (Future):** AI-powered dynamic content translation (larger Qwen/GPT model)

### v3.0 — Global Scale (Year 2)

- [ ] Add Arabic, Portuguese (Mozambique), Somali
- [ ] Community-contributed translations via Crowdin
- [ ] AI-powered translation quality scoring
- [ ] Regional dialect support (Tanzanian Swahili vs Kenyan Swahili)

---

## 11. Dependencies

| System | Requirement |
|--------|-------------|
| Frontend | `next-intl` package installed |
| Backend | No new dependencies (existing Node.js i18n patterns) |
| Database | `specialty_translations`, `announcements` tables |
| Brevo | Templates created for 3 languages |
| Meta WhatsApp | Templates registered for 3 languages |
| Qwen 2.5 AI | Multilingual prompt engineering |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incomplete translations at launch | High | Ship with English fallback, add missing translations in patches |
| Legal term mistranslation | Critical | Professional legal translator review required |
| Translation files bloat bundle | Medium | Code-split languages, load on-demand |
| Brevo template approval delay | Medium | Start template creation 2 weeks before launch |
| WhatsApp template rejection | High | Follow Meta guidelines strictly, use pre-approved patterns |

---

## 13. Acceptance Criteria

### Frontend

- [ ] User selects language in settings → UI updates within 200ms
- [ ] All navigation, buttons, form labels display in selected language
- [ ] Missing translations fall back to English (no broken UI)
- [ ] Date/time formatting respects locale (e.g., `20/07/2025` in French)
- [ ] Currency displays correctly (RWF 10,000 vs 10 000 RWF)

### Backend

- [ ] Emails sent in user's preferred language
- [ ] WhatsApp messages use correct language template
- [ ] API error messages match user language
- [ ] Admin can create announcements in 3 languages

### AI Triage

- [ ] Accepts Kinyarwanda voice input via Whisper.cpp
- [ ] Returns JSON output regardless of input language
- [ ] Matches experts with compatible spoken languages

### QA

- [ ] Manual testing in all 3 languages passes
- [ ] Automated tests verify translation coverage
- [ ] No string concatenation (breaks grammar in some languages)
- [ ] Pluralization rules work correctly (`1 lawyer` vs `2 lawyers`)

---

*This requirements document should be read alongside:*
- `MyJudicial_Master_Build_Reference.md` (architecture)
- `FRONTEND_GUIDELINES.md` (UI patterns)
- `BACKEND_GUIDELINES.md` (API contracts)
