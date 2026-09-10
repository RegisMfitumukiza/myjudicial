"use client";

import { Suspense, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
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
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10">
        <CheckCircle size={40} className="text-brand-dark dark:text-white" />
      </div>

      <h1 className="mb-3 text-[28px] font-bold text-brand-dark dark:text-white">
        {t("paymentSuccessful")}
      </h1>
      <p className="mb-6 text-[15px] text-brand-dark/70 dark:text-white/70">
        {t("bookingConfirmed")}
      </p>

      {txRef && (
        <div className="mb-6 rounded-xl border border-brand-border/20 bg-white p-4 dark:border-white/20 dark:bg-black">
          <p className="mb-1 text-[11px] text-brand-dark/50 dark:text-white/50">{t("transactionRef")}</p>
          <p className="break-all font-mono text-[13px] font-semibold text-brand-dark dark:text-white">
            {txRef}
          </p>
        </div>
      )}

      <div className="mb-8 rounded-xl bg-brand-dark/5 p-5 text-left dark:bg-white/5">
        <h2 className="mb-3 text-[14px] font-bold text-brand-dark dark:text-white">{t("whatsNext")}</h2>
        <ul className="space-y-2 text-[13px] text-brand-dark/70 dark:text-white/70">
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-brand-dark dark:text-white" />
            <span>{t("checkEmail")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-brand-dark dark:text-white" />
            <span>{t("joinVideo")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-brand-dark dark:text-white" />
            <span>{t("escrowNotice")}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full rounded-xl bg-brand-dark py-6 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
        >
          <Link href="/client/dashboard/consultations">
            {t("viewConsultations")}
            <ArrowRight className="ml-2" size={16} />
          </Link>
        </Button>

        <Link
          href="/search"
          className="text-[13px] text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
        >
          {t("bookAnother")}
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-brand-dark/40 dark:text-white/40">
        <Loader2 size={12} className="animate-spin" />
        <span>{t("redirecting", { countdown })}</span>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <PublicNav />
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
