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
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
        <CheckCircle2 size={40} className="text-foreground" />
      </div>

      <h1 className="mb-3 text-2xl sm:text-[28px] font-bold text-foreground">
        {t("paymentSuccessful")}
      </h1>
      <p className="mb-6 text-sm sm:text-base text-muted-foreground">
        {t("bookingConfirmed")}
      </p>

      {txRef && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="mb-1 text-xs text-muted-foreground">{t("transactionRef")}</p>
          <p className="break-all font-mono text-xs font-semibold text-foreground">
            {txRef}
          </p>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-border bg-card p-5 text-left shadow-2xs">
        <h2 className="mb-3 text-sm font-bold text-foreground">{t("whatsNext")}</h2>
        <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-foreground" />
            <span>{t("checkEmail")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-foreground" />
            <span>{t("joinVideo")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-foreground" />
            <span>{t("escrowNotice")}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark py-6 text-sm font-semibold text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-sm"
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

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
