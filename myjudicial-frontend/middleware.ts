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
const RE_ADMIN_PATH = new RegExp(`^\\/(?:(?:${LOCALES})\\/)?admin(\\/|$)`);
const RE_AUTH_PAGE = new RegExp(`^\\/(?:(?:${LOCALES})\\/)?(sign-in|sign-up|post-auth)(\\/|$)`);

function requestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0];
  const host = (forwarded ?? request.headers.get("host") ?? "").toLowerCase();
  return host.replace(/:\d+$/, "");
}

function withSecurityHeaders(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("x-request-id", requestId);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  if (process.env.NODE_ENV === "production") {
    response.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

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
    return withSecurityHeaders(NextResponse.next(), requestId);
  }

  const host = requestHost(request);
  const isMainHost = MAIN_HOSTS.includes(host);
  const isAdminPortal = host === ADMIN_HOST;

  if (isMainHost || isAdminPortal) {
    const httpsBase = `https://${host}`;

    // Main site: /admin/* and /sign-in?admin=1 belong on the admin portal.
    const isAdminSignIn = pathname.includes("/sign-in") && request.nextUrl.searchParams.get("admin") === "1";
    if (isMainHost && (RE_ADMIN_PATH.test(pathname) || isAdminSignIn)) {
      return withSecurityHeaders(
        NextResponse.redirect(`https://${ADMIN_HOST}${pathname}${search}`),
        requestId
      );
    }

    // Admin portal: root goes to the dashboard; non-admin pages go back to
    // the main site. Auth pages (/sign-in, /post-auth) stay for admin login.
    if (isAdminPortal) {
      if (pathname === "/" || pathname === "") {
        return withSecurityHeaders(
          NextResponse.redirect(`${httpsBase}/en/admin/dashboard`),
          requestId
        );
      }
      if (!RE_ADMIN_PATH.test(pathname) && !RE_AUTH_PAGE.test(pathname)) {
        return withSecurityHeaders(
          NextResponse.redirect(`https://www.myjudicial.com${pathname}${search}`),
          requestId
        );
      }
    }
  }

  const i18nResponse = handleI18nRouting(request);
  return withSecurityHeaders(i18nResponse, requestId);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192x192.png|icon-512x512.png|og-image.png).*)",
    "/(en|fr|rw)/:path*",
  ],
};
