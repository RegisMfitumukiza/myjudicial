import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from "next/server";
import { routing } from './src/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(self), microphone=(self), geolocation=(self), payment=(self)",
  "x-dns-prefetch-control": "off",
};

// Admin portal lives on its own host so an admin session and an expert/citizen
// session can coexist in the same browser (NextAuth cookies are host-scoped).
const ADMIN_HOST = (process.env.ADMIN_PORTAL_HOST ?? "admin.myjudicial.com").toLowerCase();
const MAIN_HOSTS = ["myjudicial.com", "www.myjudicial.com"];
const LOCALES = routing.locales.join("|");
const RE_ROOT_PATH = new RegExp(`^\\/(?:(${LOCALES})\\/?)?$`);
const RE_ADMIN_PATH = new RegExp(`^\\/(?:(?:${LOCALES})\\/)?admin(\\/|$)`);
const RE_AUTH_PAGE = new RegExp(`^\\/(?:(?:${LOCALES})\\/)?(sign-in|sign-up|post-auth)(\\/|$)`);
// Public informational & policy pages valid across both main and admin portals
const RE_PUBLIC_ALLOWED = new RegExp(
  `^\\/(?:(?:${LOCALES})\\/)?(terms|privacy|cookies|help|contact|faqs)(\\/|$)`
);

function requestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0];
  const host = (forwarded ?? request.headers.get("host") ?? "").toLowerCase();
  return host.replace(/:\d+$/, "");
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    // Allow any .myjudicial.com subdomain or exact apex
    if (hostname === "myjudicial.com" || hostname.endsWith(".myjudicial.com")) {
      return true;
    }
    // Allow local development and private LAN IP origins
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.") ||
      hostname.startsWith("10.")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function withSecurityHeaders(
  response: NextResponse,
  requestId: string,
  origin?: string | null
): NextResponse {
  response.headers.set("x-request-id", requestId);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  if (process.env.NODE_ENV === "production") {
    response.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  }

  // Cross-subdomain CORS headers for trusted sibling domains
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("access-control-allow-origin", origin);
    response.headers.set("access-control-allow-credentials", "true");
    response.headers.set(
      "access-control-allow-methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.set(
      "access-control-allow-headers",
      "Content-Type, Authorization, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url, x-request-id"
    );
    response.headers.set("access-control-max-age", "86400");
  }

  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const origin = request.headers.get("origin");

  // Handle preflight OPTIONS requests immediately
  if (request.method === "OPTIONS") {
    return withSecurityHeaders(new NextResponse(null, { status: 204 }), requestId, origin);
  }

  // Skip i18n routing for API routes, NextAuth, internal Next.js paths,
  // and static assets (files with extensions like .png, .ico, .js, etc.).
  // Without this guard the i18n middleware redirects /api/auth/session to
  // /en/api/auth/session (404), and static files like /myjudicial-logo.png
  // to /en/myjudicial-logo.png (also 404).
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return withSecurityHeaders(NextResponse.next(), requestId, origin);
  }

  const host = requestHost(request);
  const isMainHost = MAIN_HOSTS.includes(host);
  const isAdminPortal = host === ADMIN_HOST;

  if (isMainHost || isAdminPortal) {
    const httpsBase = `https://${host}`;
    const themeCookie = request.cookies.get("mj_theme")?.value;

    // Main site: /admin/* and /sign-in?admin=1 belong on the admin portal.
    const isAdminSignIn = pathname.includes("/sign-in") && request.nextUrl.searchParams.get("admin") === "1";
    if (isMainHost && (RE_ADMIN_PATH.test(pathname) || isAdminSignIn)) {
      const redirectUrl = new URL(`https://${ADMIN_HOST}${pathname}${search}`);
      if (themeCookie && ["light", "dark", "system"].includes(themeCookie) && !redirectUrl.searchParams.has("theme")) {
        redirectUrl.searchParams.set("theme", themeCookie);
      }
      return withSecurityHeaders(
        NextResponse.redirect(redirectUrl.toString()),
        requestId,
        origin
      );
    }

    // Admin portal handling
    if (isAdminPortal) {
      // 1. Root paths (/, /en, /fr, /rw): redirect to admin dashboard if authenticated, or admin sign-in
      if (RE_ROOT_PATH.test(pathname)) {
        const matchedLocale = pathname.match(RE_ROOT_PATH)?.[1] || "en";
        const hasSession =
          request.cookies.has("authjs.session-token") ||
          request.cookies.has("__Secure-authjs.session-token") ||
          request.cookies.has("next-auth.session-token") ||
          request.cookies.has("__Secure-next-auth.session-token");
        const target = hasSession ? "/admin/dashboard" : "/sign-in?admin=1";
        return withSecurityHeaders(
          NextResponse.redirect(`${httpsBase}/${matchedLocale}${target}`),
          requestId,
          origin
        );
      }

      // 2. Admin routes, auth routes, and public informational/legal pages (terms, privacy, cookies, help):
      // Keep on the admin portal — served locally without cross-origin redirects!
      const isAllowedOnAdmin =
        RE_ADMIN_PATH.test(pathname) ||
        RE_AUTH_PAGE.test(pathname) ||
        RE_PUBLIC_ALLOWED.test(pathname);

      if (!isAllowedOnAdmin) {
        // If an RSC prefetch request is targeted at a page belonging to the main site,
        // do not send a cross-origin redirect which Next.js RSC client cannot mount.
        const isRsc =
          request.nextUrl.searchParams.has("_rsc") ||
          request.headers.get("rsc") === "1" ||
          request.headers.get("next-router-prefetch") === "1";

        if (isRsc) {
          return withSecurityHeaders(new NextResponse(null, { status: 204 }), requestId, origin);
        }

        const redirectUrl = new URL(`https://www.myjudicial.com${pathname}${search}`);
        if (themeCookie && ["light", "dark", "system"].includes(themeCookie) && !redirectUrl.searchParams.has("theme")) {
          redirectUrl.searchParams.set("theme", themeCookie);
        }
        return withSecurityHeaders(
          NextResponse.redirect(redirectUrl.toString()),
          requestId,
          origin
        );
      }
    }
  }

  const i18nResponse = handleI18nRouting(request);
  return withSecurityHeaders(i18nResponse, requestId, origin);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192x192.png|icon-512x512.png|og-image.png).*)",
    "/(en|fr|rw)/:path*",
  ],
};
