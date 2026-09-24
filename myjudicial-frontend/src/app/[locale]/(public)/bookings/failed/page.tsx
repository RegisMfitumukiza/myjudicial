"use client";

import { Suspense } from "react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PublicNav } from "@/shared/components/public-nav";
import { useTranslations } from "next-intl";

function FailedContent() {
  const txRef = useSearchParams().get("ref");
  const t = useTranslations("public.bookings");

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
        <AlertCircle size={40} className="text-foreground" />
      </div>

      <h1 className="mb-3 text-2xl sm:text-[28px] font-bold text-foreground">
        {t("paymentFailed")}
      </h1>
      <p className="mb-6 text-sm sm:text-base text-muted-foreground">
        {t("couldNotProcess")}
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
        <h2 className="mb-3 text-sm font-bold text-foreground">
          {t("commonReasons")}
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{t("insufficientFunds")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{t("incorrectPin")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{t("transactionLimit")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{t("networkIssue")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{t("mobileMoneyUnavailable")}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark py-6 text-sm font-semibold text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-sm"
        >
          <Link href="/client/dashboard/consultations">
            <ArrowRight className="mr-2" size={16} />
            {t("viewConsultations")}
          </Link>
        </Button>

        <Link
          href="/search"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("browseMoreLawyers")}
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-border/80 bg-muted/40 p-4 text-left">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">{t("tip")}:</strong> {t("tipDesc")}
        </p>
      </div>
    </div>
  );
}

export default function BookingFailedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <Suspense fallback={null}>
        <FailedContent />
      </Suspense>
    </div>
  );
}
