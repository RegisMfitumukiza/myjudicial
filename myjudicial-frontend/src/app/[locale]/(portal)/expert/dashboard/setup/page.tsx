"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { useExpertProfile } from "@/features/experts/hooks/useExpertProfile";
import { useGetExpertsCompliance } from "@/api/generated";
import { ExpertStatus } from "@/api/generated";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { ArrowRight, ShieldCheck, Camera, User } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  PageHeader,
  SkeletonList,
  StatusBadge,
  type StatusTone,
} from "@/shared/components/dashboard";
import { cn } from "@/lib/utils";

type OnboardingData = {
  photoStatus: {
    hasPhoto: boolean;
  };
};

type ItemStatus = "done" | "pending" | "pending-review" | "rejected";

const ROW_CLASS: Record<ItemStatus, string> = {
  done: "border-primary/30 bg-primary/5",
  rejected: "border-destructive/30 bg-destructive/5",
  "pending-review": "border-border bg-card",
  pending: "border-border bg-card",
};

const ICON_CHIP_CLASS: Record<ItemStatus, string> = {
  done: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
  "pending-review": "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
};

const STATUS_TONE: Record<ItemStatus, StatusTone | null> = {
  done: "active",
  rejected: "destructive",
  "pending-review": "pending",
  pending: null,
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
      <PageHeader
        title={t("title")}
        description={`${t("progress", { done: doneCount, total: totalCount })}${doneCount === totalCount ? t("allSet") : ""}`}
      />

      {isLoading ? (
        <SkeletonList count={3} itemClassName="h-24" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            const tone = STATUS_TONE[item.status];

            return (
              <Link key={item.key} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50",
                    ROW_CLASS[item.status]
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      ICON_CHIP_CLASS[item.status]
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tone && <StatusBadge tone={tone}>{tone === "active" ? t("complete") : tone === "pending" ? t("underReview") : t("actionRequired")}</StatusBadge>}
                    {!tone && <ArrowRight size={16} className="text-muted-foreground" />}
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
