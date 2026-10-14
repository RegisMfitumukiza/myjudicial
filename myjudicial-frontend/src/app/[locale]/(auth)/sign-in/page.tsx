import { Suspense } from "react";
import { headers } from "next/headers";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default async function SignInPage() {
  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host")?.split(",")[0] ?? headerList.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const adminHost = (process.env.ADMIN_PORTAL_HOST ?? process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com").toLowerCase();
  const isAdminPortal = host === adminHost;

  return (
    <AuthShell>
      <Suspense fallback={<div className="text-sm text-slate-400 dark:text-white/40">Loading...</div>}>
        <SignInForm defaultAdminMode={isAdminPortal} />
      </Suspense>
    </AuthShell>
  );
}