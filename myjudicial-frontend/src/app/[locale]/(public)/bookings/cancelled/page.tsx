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
  const tBooking = useTranslations("booking.cancelled");

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
        <XCircle size={40} className="text-foreground" />
      </div>

      <h1 className="mb-3 text-2xl sm:text-[28px] font-bold text-foreground">
        {t("bookingCancelled")}
      </h1>
      <p className="mb-6 text-sm sm:text-base text-muted-foreground">
        {t("bookingCancelledDesc")}
      </p>

      {txRef && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="mb-1 text-xs text-muted-foreground">{t("reference")}</p>
          <p className="break-all font-mono text-xs font-semibold text-foreground">
            {txRef}
          </p>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-border bg-card p-5 text-left shadow-2xs">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <HelpCircle size={16} />
          {tBooking("whatHappened")}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {tBooking("reasonPaymentAbandoned")}
        </p>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          {tBooking("noChargesMade")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark py-6 text-sm font-semibold text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-sm"
        >
          <Link href="/search">
            <ArrowLeft className="mr-2" size={16} />
            {tBooking("browseLawyers")}
          </Link>
        </Button>

        <Link
          href="/client/dashboard/support"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("contactSupport")}
        </Link>
      </div>
    </div>
  );
}

export default function BookingCancelledPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <Suspense fallback={null}>
        <CancelledContent />
      </Suspense>
    </div>
  );
}
