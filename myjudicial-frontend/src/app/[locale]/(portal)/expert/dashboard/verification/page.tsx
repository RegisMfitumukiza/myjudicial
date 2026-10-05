"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  Upload,
  ShieldAlert,
  Loader2,
  XCircle,
  FileText,
  X,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import {
  useGetExpertsCompliance,
  getGetExpertsComplianceQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { getErrorMessage, cn } from "@/lib/utils";
import { PageHeader, StatusBadge, SkeletonCard, type StatusTone } from "@/shared/components/dashboard";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

// ── Types ──────────────────────────────────────────────────────────────────

interface AttachedFile {
  file: File;
  preview: string | null;
  label: "identity" | "certificate" | "other";
}

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<
  string,
  {
    tone: StatusTone;
    icon: React.ElementType;
    titleKey: string;
    descriptionKey: string;
  }
> = {
  VERIFIED: {
    tone: "active",
    icon: BadgeCheck,
    titleKey: "statusVerifiedTitle",
    descriptionKey: "statusVerifiedDesc",
  },
  PENDING_VERIFICATION: {
    tone: "pending",
    icon: Clock,
    titleKey: "statusPendingTitle",
    descriptionKey: "statusPendingDesc",
  },
  REJECTED: {
    tone: "destructive",
    icon: XCircle,
    titleKey: "statusRejectedTitle",
    descriptionKey: "statusRejectedDesc",
  },
  DRAFT: {
    tone: "neutral",
    icon: ShieldAlert,
    titleKey: "statusDraftTitle",
    descriptionKey: "statusDraftDesc",
  },
  SUSPENDED: {
    tone: "destructive",
    icon: XCircle,
    titleKey: "statusSuspendedTitle",
    descriptionKey: "statusSuspendedDesc",
  },
};

const BANNER_CLASS: Record<StatusTone, string> = {
  active: "border-primary/30 bg-primary/5",
  success: "border-primary/30 bg-primary/5",
  info: "border-primary/30 bg-primary/5",
  pending: "border-warning/30 bg-warning/5",
  warning: "border-warning/30 bg-warning/5",
  destructive: "border-destructive/30 bg-destructive/5",
  neutral: "border-border bg-card",
};

const CHIP_CLASS: Record<StatusTone, string> = {
  active: "bg-primary/10 text-primary",
  success: "bg-primary/10 text-primary",
  info: "bg-primary/10 text-primary",
  pending: "bg-warning/10 text-warning",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

const BADGE_TONE: Record<string, StatusTone> = {
  active: "active",
  success: "success",
  info: "info",
  pending: "pending",
  warning: "warning",
  destructive: "destructive",
  neutral: "neutral",
};

// ── Verification Timeline ──────────────────────────────────────────────────

function VerificationTimeline({ status }: { status: string }) {
  const t = useTranslations("expertDashboard_verification");
  const steps = [
    {
      label: t("stepCreatedLabel"),
      description: t("stepCreatedDesc"),
      done: true,
      active: false,
    },
    {
      label: t("stepUploadedLabel"),
      description: t("stepUploadedDesc"),
      done: ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"].includes(status),
      active: status === "DRAFT",
    },
    {
      label: t("stepReviewLabel"),
      description: t("stepReviewDesc"),
      done: ["VERIFIED", "REJECTED"].includes(status),
      active: status === "PENDING_VERIFICATION",
    },
    {
      label: t("stepActiveLabel"),
      description: t("stepActiveDesc"),
      done: status === "VERIFIED",
      active: false,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {t("timelineProgress")}
      </h3>
      <div className="relative">
        <div className="absolute left-3.5 top-0 h-full w-px bg-border" />
        <div className="space-y-5">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4 pl-2">
              <div
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                  step.done
                    ? "bg-primary/10 text-primary"
                    : step.active
                      ? "border border-primary bg-primary/5 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step.done ? (
                  <CheckCircle size={14} />
                ) : step.active ? (
                  <Clock size={12} />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-none",
                    step.done
                      ? "text-primary"
                      : step.active
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── File Dropzone ──────────────────────────────────────────────────────────

function FileDropZone({
  label,
  accept,
  attached,
  onAttach,
  onRemove,
}: {
  label: string;
  accept: string;
  attached: AttachedFile | null;
  onAttach: (file: File) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("expertDashboard_verification");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onAttach(file);
    },
    [onAttach]
  );

  const isImage = attached?.file.type.startsWith("image/");
  const isPDF = attached?.file.type === "application/pdf";

  return (
    <div className="space-y-2">
      <Label className="text-xs">
        {label} <span className="text-destructive">*</span>
      </Label>

      {attached ? (
        <div className="relative flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
            {isImage && attached.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attached.preview}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FileText size={24} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {attached.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(attached.file.size / 1024).toFixed(1)} KB &bull;{" "}
              {attached.file.type.split("/")[1]?.toUpperCase() ?? t("fileLabel")}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <CheckCircle size={9} /> {t("readyToSubmit")}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="shrink-0 text-destructive hover:text-destructive"
          >
            <X size={12} />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-primary/5",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/40"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload size={18} />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">
              {t("clickToUpload")}
            </span>{" "}
            {t("orDragDrop")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("fileSizeLimit")}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onAttach(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function VerificationPage() {
  const t = useTranslations("expertDashboard_verification");
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetExpertsCompliance();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [identityFile, setIdentityFile] = useState<AttachedFile | null>(null);
  const [certificateFile, setCertificateFile] = useState<AttachedFile | null>(
    null
  );
  const [barNumber, setBarNumber] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");

  // The generated hook returns AxiosResponse<{ success: boolean; data: ComplianceStatus }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compliance = (data as any)?.data?.data as import("@/api/generated").ComplianceStatus | null;
  const status: string = compliance?.status ?? "DRAFT";
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  const StatusIcon = style.icon;
  const canSubmit =
    status !== "VERIFIED" && status !== "PENDING_VERIFICATION";

  function createAttachedFile(
    file: File,
    label: AttachedFile["label"]
  ): AttachedFile {
    const isImg = file.type.startsWith("image/");
    return {
      file,
      preview: isImg ? URL.createObjectURL(file) : null,
      label,
    };
  }

  async function handleSubmit() {
    if (!identityFile && !certificateFile) {
      toast.error(
        t("validationAttachDocs")
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const docTypes: string[] = [];

      if (identityFile) {
        formData.append("files", identityFile.file);
        docTypes.push("identity_document");
      }
      if (certificateFile) {
        formData.append("files", certificateFile.file);
        docTypes.push("bar_certificate");
      }
      docTypes.forEach((dt) => formData.append("documentTypes[]", dt));

      if (barNumber) formData.append("barNumber", barNumber);
      if (certificateName) formData.append("certificateName", certificateName);
      if (issuer) formData.append("issuer", issuer);
      if (issueDate) formData.append("issueDate", issueDate);

      await apiFetch("/experts/verification/submit", {
        method: "POST",
        body: formData,
      });

      toast.success(t("toastSubmitted"));
      setIdentityFile(null);
      setCertificateFile(null);
      setBarNumber("");
      setCertificateName("");
      setIssuer("");
      setIssueDate("");
      queryClient.invalidateQueries({
        queryKey: getGetExpertsComplianceQueryKey(),
      });
    } catch (error) {
      toast.error(getErrorMessage(error, t("toastSubmitFailed")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("titleVerification")}
        description={t("subtitleVerification")}
        className="mb-6"
      />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
        {/* ── Main Column ── */}
        <div className="space-y-5">
          {/* Status Banner */}
          {isLoading ? (
            <SkeletonCard className="h-28" />
          ) : (
            <div
              className={cn(
                "flex items-start gap-4 rounded-xl border p-5 shadow-sm",
                BANNER_CLASS[style.tone]
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  CHIP_CLASS[style.tone]
                )}
              >
                <StatusIcon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-foreground">
                    {t(style.titleKey)}
                  </p>
                  <StatusBadge tone={BADGE_TONE[style.tone]}>
                    {t(`statusBadge.${status.toLowerCase()}` as any)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(style.descriptionKey)}
                </p>

                {/* Rejection reason */}
                {status === "REJECTED" &&
                  compliance?.lastVerification?.rejectionReason && (
                  <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                      <p className="flex items-center gap-1 font-semibold text-destructive">
                        {t("rejectionReasonLabel")}
                      </p>
                      <p className="mt-1 italic text-muted-foreground">
                        &ldquo;{compliance.lastVerification.rejectionReason}&rdquo;
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {t("rejectionReasonInstruction")}
                      </p>
                    </div>
                  )}

                {/* Expiry warning */}
                {compliance?.daysUntilExpiry != null && (
                  <Alert variant="warning" className="mt-3">
                    <AlertDescription className="text-xs font-medium">
                      {compliance.daysUntilExpiry === 1 ? t("credentialsExpireInOne", { days: compliance.daysUntilExpiry }) : t("credentialsExpireInOther", { days: compliance.daysUntilExpiry })}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Document Upload Form */}
          {!isLoading && canSubmit && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Upload size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {status === "REJECTED"
                    ? t("resubmitDocsTitle")
                    : t("submitDocsTitle")}
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FileDropZone
                  label={t("labelId")}
                  accept="image/jpeg,image/png,image/webp"
                  attached={identityFile}
                  onAttach={(f) =>
                    setIdentityFile(createAttachedFile(f, "identity"))
                  }
                  onRemove={() => setIdentityFile(null)}
                />
                <FileDropZone
                  label={t("labelBarCert")}
                  accept="image/*,.pdf"
                  attached={certificateFile}
                  onAttach={(f) =>
                    setCertificateFile(createAttachedFile(f, "certificate"))
                  }
                  onRemove={() => setCertificateFile(null)}
                />
              </div>

              {/* Optional metadata */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="barNumber" className="text-xs">
                    {t("labelBarNumber")}
                  </Label>
                  <Input
                    id="barNumber"
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder={t("placeholderBarNumber")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="certificateName" className="text-xs">
                    {t("labelCertName")}
                  </Label>
                  <Input
                    id="certificateName"
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    placeholder={t("placeholderCertName")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="issuer" className="text-xs">
                    {t("labelIssuer")}
                  </Label>
                  <Input
                    id="issuer"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder={t("placeholderIssuer")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="issueDate" className="text-xs">
                    {t("labelIssueDate")}
                  </Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {t("fileEncryptionNotice")}
                </p>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || (!identityFile && !certificateFile)
                  }
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  {isSubmitting ? t("btnSubmitting") : t("btnSubmitReview")}
                </Button>
              </div>
            </div>
          )}

          {/* Verified — what is unlocked */}
          {status === "VERIFIED" && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <BadgeCheck size={16} className="text-primary" /> {t("unlockedTitle")}
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  t("unlockedItem1"),
                  t("unlockedItem2"),
                  t("unlockedItem3"),
                  t("unlockedItem4"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle size={12} className="shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Sidebar: Timeline ── */}
        {!isLoading && <VerificationTimeline status={status} />}
      </div>
    </div>
  );
}
