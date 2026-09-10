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
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10">
        <AlertCircle size={40} className="text-brand-dark dark:text-white" />
      </div>

      <h1 className="mb-3 text-[28px] font-bold text-brand-dark dark:text-white">
        {t("paymentFailed")}
      </h1>
      <p className="mb-6 text-[15px] text-brand-dark/70 dark:text-white/70">
        {t("couldNotProcess")}
      </p>

      {txRef && (
        <div className="mb-6 rounded-xl border border-brand-border/20 bg-white p-4 dark:border-white/20 dark:bg-black">
          <p className="mb-1 text-[11px] text-brand-dark/50 dark:text-white/50">{t("reference")}</p>
          <p className="break-all font-mono text-[13px] font-semibold text-brand-dark dark:text-white">
            {txRef}
          </p>
        </div>
      )}

      <div className="mb-8 rounded-xl border border-brand-border/20 bg-white p-5 text-left dark:border-white/10 dark:bg-black">
        <h2 className="mb-3 text-[14px] font-bold text-brand-dark dark:text-white">
          {t("commonReasons")}
        </h2>
        <ul className="space-y-2 text-[13px] text-brand-dark/70 dark:text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-brand-dark/40 dark:text-white/40">•</span>
            <span>{t("insufficientFunds")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-dark/40 dark:text-white/40">•</span>
            <span>{t("incorrectPin")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-dark/40 dark:text-white/40">•</span>
            <span>{t("transactionLimit")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-dark/40 dark:text-white/40">•</span>
            <span>{t("networkIssue")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-dark/40 dark:text-white/40">•</span>
            <span>{t("mobileMoneyUnavailable")}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark py-6 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
        >
          <Link href="/client/dashboard/consultations">
            <ArrowRight className="mr-2" size={16} />
            {t("viewConsultations")}
          </Link>
        </Button>

        <Link
          href="/search"
          className="text-[13px] text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
        >
          {t("browseMoreLawyers")}
        </Link>
      </div>

      <div className="mt-6 rounded-xl bg-brand-dark/5 p-4 text-left dark:bg-white/5">
        <p className="text-[11px] text-brand-dark/60 dark:text-white/60">
          <strong>{t("tip")}:</strong> {t("tipDesc")}
        </p>
      </div>
    </div>
  );
}

export default function BookingFailedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <PublicNav />
      <Suspense fallback={null}>
        <FailedContent />
      </Suspense>
    </div>
  );
}
