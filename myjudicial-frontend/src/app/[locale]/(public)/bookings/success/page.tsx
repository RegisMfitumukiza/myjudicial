"use client";

import { Suspense, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PublicNav } from "@/shared/components/public-nav";
import { useTranslations } from "next-intl";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const txRef = searchParams.get("ref");
  const t = useTranslations("public.bookings");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/client/dashboard/consultations");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="mx-auto max-w-md px-3 min-[360px]:px-6 py-10 sm:py-16 text-center">
      <div className="mx-auto mb-5 sm:mb-6 flex h-16 w-16 min-[360px]:h-20 min-[360px]:w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
        <CheckCircle2 size={32} className="min-[360px]:hidden text-emerald-600 dark:text-emerald-400" />
        <CheckCircle2 size={40} className="hidden min-[360px]:block text-emerald-600 dark:text-emerald-400" />
      </div>

      <h1 className="mb-2 sm:mb-3 text-xl min-[360px]:text-2xl sm:text-[28px] font-bold text-foreground">
        {t("paymentSuccessful")}
      </h1>
      <p className="mb-5 sm:mb-6 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground">
        {t("bookingConfirmed")}
      </p>

      {txRef && (
        <div className="mb-5 sm:mb-6 rounded-xl border border-border bg-card p-3.5 min-[360px]:p-4 shadow-2xs">
          <p className="mb-1 text-[11px] min-[360px]:text-xs text-muted-foreground">{t("transactionRef")}</p>
          <p className="break-all font-mono text-[11px] min-[360px]:text-xs font-semibold text-foreground">
            {txRef}
          </p>
        </div>
      )}

      <div className="mb-6 sm:mb-8 rounded-2xl border border-border bg-card p-4 min-[360px]:p-5 text-left shadow-2xs">
        <h2 className="mb-2.5 sm:mb-3 text-xs min-[360px]:text-sm font-bold text-foreground">{t("whatsNext")}</h2>
        <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="break-words">{t("checkEmail")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="break-words">{t("joinVideo")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="break-words">{t("escrowNotice")}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark h-12 min-[360px]:py-6 text-xs min-[360px]:text-sm font-semibold text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-sm"
        >
          <Link href="/client/dashboard/consultations">
            {t("viewConsultations")}
            <ArrowRight className="ml-2" size={16} />
          </Link>
        </Button>

        <Link
          href="/search"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("bookAnother")}
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        <span>{t("redirecting", { countdown })}</span>
      </div>
    </div>
  );
}

function SuccessSkeleton() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center animate-pulse motion-reduce:animate-none" role="status" aria-busy="true">
      <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-muted" />
      <div className="mx-auto h-7 w-48 rounded-lg bg-muted mb-3" />
      <div className="mx-auto h-4 w-72 rounded bg-muted mb-6" />
      <div className="h-28 rounded-2xl border border-border bg-card p-5 mb-8" />
      <div className="h-11 rounded-xl bg-muted" />
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <Suspense fallback={<SuccessSkeleton />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
