"use client";

import { Suspense } from "react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PublicNav } from "@/shared/components/public-nav";
import { useTranslations } from "next-intl";

function CancelledContent() {
  const txRef = useSearchParams().get("ref");
  const t = useTranslations("public.bookings");

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <XCircle size={40} className="text-amber-600 dark:text-amber-400" />
      </div>

      <h1 className="mb-3 text-[28px] font-bold text-brand-red dark:text-white">
        {t("bookingCancelled")}
      </h1>
      <p className="mb-6 text-[15px] text-brand-dark/70 dark:text-white/70">
        {t("bookingCancelledDesc")}
      </p>

      {txRef && (
        <div className="mb-6 rounded-xl border border-brand-border/20 bg-white p-4 dark:border-white/20 dark:bg-black">
          <p className="mb-1 text-[11px] text-brand-dark/50 dark:text-white/50">{t("reference")}</p>
          <p className="break-all font-mono text-[13px] font-semibold text-brand-dark dark:text-white">
            {txRef}
          </p>
        </div>
      )}

      <div className="mb-8 rounded-xl bg-brand-dark/5 p-5 text-left dark:bg-white/5">
        <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-brand-dark dark:text-white">
          <HelpCircle size={16} />
          What Happened?
        </h2>
        <p className="text-[13px] text-brand-dark/70 dark:text-white/70">
          The payment was cancelled before completion. This could be because you:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-brand-dark/70 dark:text-white/70">
          <li>Clicked &quot;Cancel&quot; on the payment screen</li>
          <li>Closed the payment window</li>
          <li>Experienced a connection timeout</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark py-6 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
        >
          <Link href="/experts">
            <ArrowLeft className="mr-2" size={16} />
            Browse Lawyers Again
          </Link>
        </Button>

        <Link
          href="/client/dashboard/support"
          className="text-[13px] text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
        >
          {t("contactSupport")}
        </Link>
      </div>
    </div>
  );
}

export default function BookingCancelledPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <PublicNav />
      <Suspense fallback={null}>
        <CancelledContent />
      </Suspense>
    </div>
  );
}
