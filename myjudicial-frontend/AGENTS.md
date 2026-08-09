# MyJudicial Frontend — Anchored Summary

## Goal
Maintain a polished MyJudicial frontend with a restricted dark navy blue / black / white color palette, clean dashboard card styling, and enterprise-grade navigation architecture.

## Constraints & Preferences
- Only three colors allowed: dark navy blue (`#0b2545`), black (`#000000`), white (`#ffffff`) — no grays, reds, greens, or other hues
- Language preference persisted to `localStorage` under key `mj_lang`
- Dark mode must be visually consistent across all pages using only the three-color palette
- `/experts` is the canonical listing page — all "browse lawyers" links point here
- AI triage accessible via floating chat button only (no nav link)
- No emoji characters anywhere in source files

## Navigation Architecture

### Sidebar (`src/shared/layouts/app-sidebar.tsx`)
Single shared sidebar for ADMIN and EXPERT roles, role-driven via `ROLE_NAVIGATION` map.

**Header:** Logo + collapse toggle (same position in both expanded/collapsed modes).

**Navigation:**
- Grouped sections with uppercase labels (expanded) / hidden (collapsed)
- Active page: filled background + 2px left indicator bar
- Collapsed mode: tooltips on hover, group dividers between sections

**Footer (consistent between modes):**
- Avatar button → profile dropdown
- Theme toggle (always visible, same position)
- Collapse/expand button
- Collapsed: three elements stacked vertically
- Expanded: avatar+name on left, theme+collapse on right

**Profile dropdown** (click avatar):
- User info header (initials, name, email)
- Profile → `/{role}/dashboard/profile`
- Account → `/{role}/dashboard/profile#account`
- Preferences → `/{role}/dashboard/profile#preferences`
- Sign Out (red, with divider)
- NEVER contains "Settings" (Settings is a sidebar nav item for platform config)

**No duplicate navigation:**
- `Settings` is ONLY in sidebar nav (System group) for platform configuration
- Profile dropdown has Profile/Account/Preferences (user account management)
- Collapsed footer has only avatar dropdown, not separate Settings/Logout icons

### Profile Page (`/admin/dashboard/profile/page.tsx`)
Three-tab page: Profile, Account, Preferences. Hash-fragment navigable (`#account`, `#preferences`).

**Profile tab:** name (editable), email (read-only), phone, role badge, profile photo upload (Camera button + file picker), login history placeholder.
**Account tab:** change password form, 2FA placeholder (user-requested skip), real session management with listing/revoke, activity log placeholder.
**Preferences tab:** theme toggle, language selector (uses `usePatchAuthMe`), real notification preference toggles (email, SMS, in-app) with save.

### Consumer (`src/shared/layouts/consumer-header.tsx`)
Top-nav layout for CITIZEN role. Logo, nav links, notification bell, theme toggle, profile dropdown (Profile, Settings, Sign Out).

### Public (`src/shared/components/profile-menu.tsx`)
Auth-aware dropdown for public pages. Shows Dashboard/Settings/Sign Out when authed, Log In/Get Started when not.

### Removed
- `change-password/page.tsx` — functionality merged into profile page Account tab

## Progress
### Done
- All Orval API refactoring (see previous sessions)
- Admin dashboard data extraction fixes (all 16 pages audited)
- Admin page production-quality implementations (finance, settings, change-password, notifications, documents)
- Sidebar redesign, admin profile page, photo upload, session management, notification preferences
- endpoints.ts cleanup, Orval regeneration

### Recent: Landing page routing fix
- **Root cause**: `src/app/[locale]/page.tsx` conflicted with `src/app/[locale]/(public)/page.tsx` — both mapped to `/[locale]`. The non-grouped one won, bypassing `(public)/layout.tsx` which renders `<Header />`, `<LandingFooter />`, and `<FloatingAiChat />`.
- **Fix**: Deleted `[locale]/page.tsx`; corrected import in `(public)/page.tsx` from `./(public)/landing-client` to `./landing-client`.
- **Result**: Landing page now renders inside `(public)/layout.tsx` with full Header/Footer/Chat. Search near-me button (`/en/search?sort=NEAREST&lat=...`) route resolved — `useRouter` from `@/i18n/routing` generates locale-prefixed URLs with `localePrefix: 'always'`.

### Recent: Search route 404 fix (localePrefix + middleware)
- **Root cause**: Next.js 16 + Turbopack on Windows does not execute middleware despite registering it in the manifest. With `localePrefix: 'as-needed'`, unprefixed routes like `/search` relied on middleware to rewrite to `/en/search`. Since middleware never ran, all unprefixed routes returned 404.
- **Fix**: Changed `localePrefix` from `'as-needed'` to `'always'` in `src/i18n/routing.ts`. All URLs now include locale prefix (`/en/search`). `useRouter` from `@/i18n/routing` automatically generates prefixed URLs. Also switched `src/features/ai/components/ai-workspace.tsx` from `next/navigation` to `@/i18n/routing` to ensure locale-prefixed navigation.
- **Result**: Landing page "near me" button navigates to `/en/search?sort=NEAREST&lat=...&lng=...` (200 OK). All locale-prefixed routes (`/en/search`, `/fr/search`, `/rw/search`) work correctly.

### Recent: Search page dark mode + margin fix
- **Map DOM elements (markers, tooltips, badges, radius circle)** — replaced `var(--color-brand-dark)` with hardcoded `rgb(11,37,69)` since map is always light-themed (CSS `var()` resolves to near-white in dark mode on canvas)
- **MapLibre GL paint layers** — `circle-color` changed from `"var(--color-brand-dark)"` to `"rgb(11,37,69)"` (canvas doesn't support CSS variables)
- **Popup** — always light-themed: hardcoded `background: white`, navy text, slate-500 muted, slate-200 borders; close button hover slots to navy
- **Buttons with `bg-brand-dark text-white dark:bg-white dark:text-brand-dark`** across 5 files → `bg-brand-dark text-on-brand` (semantic class handles contrast automatically)
- **Category pills dark mode** — removed `dark:border-white dark:bg-white dark:text-brand-dark`, using `text-on-brand`
- **Search page width** — non-map view changed from `max-w-5xl` (1024px) to `max-w-[1400px]` to match landing page; ResultsList padding `px-4 sm:px-6 py-4 sm:py-6`
- **Popup `var(--muted-foreground)` and `var(--color-brand-border)`** → hardcoded `#64748b` and `#e2e8f0` (always light popup)
- **`expert-map.tsx`** — pins and popup use hardcoded light-mode colors

## Key Decisions
- Map canvas (OSM tiles) is always light — map DOM elements (markers, tooltips, popups) must use hardcoded colors, not CSS variables
- `text-on-brand` is the preferred utility for buttons on brand-dark backgrounds (handles dark mode contrast automatically)
- Popups are always light-themed (white bg, navy text) since they float on a light map canvas
- View Profile button in popup uses hardcoded `rgb(11,37,69)` bg with white text
- Get Directions button in popup uses hardcoded `rgb(11,37,69)` text/border with transparent bg
- Popup close button hover: `#0b2545` (navy)
- All other conventions remain unchanged from previous sessions
- Landing page MUST live inside `(public)` route group to get the `<Header />` layout — never at `[locale]/page.tsx` directly

## Next Steps
1. User will provide SVG logo asset to replace lucide `Scale` icon in `logo.tsx`
2. Add real API endpoints for 2FA setup (backend team)
3. Regenerate Orval client when backend OpenAPI spec adds new endpoints
4. Start backend server on port 4000 (required for frontend API calls — "Failed to fetch" console error)
5. Monitor Next.js/Turbopack for middleware execution fix on Windows — when fixed, can optionally revert to `localePrefix: 'as-needed'` for cleaner URLs (but `always` works fine)

## Critical Context
- `AppSidebar` at `src/shared/layouts/app-sidebar.tsx` — shared by admin and expert, driven by `ROLE_NAVIGATION[user.role]`
- `DashboardLayout` at `src/shared/layouts/dashboard-layout.tsx` — dispatches to sidebar (admin/expert) vs consumer-header (citizen)
- `ProfileMenu` at `src/shared/components/profile-menu.tsx` — PUBLIC-FACING only (used on /experts, public pages)
- Admin profile page at `src/app/(portal)/admin/dashboard/profile/page.tsx`
- Expert profile page at `src/app/(portal)/expert/dashboard/profile/page.tsx`
- Theme toggle is the same `ThemeToggle` component used everywhere — positioned in sidebar footer for dashboard, header for consumer
- `usePatchAuthMe` Orval hook available for language preference updates
- `customFetch` used for password change, profile save, photo upload, session management, notification prefs
- `refreshUser()` from `useAuth()` called after photo upload so sidebar avatar updates automatically
- Frontend API URL: `http://localhost:4000` with prefix `/api/v1`
- i18n routing: `localePrefix: 'always'` — all URLs include locale prefix (e.g., `/en/search`)
- Root `/` redirects to `/en` via `src/app/page.tsx`
- **Known issue**: Next.js 16 + Turbopack on Windows: middleware registered in manifest but not executing at edge runtime. All `useRouter` calls that navigate to locale-prefixed routes must use `@/i18n/routing` (not `next/navigation`) to ensure locale prefix is included.

## Relevant Files
- `src/app/[locale]/(public)/page.tsx`: Landing page (must be inside `(public)` for layout wrapper)
- `src/app/[locale]/(public)/layout.tsx`: Public layout with `<Header />`, `<LandingFooter />`, `<FloatingAiChat />`
- `src/app/[locale]/(public)/landing-client.tsx`: Landing page client component
- `src/app/[locale]/search/page.tsx`: Search page (destination of "near me" button)
- `src/middleware.ts`: next-intl middleware for locale routing (not executing on Turbopack/Windows — see Known issue above)
- `src/shared/layouts/app-sidebar.tsx`: Complete sidebar with role-driven nav, profile dropdown, theme toggle, collapse, avatar photo display
- `src/shared/layouts/dashboard-layout.tsx`: Layout dispatcher (sidebar vs top-nav)
- `src/shared/layouts/consumer-header.tsx`: Citizen top-nav
- `src/app/(portal)/admin/dashboard/profile/page.tsx`: Admin profile page (3 tabs)
- `src/app/(portal)/expert/dashboard/profile/page.tsx`: Expert professional profile editor
- `src/shared/components/profile-menu.tsx`: Public-facing auth dropdown
- `src/shared/components/theme-toggle.tsx`: Single shared theme toggle
- `src/shared/components/photo-upload.tsx`: Reusable photo upload components
- `src/features/search/components/map-view.tsx`: Map markers, tooltips, popups, radius circle — hardcoded navy for all map DOM elements + canvas paint properties
- `src/features/search/components/expert-map.tsx`: Expert detail map — hardcoded colors for pins and popup
- `src/features/search/components/search-page-client.tsx`: Main search layout — `max-w-[1400px]` for non-map view, `text-on-brand` buttons
- `src/features/search/components/no-results-panel.tsx`: Expand radius button
- `src/features/search/components/search-top-bar.tsx`: Search submit, filter badge
- `src/features/search/components/lawyer-card.tsx`: Book button
- `src/features/search/components/filters-sheet.tsx`: Active state proximity/sort/filter buttons
- `src/features/search/components/category-pills.tsx`: Active specialty pills
- `src/features/search/components/results-list.tsx`: Padding `px-4 sm:px-6 py-4 sm:py-6`
- `src/app/globals.css`: Popup CSS — hardcoded white bg, navy close button hover, removed dark mode overrides
- `src/lib/api/client.ts`: API fetch client with `resolveApiPath` (localhost:4000 + /api/v1)
- `src/i18n/routing.ts`: Locale routing config (en/fr/rw, localePrefix: always)
