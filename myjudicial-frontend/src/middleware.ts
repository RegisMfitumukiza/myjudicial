import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip i18n routing for static assets and internal Next.js paths.
  // The auto-generated next-intl middleware redirects these to /en/...
  // which causes 404s in standalone mode since public/ files are only
  // served at the root path.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // any file extension (.ico, .png, .js, etc.)
  ) {
    return;
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all paths except api, _next, and files with extensions
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
