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
    <div className="mx-auto max-w-md px-3 min-[360px]:px-6 py-10 sm:py-16 text-center">
      <div className="mx-auto mb-5 sm:mb-6 flex h-16 w-16 min-[360px]:h-20 min-[360px]:w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-2xs">
        <AlertCircle size={32} className="min-[360px]:hidden text-destructive" />
        <AlertCircle size={40} className="hidden min-[360px]:block text-destructive" />
      </div>

      <h1 className="mb-2 sm:mb-3 text-xl min-[360px]:text-2xl sm:text-[28px] font-bold text-foreground">
        {t("paymentFailed")}
      </h1>
      <p className="mb-5 sm:mb-6 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground">
        {t("couldNotProcess")}
      </p>

      {txRef && (
        <div className="mb-5 sm:mb-6 rounded-xl border border-border bg-card p-3.5 min-[360px]:p-4 shadow-2xs">
          <p className="mb-1 text-[11px] min-[360px]:text-xs text-muted-foreground">{t("reference")}</p>
          <p className="break-all font-mono text-[11px] min-[360px]:text-xs font-semibold text-foreground">
            {txRef}
          </p>
        </div>
      )}

      <div className="mb-6 sm:mb-8 rounded-2xl border border-border bg-card p-4 min-[360px]:p-5 text-left shadow-2xs">
        <h2 className="mb-2.5 sm:mb-3 text-xs min-[360px]:text-sm font-bold text-foreground">
          {t("commonReasons")}
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span className="break-words">{t("insufficientFunds")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span className="break-words">{t("incorrectPin")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span className="break-words">{t("transactionLimit")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span className="break-words">{t("networkIssue")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            <span className="break-words">{t("mobileMoneyUnavailable")}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark h-12 min-[360px]:py-6 text-xs min-[360px]:text-sm font-semibold text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-sm"
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
