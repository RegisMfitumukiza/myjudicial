"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { useExpertProfile } from "@/features/experts/hooks/useExpertProfile";
import { useGetExpertsCompliance } from "@/api/generated";
import { ExpertStatus } from "@/api/generated";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { ArrowRight, ShieldCheck, Camera, User, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
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
  completionPercentage: number;
};

type ItemStatus = "done" | "pending" | "pending-review" | "rejected" | "in-progress";

const ROW_CLASS: Record<ItemStatus, string> = {
  done: "border-primary/30 bg-primary/5",
  rejected: "border-destructive/30 bg-destructive/5",
  "pending-review": "border-border bg-card",
  pending: "border-border bg-card",
  "in-progress": "border-blue-200 bg-blue-50",
};

const ICON_CHIP_CLASS: Record<ItemStatus, string> = {
  done: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
  "pending-review": "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-100 text-blue-600",
};

const STATUS_TONE: Record<ItemStatus, StatusTone | null> = {
  done: "active",
  rejected: "destructive",
  "pending-review": "pending",
  pending: null,
  "in-progress": "info",
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
  const completionPercentage = onboardingRes?.data.completionPercentage ?? 0;

  // Determine profile status
  const profileStatus: ItemStatus = profile ? "done" : "pending";
  
  // Determine photo status
  const photoItemStatus: ItemStatus = hasPhoto ? "done" : "pending";
  
  // Determine verification status
  let verificationItemStatus: ItemStatus = "pending";
  if (isVerified) {
    verificationItemStatus = "done";
  } else if (verificationStatus === ExpertStatus.REJECTED) {
    verificationItemStatus = "rejected";
  } else if (verificationStatus === ExpertStatus.PENDING_VERIFICATION) {
    verificationItemStatus = "pending-review";
  } else if (profile) {
    verificationItemStatus = "in-progress";
  }

  const items = [
    {
      key: "profile",
      icon: User,
      label: t("profileLabel"),
      description: t("profileDesc"),
      href: profile ? "/expert/dashboard/profile" : "/expert/onboarding",
      status: profileStatus,
      actionLabel: profile ? t("viewProfile") : t("completeProfile"),
    },
    {
      key: "photo",
      icon: Camera,
      label: t("photoLabel"),
      description: t("photoDesc"),
      href: "/expert/profile/edit#photo",
      status: photoItemStatus,
      actionLabel: hasPhoto ? t("viewPhoto") : t("uploadPhoto"),
    },
    {
      key: "verification",
      icon: ShieldCheck,
      label: t("verificationLabel"),
      description: t("verificationDesc"),
      href: "/expert/dashboard/verification",
      status: verificationItemStatus,
      actionLabel: isVerified ? t("viewVerification") : verificationStatus === ExpertStatus.PENDING_VERIFICATION ? t("viewStatus") : t("submitDocs"),
    },
  ];

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalCount = items.length;

  const isLoading = profileLoading || complianceLoading || onboardingLoading;

  // Get status message
  const getStatusMessage = () => {
    if (isVerified) {
      return t("statusVerified");
    }
    if (verificationStatus === ExpertStatus.PENDING_VERIFICATION) {
      return t("statusPendingReview");
    }
    if (verificationStatus === ExpertStatus.REJECTED) {
      return t("statusRejected");
    }
    if (profile && !hasPhoto) {
      return t("statusNeedsPhoto");
    }
    if (!profile) {
      return t("statusNeedsProfile");
    }
    return t("statusInProgress");
  };

  // Get next step recommendation
  const getNextStep = () => {
    if (!profile) {
      return { label: t("nextStepProfile"), href: "/expert/onboarding" };
    }
    if (!hasPhoto) {
      return { label: t("nextStepPhoto"), href: "/expert/profile/edit#photo" };
    }
    if (!isVerified && verificationStatus !== ExpertStatus.PENDING_VERIFICATION) {
      return { label: t("nextStepVerification"), href: "/expert/dashboard/verification" };
    }
    return null;
  };

  const nextStep = getNextStep();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={`${t("progress", { done: doneCount, total: totalCount })}${doneCount === totalCount ? t("allSet") : ""}`}
      />

      {/* Status Summary Card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isVerified ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-600"
          )}>
            {isVerified ? <CheckCircle2 size={24} /> : <Clock size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {isVerified ? t("statusVerifiedTitle") : t("statusInProgressTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("completionProgress")}</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div 
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Next Step Recommendation */}
            {nextStep && (
              <div className="mt-4">
                <Link 
                  href={nextStep.href}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-primary/90"
                >
                  {nextStep.label}
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Setup Checklist */}
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
                  {tone && (
                    <StatusBadge tone={tone}>
                      {tone === "active" 
                        ? t("complete") 
                        : tone === "pending" 
                        ? t("underReview") 
                        : tone === "info"
                        ? t("inProgress")
                        : t("actionRequired")}
                    </StatusBadge>
                  )}
                  {!tone && <ArrowRight size={16} className="text-muted-foreground" />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">{t("needHelp")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("helpDescription")}
        </p>
        <div className="mt-4 flex gap-3">
          <Link 
            href="/expert/dashboard/verification"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80"
          >
            <FileText size={16} />
            {t("viewVerificationGuide")}
          </Link>
        </div>
      </div>
    </div>
  );
}
