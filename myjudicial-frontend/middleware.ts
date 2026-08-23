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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
    const response = NextResponse.next();
    response.headers.set("x-request-id", request.headers.get("x-request-id") ?? crypto.randomUUID());
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const i18nResponse = handleI18nRouting(request);

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  i18nResponse.headers.set("x-request-id", requestId);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    i18nResponse.headers.set(key, value);
  }

  if (process.env.NODE_ENV === "production") {
    i18nResponse.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  }

  return i18nResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192x192.png|icon-512x512.png|og-image.png).*)",
    "/(en|fr|rw)/:path*",
  ],
};
