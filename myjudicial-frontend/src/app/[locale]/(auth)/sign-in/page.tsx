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

function SignInFormSkeleton() {
  return (
    <div
      className="w-full space-y-6 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-label="Loading authentication form"
    >
      <div className="space-y-2">
        <div className="h-7 w-44 rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-64 rounded bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-white/10 mt-6" />
      </div>
    </div>
  );
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

  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host")?.split(",")[0] ?? headerList.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const adminHost = (process.env.ADMIN_PORTAL_HOST ?? process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com").toLowerCase().replace(/^https?:\/\//, "");
  const isAdminPortal = host === adminHost || host.startsWith("admin.") || admin === "1";

  // If already authenticated with a valid session, redirect immediately!
  const session = await auth();
  if (session?.user?.id && !(session as any)?.error) {
    if (isSafeReturnPath(callbackUrl)) {
      const hasLocalePrefix = new RegExp(`^/(${routing.locales.join("|")})(/|$)`).test(callbackUrl);
      redirect(hasLocalePrefix ? callbackUrl : `/${locale}${callbackUrl}`);
    }

    const rawRole = (session.user as any)?.role;
    const normRole = rawRole ? String(rawRole).trim().toUpperCase() : undefined;

    if (isAdminPortal) {
      if (normRole === "ADMIN" || !normRole) {
        redirect(`/${locale}/admin/dashboard`);
      } else {
        redirect(`https://www.myjudicial.com/${locale}/${normRole === "EXPERT" ? "expert" : "client"}/dashboard`);
      }
    } else {
      if (normRole === "ADMIN") {
        redirect(`https://${adminHost}/${locale}/admin/dashboard`);
      } else if (normRole === "EXPERT") {
        redirect(`/${locale}/expert/dashboard`);
      } else {
        redirect(`/${locale}/client/dashboard`);
      }
    }
  }

  return (
    <AuthShell>
      <Suspense fallback={<SignInFormSkeleton />}>
        <SignInForm defaultAdminMode={isAdminPortal} />
      </Suspense>
    </AuthShell>
  );
}