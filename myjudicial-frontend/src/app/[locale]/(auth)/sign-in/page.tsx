import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/authjs";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { routing } from "@/i18n/routing";

function isSafeReturnPath(path: string | undefined): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; admin?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl, admin } = await searchParams;

  // If already authenticated with a valid session, redirect immediately!
  const session = await auth();
  if (session?.user?.id && !(session as any)?.error) {
    if (isSafeReturnPath(callbackUrl)) {
      const hasLocalePrefix = new RegExp(`^/(${routing.locales.join("|")})(/|$)`).test(callbackUrl);
      redirect(hasLocalePrefix ? callbackUrl : `/${locale}${callbackUrl}`);
    }

    const role = (session.user as any)?.role;
    if (role === "ADMIN") {
      redirect(`/${locale}/admin/dashboard`);
    } else if (role === "EXPERT") {
      redirect(`/${locale}/expert/dashboard`);
    } else {
      redirect(`/${locale}/client/dashboard`);
    }
  }

  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host")?.split(",")[0] ?? headerList.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const adminHost = (process.env.ADMIN_PORTAL_HOST ?? process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com").toLowerCase();
  const isAdminPortal = host === adminHost || admin === "1";

  return (
    <AuthShell>
      <Suspense fallback={<div className="text-sm text-slate-400 dark:text-white/40">Loading...</div>}>
        <SignInForm defaultAdminMode={isAdminPortal} />
      </Suspense>
    </AuthShell>
  );
}