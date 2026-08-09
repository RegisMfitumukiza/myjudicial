import { redirect } from "next/navigation";

import { UserRole } from "@/features/auth/types";
import { requireAuth } from "@/server/auth/guards";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only allow same-origin relative paths — never redirect to an external URL. */
function isSafeReturnPath(path: string | undefined): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export default async function PostAuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);
  const { callbackUrl } = await searchParams;

  // A caller (e.g. the booking flow) asked to return to a specific page after
  // sign in, instead of the default role-based landing page. The middleware is
  // unreliable on Turbopack/Windows, so the locale prefix must be added here —
  // unprefixed paths would otherwise 404.
  if (isSafeReturnPath(callbackUrl)) {
    const hasLocalePrefix = new RegExp(`^/(${routing.locales.join("|")})(/|$)`).test(callbackUrl);
    redirect(hasLocalePrefix ? callbackUrl : `/${locale}${callbackUrl}`);
  }

  if (session.user.role === UserRole.ADMIN) {
    redirect(`/${locale}/admin/dashboard`);
  }

  if (session.user.role === UserRole.EXPERT) {
    // Dashboard handles incomplete profiles client-side via ProfileCompletionCard
    redirect(`/${locale}/expert/dashboard`);
  }

  redirect(`/${locale}/experts`);
}

