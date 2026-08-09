"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { useExpertProfile } from "@/features/experts/hooks/useExpertProfile";
import { useGetExpertsCompliance } from "@/api/generated";
import { ExpertStatus } from "@/api/generated";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Camera,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

type OnboardingData = {
  photoStatus: {
    hasPhoto: boolean;
  };
};

export default function SetupPage() {
  const t = useTranslations("expertDashboard_setup");
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  const { data: profile, isLoading: profileLoading } = useExpertProfile();
  const { data: complianceRes, isLoading: complianceLoading } = useGetExpertsCompliance();
  const { data: onboardingRes, isLoading: onboardingLoading } = useQuery({
    queryKey: ["experts", "onboarding"],
    queryFn: async () => {
      return await apiFetch<{ data: OnboardingData }>("/experts/onboarding", { method: "GET" });
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });

  const compliance = complianceRes?.status === 200 ? complianceRes.data.data : null;
  const verificationStatus = compliance?.status ?? null;
  const photoStatus = onboardingRes?.data.photoStatus ?? null;
  const hasPhoto = photoStatus?.hasPhoto ?? false;
  const isVerified = verificationStatus === ExpertStatus.VERIFIED;

  const items = [
    {
      key: "profile",
      icon: User,
      label: t("profileLabel"),
      description: t("profileDesc"),
      href: profile ? "/expert/dashboard/profile" : "/expert/onboarding",
      status: profile ? "done" as const : "pending" as const,
    },
    {
      key: "photo",
      icon: Camera,
      label: t("photoLabel"),
      description: t("photoDesc"),
      href: "/expert/profile/edit#photo",
      status: hasPhoto ? "done" as const : "pending" as const,
    },
    {
      key: "verification",
      icon: ShieldCheck,
      label: t("verificationLabel"),
      description: t("verificationDesc"),
      href: "/expert/dashboard/verification",
      status: isVerified ? "done" as const : verificationStatus === ExpertStatus.REJECTED ? "rejected" as const : verificationStatus === ExpertStatus.PENDING_VERIFICATION ? "pending-review" as const : "pending" as const,
    },
  ];

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalCount = items.length;

  const isLoading = profileLoading || complianceLoading || onboardingLoading;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-dark dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("progress", { done: doneCount, total: totalCount })}{doneCount === totalCount ? t("allSet") : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isItemDone = item.status === "done";
            const isRejected = item.status === "rejected";
            const isUnderReview = item.status === "pending-review";

            return (
              <Link key={item.key} href={item.href}>
                <div
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    isItemDone
                      ? "border-green-200 dark:border-green-800"
                      : isRejected
                        ? "border-red-200 dark:border-red-800"
                        : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isItemDone
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : isRejected
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">{item.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isItemDone && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">{t("complete")}</span>
                    )}
                    {isUnderReview && (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t("underReview")}</span>
                    )}
                    {isRejected && (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">{t("actionRequired")}</span>
                    )}
                    {!isItemDone && !isUnderReview && !isRejected && (
                      <ArrowRight size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
