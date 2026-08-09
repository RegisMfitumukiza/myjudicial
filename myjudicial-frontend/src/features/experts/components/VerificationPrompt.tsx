"use client";

import { ShieldAlert, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useGetExpertsCompliance } from "@/api/generated";
import { useTranslations } from "next-intl";

type VerificationStatus = "DRAFT" | "PENDING_VERIFICATION" | "REJECTED" | "SUSPENDED" | "VERIFIED";

const STATE_STYLE: Record<Exclude<VerificationStatus, "VERIFIED">, {
  icon: React.ElementType;
  border: string;
  bg: string;
  iconBg: string;
  cta: string;
  href: string;
}> = {
  DRAFT: {
    icon: ShieldAlert,
    border: "border-brand-blue/30",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    iconBg: "bg-brand-blue/10 text-brand-blue",
    cta: "bg-brand-blue text-white hover:bg-brand-blue/90",
    href: "/expert/dashboard/verification",
  },
  PENDING_VERIFICATION: {
    icon: Clock,
    border: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    cta: "bg-amber-600 text-white hover:bg-amber-700",
    href: "/expert/dashboard/verification",
  },
  REJECTED: {
    icon: XCircle,
    border: "border-red-300 dark:border-red-700",
    bg: "bg-red-50 dark:bg-red-950/20",
    iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    cta: "bg-red-600 text-white hover:bg-red-700",
    href: "/expert/dashboard/verification",
  },
  SUSPENDED: {
    icon: XCircle,
    border: "border-red-300 dark:border-red-700",
    bg: "bg-red-50 dark:bg-red-950/20",
    iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    cta: "bg-red-600 text-white hover:bg-red-700",
    href: "/expert/dashboard/verification",
  },
};

export function VerificationPrompt() {
  const t = useTranslations("experts");
  const { data, isLoading } = useGetExpertsCompliance();
  const compliance = data?.status === 200 ? data.data.data : null;
  const status = (compliance?.status ?? "DRAFT") as VerificationStatus;
  const cfg = status === "VERIFIED" ? null : STATE_STYLE[status];

  if (isLoading || !cfg) return null;

  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.iconBg}`}>
          <Icon size={18} />
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">
              {t(`verificationPrompt.${status.toLowerCase()}.title` as any)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t(`verificationPrompt.${status.toLowerCase()}.body` as any)}
            </p>
            {compliance?.statusMessage && compliance.status !== "DRAFT" && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{compliance.statusMessage}</p>
            )}
          </div>
          <Link href={cfg.href}>
            <button className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${cfg.cta}`}>
              {status === "PENDING_VERIFICATION" ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
              {t(`verificationPrompt.${status.toLowerCase()}.action` as any)}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
