import { AuthShell } from "@/features/auth/components/auth-shell";

export default function AuthLoading() {
  return (
    <AuthShell>
      <div
        className="w-full space-y-6 animate-pulse motion-reduce:animate-none"
        role="status"
        aria-busy="true"
        aria-label="Loading authentication"
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
    </AuthShell>
  );
}
