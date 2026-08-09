import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="text-sm text-slate-400 dark:text-white/40">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}