"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
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
  ShieldCheck,
  Lock,
  FileCheck,
  Calendar,
  Briefcase,
  HelpCircle,
  ExternalLink,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  useGetExpertsCompliance,
  getGetExpertsComplianceQueryKey,
} from "@/api/generated";
import { useExpertProfile } from "@/features/experts/hooks/useExpertProfile";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { getErrorMessage, cn } from "@/lib/utils";
import {
  saveDraftFile,
  getDraftFile,
  removeDraftFile,
  clearAllDraftFiles,
} from "@/features/experts/utils/verification-draft-store";
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
  isOnFile = false,
  isRequired = true,
  error,
}: {
  label: string;
  accept: string;
  attached: AttachedFile | null;
  onAttach: (file: File) => void;
  onRemove: () => void;
  isOnFile?: boolean;
  isRequired?: boolean;
  error?: string;
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

  const isImage = attached?.file.type?.startsWith("image/");
  const isPDF = attached?.file.type === "application/pdf";

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <Label className="text-xs font-medium">
          {label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
        {isOnFile && !attached && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2 py-0.5 text-[10px] font-medium border border-green-200 dark:border-green-800">
            <CheckCircle size={10} /> {t("docAlreadyOnFile")}
          </span>
        )}
        {!isOnFile && isRequired && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-medium border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={10} /> {t("docMissingActionRequired")}
          </span>
        )}
      </div>

      {attached ? (
        <div className="relative flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5 min-w-0 overflow-hidden">
          <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
            {isImage && attached.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attached.preview}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FileText size={22} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden pr-1">
            <p className="truncate text-xs sm:text-sm font-semibold text-foreground">
              {attached.file.name}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              {typeof attached.file?.size === "number" && !isNaN(attached.file.size)
                ? `${(attached.file.size / 1024).toFixed(1)} KB`
                : ""} &bull;{" "}
              {attached.file.type.split("/")[1]?.toUpperCase() ?? t("fileLabel")}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary whitespace-nowrap shrink-0">
              <CheckCircle size={9} /> {t("readyToSubmit")}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8"
          >
            <X size={14} />
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
            "flex cursor-pointer flex-col items-center justify-center text-center gap-2 rounded-xl border-2 border-dashed p-5 sm:p-6 transition-colors hover:border-primary/50 hover:bg-primary/5 min-h-[120px] sm:min-h-[135px]",
            error
              ? "border-destructive/70 bg-destructive/5 hover:border-destructive"
              : dragging
              ? "border-primary bg-primary/5"
              : isOnFile
              ? "border-green-300 dark:border-green-800/60 bg-green-50/20 dark:bg-green-950/10"
              : "border-border bg-muted/40"
          )}
        >
          <div className={cn(
            "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-primary",
            error
              ? "bg-destructive/10 text-destructive"
              : isOnFile
              ? "bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400"
              : "bg-primary/10"
          )}>
            <Upload size={18} />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">
              {isOnFile ? t("docReplacePrompt") : t("clickToUpload")}
            </span>{" "}
            {t("orDragDrop")}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {t("fileSizeLimit")}
          </p>
        </div>
      )}

      {error && (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
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
  const { data: profile } = useExpertProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [identityFile, setIdentityFile] = useState<AttachedFile | null>(null);
  const [certificateFile, setCertificateFile] = useState<AttachedFile | null>(
    null
  );
  const [barNumber, setBarNumber] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill barNumber from expert profile if not already set
  useEffect(() => {
    if (profile?.barNumber && !barNumber) {
      setBarNumber(profile.barNumber);
    }
  }, [profile?.barNumber, barNumber]);

  // ── Restore drafts on mount (IndexedDB for binary files + localStorage for metadata) ──
  useEffect(() => {
    let isMounted = true;

    // 1. Restore metadata from localStorage
    try {
      const savedMeta = localStorage.getItem("mj_verification_draft_meta");
      if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        if (meta.barNumber) setBarNumber((prev) => prev || meta.barNumber);
        if (meta.certificateName) setCertificateName((prev) => prev || meta.certificateName);
        if (meta.issuer) setIssuer((prev) => prev || meta.issuer);
        if (meta.issueDate) setIssueDate((prev) => prev || meta.issueDate);
        if (meta.expiryDate) setExpiryDate((prev) => prev || meta.expiryDate);
      }
    } catch {
      // Ignore
    }

    // 2. Restore binary File objects from IndexedDB
    async function restoreDraftFiles() {
      try {
        const [savedIdentity, savedCert] = await Promise.all([
          getDraftFile("identity"),
          getDraftFile("bar_certificate"),
        ]);

        if (!isMounted) return;

        if (savedIdentity) {
          setIdentityFile(createAttachedFile(savedIdentity, "identity"));
        }
        if (savedCert) {
          setCertificateFile(createAttachedFile(savedCert, "certificate"));
        }
      } catch (err) {
        console.warn("Failed to restore verification draft files:", err);
      }
    }

    restoreDraftFiles();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Auto-save metadata whenever fields change ──
  useEffect(() => {
    try {
      localStorage.setItem(
        "mj_verification_draft_meta",
        JSON.stringify({
          barNumber,
          certificateName,
          issuer,
          issueDate,
          expiryDate,
        })
      );
    } catch {
      // Ignore
    }
  }, [barNumber, certificateName, issuer, issueDate, expiryDate]);

  // The generated hook returns AxiosResponse<{ success: boolean; data: ComplianceStatus }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compliance = (data as any)?.data?.data as import("@/api/generated").ComplianceStatus | null;
  const status: string = compliance?.status ?? "DRAFT";
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  const StatusIcon = style.icon;
  const rawReason = compliance?.lastVerification?.rejectionReason;
  const isCorrectionsRequired = status === "REJECTED" && Boolean(rawReason?.startsWith("[CORRECTIONS_REQUIRED]"));
  const cleanReason = isCorrectionsRequired
    ? rawReason!.replace(/^\[CORRECTIONS_REQUIRED\]\s*/, "")
    : rawReason;

  const lastVerif = compliance?.lastVerification as any;
  const hasIdentityOnFile = Boolean(lastVerif?.identityDocumentObjectKey);
  const hasBarCertOnFile = Boolean(lastVerif?.barCertificateObjectKey);

  const isMissingDocsInPending =
    status === "PENDING_VERIFICATION" &&
    Boolean(lastVerif) &&
    (!hasIdentityOnFile || !hasBarCertOnFile);

  const isIdentityMissing = isMissingDocsInPending && !hasIdentityOnFile;
  const isBarCertMissing = isMissingDocsInPending && !hasBarCertOnFile;

  const dynamicMissingDocsDesc = (() => {
    if (!isMissingDocsInPending) return "";
    if (isIdentityMissing && isBarCertMissing) {
      return t("statusMissingDocsDescBoth");
    }
    if (isIdentityMissing) {
      return t("statusMissingDocsDescId");
    }
    return t("statusMissingDocsDescBar");
  })();

  const canSubmit =
    status !== "VERIFIED" &&
    (status !== "PENDING_VERIFICATION" || isMissingDocsInPending);

  // Clear drafts if status is verified or fully pending review (without missing documents)
  useEffect(() => {
    if (status === "VERIFIED" || (status === "PENDING_VERIFICATION" && !isMissingDocsInPending)) {
      clearAllDraftFiles().catch(() => {});
      try {
        localStorage.removeItem("mj_verification_draft_meta");
      } catch {}
    }
  }, [status, isMissingDocsInPending]);

  function createAttachedFile(
    file: File,
    label: AttachedFile["label"]
  ): AttachedFile {
    const isImg = file.type?.startsWith("image/");
    let preview: string | null = null;
    try {
      if (isImg && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        preview = URL.createObjectURL(file);
      }
    } catch {
      preview = null;
    }
    return {
      file,
      preview,
      label,
    };
  }

  async function handleSubmit() {
    const newErrors: Record<string, string> = {};

    // 1. Validate required documents
    if (!identityFile && !hasIdentityOnFile) {
      newErrors.identityFile = t("validationIdRequired");
    }
    if (!certificateFile && !hasBarCertOnFile) {
      newErrors.certificateFile = t("validationBarCertRequired");
    }

    // 2. Validate required metadata fields
    if (!barNumber?.trim()) {
      newErrors.barNumber = t("validationBarNumberRequired");
    }
    if (!certificateName?.trim()) {
      newErrors.certificateName = t("validationCertNameRequired");
    }
    if (!issuer?.trim()) {
      newErrors.issuer = t("validationIssuerRequired");
    }
    if (!issueDate?.trim()) {
      newErrors.issueDate = t("validationIssueDateRequired");
    }
    if (!expiryDate?.trim()) {
      newErrors.expiryDate = t("validationExpiryDateRequired");
    } else {
      const expDate = new Date(expiryDate.trim());
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (issueDate?.trim()) {
        const issDate = new Date(issueDate.trim());
        if (!isNaN(issDate.getTime()) && !isNaN(expDate.getTime()) && expDate <= issDate) {
          newErrors.expiryDate = t("validationExpiryAfterIssue");
        }
      }

      if (!newErrors.expiryDate && !isNaN(expDate.getTime()) && expDate < today) {
        newErrors.expiryDate = t("validationFutureExpiry");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t("validationFixErrors"));
      return;
    }

    setErrors({});
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
      docTypes.forEach((dt) => {
        formData.append("documentTypes", dt);
      });

      formData.append("barNumber", barNumber.trim());
      formData.append("certificateName", certificateName.trim());
      formData.append("issuer", issuer.trim());

      const trimmedIssue = issueDate.trim();
      let normalizedIssue = trimmedIssue;
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedIssue)) {
        normalizedIssue = trimmedIssue;
      } else {
        const mdy = trimmedIssue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (mdy) {
          const [, p1, p2, year] = mdy;
          normalizedIssue =
            Number(p1) > 12
              ? `${year}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`
              : `${year}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
        } else {
          const d = new Date(trimmedIssue);
          if (!isNaN(d.getTime())) {
            normalizedIssue = d.toISOString().split("T")[0];
          }
        }
      }
      formData.append("issueDate", normalizedIssue);

      const trimmedExpiry = expiryDate.trim();
      let normalizedExpiry = trimmedExpiry;
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedExpiry)) {
        normalizedExpiry = trimmedExpiry;
      } else {
        const mdy = trimmedExpiry.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (mdy) {
          const [, p1, p2, year] = mdy;
          normalizedExpiry =
            Number(p1) > 12
              ? `${year}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`
              : `${year}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
        } else {
          const d = new Date(trimmedExpiry);
          if (!isNaN(d.getTime())) {
            normalizedExpiry = d.toISOString().split("T")[0];
          }
        }
      }
      formData.append("expiryDate", normalizedExpiry);

      await apiFetch("/experts/verification/submit", {
        method: "POST",
        body: formData,
      });

      toast.success(t("toastSubmitted"));

      // Clear draft stores on successful submission
      await clearAllDraftFiles();
      try {
        localStorage.removeItem("mj_verification_draft_meta");
      } catch {}

      if (identityFile?.preview) {
        try {
          URL.revokeObjectURL(identityFile.preview);
        } catch {}
      }
      if (certificateFile?.preview) {
        try {
          URL.revokeObjectURL(certificateFile.preview);
        } catch {}
      }

      setIdentityFile(null);
      setCertificateFile(null);
      setBarNumber("");
      setCertificateName("");
      setIssuer("");
      setIssueDate("");
      setExpiryDate("");
      setErrors({});
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

      <div className="grid gap-6 xl:grid-cols-12 xl:gap-8 min-w-0">
        {/* ── Main Column ── */}
        <div className="space-y-6 xl:col-span-8 min-w-0">
          {/* Status Banner */}
          {isLoading ? (
            <SkeletonCard className="h-28" />
          ) : (
            <div
              className={cn(
                "flex items-start gap-4 rounded-xl border p-5 shadow-sm",
                BANNER_CLASS[isCorrectionsRequired || isMissingDocsInPending ? "warning" : style.tone]
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  CHIP_CLASS[isCorrectionsRequired || isMissingDocsInPending ? "warning" : style.tone]
                )}
              >
                {isCorrectionsRequired || isMissingDocsInPending ? <AlertTriangle size={20} /> : <StatusIcon size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-foreground">
                    {isCorrectionsRequired
                      ? t("statusCorrectionsTitle")
                      : isMissingDocsInPending
                      ? t("statusMissingDocsTitle")
                      : t(style.titleKey)}
                  </p>
                  <StatusBadge tone={isCorrectionsRequired || isMissingDocsInPending ? "warning" : BADGE_TONE[style.tone]}>
                    {isCorrectionsRequired
                      ? t("statusCorrectionsTitle")
                      : isMissingDocsInPending
                      ? t("statusMissingDocsTitle")
                      : t(`statusBadge.${status.toLowerCase()}` as any)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isCorrectionsRequired
                    ? t("statusCorrectionsDesc")
                    : isMissingDocsInPending
                    ? dynamicMissingDocsDesc
                    : t(style.descriptionKey)}
                </p>

                {/* Rejection / Corrections reason */}
                {status === "REJECTED" && cleanReason && (
                  isCorrectionsRequired ? (
                    <div className="mt-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs">
                      <p className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-200">
                        <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        {t("correctionsReasonLabel")}
                      </p>
                      <p className="mt-1 italic text-amber-900/80 dark:text-amber-100/80">
                        &ldquo;{cleanReason}&rdquo;
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {t("correctionsReasonInstruction")}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                      <p className="flex items-center gap-1 font-semibold text-destructive">
                        {t("rejectionReasonLabel")}
                      </p>
                      <p className="mt-1 italic text-muted-foreground">
                        &ldquo;{cleanReason}&rdquo;
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {t("rejectionReasonInstruction")}
                      </p>
                    </div>
                  )
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
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Upload size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {isCorrectionsRequired
                    ? t("correctionsDocsTitle")
                    : isMissingDocsInPending
                    ? t("missingDocsTitle")
                    : status === "REJECTED"
                    ? t("resubmitDocsTitle")
                    : t("submitDocsTitle")}
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FileDropZone
                  label={t("labelId")}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  attached={identityFile}
                  isOnFile={hasIdentityOnFile}
                  isRequired={!hasIdentityOnFile}
                  error={errors.identityFile}
                  onAttach={(f) => {
                    if (identityFile?.preview) {
                      try { URL.revokeObjectURL(identityFile.preview); } catch {}
                    }
                    setIdentityFile(createAttachedFile(f, "identity"));
                    saveDraftFile("identity", f);
                    if (errors.identityFile) {
                      setErrors((prev) => ({ ...prev, identityFile: "" }));
                    }
                  }}
                  onRemove={() => {
                    if (identityFile?.preview) {
                      try { URL.revokeObjectURL(identityFile.preview); } catch {}
                    }
                    setIdentityFile(null);
                    removeDraftFile("identity");
                  }}
                />
                <FileDropZone
                  label={t("labelBarCert")}
                  accept="image/*,.pdf"
                  attached={certificateFile}
                  isOnFile={hasBarCertOnFile}
                  isRequired={!hasBarCertOnFile}
                  error={errors.certificateFile}
                  onAttach={(f) => {
                    if (certificateFile?.preview) {
                      try { URL.revokeObjectURL(certificateFile.preview); } catch {}
                    }
                    setCertificateFile(createAttachedFile(f, "certificate"));
                    saveDraftFile("bar_certificate", f);
                    if (errors.certificateFile) {
                      setErrors((prev) => ({ ...prev, certificateFile: "" }));
                    }
                  }}
                  onRemove={() => {
                    if (certificateFile?.preview) {
                      try { URL.revokeObjectURL(certificateFile.preview); } catch {}
                    }
                    setCertificateFile(null);
                    removeDraftFile("bar_certificate");
                  }}
                />
              </div>

              {/* License & Certificate Details */}
              <div className="mt-6 border-t border-border pt-5">
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {t("credentialsSectionTitle")}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("credentialsSectionDesc")}
                  </p>
                </div>

                {/* Important cross-verification notice */}
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                  <ShieldCheck size={16} className="mt-0.5 text-primary shrink-0" />
                  <p className="leading-relaxed text-muted-foreground">
                    {t("certDatesMatchNotice")}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="barNumber" className="text-xs font-medium">
                      {t("labelBarNumber")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="barNumber"
                      value={barNumber}
                      onChange={(e) => {
                        setBarNumber(e.target.value);
                        if (errors.barNumber) setErrors((prev) => ({ ...prev, barNumber: "" }));
                      }}
                      placeholder={t("placeholderBarNumber")}
                      className={cn(errors.barNumber && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.barNumber && (
                      <p className="text-[11px] font-medium text-destructive mt-1">{errors.barNumber}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="certificateName" className="text-xs font-medium">
                      {t("labelCertName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="certificateName"
                      value={certificateName}
                      onChange={(e) => {
                        setCertificateName(e.target.value);
                        if (errors.certificateName) setErrors((prev) => ({ ...prev, certificateName: "" }));
                      }}
                      placeholder={t("placeholderCertName")}
                      className={cn(errors.certificateName && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.certificateName && (
                      <p className="text-[11px] font-medium text-destructive mt-1">{errors.certificateName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="issuer" className="text-xs font-medium">
                      {t("labelIssuer")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="issuer"
                      value={issuer}
                      onChange={(e) => {
                        setIssuer(e.target.value);
                        if (errors.issuer) setErrors((prev) => ({ ...prev, issuer: "" }));
                      }}
                      placeholder={t("placeholderIssuer")}
                      className={cn(errors.issuer && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.issuer && (
                      <p className="text-[11px] font-medium text-destructive mt-1">{errors.issuer}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="issueDate" className="text-xs font-medium">
                      {t("labelIssueDate")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="issueDate"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={issueDate}
                      onChange={(e) => {
                        setIssueDate(e.target.value);
                        if (errors.issueDate) setErrors((prev) => ({ ...prev, issueDate: "" }));
                        if (errors.expiryDate) setErrors((prev) => ({ ...prev, expiryDate: "" }));
                      }}
                      className={cn(errors.issueDate && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.issueDate && (
                      <p className="text-[11px] font-medium text-destructive mt-1">{errors.issueDate}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expiryDate" className="text-xs font-medium">
                      {t("labelExpiryDate")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      min={issueDate || new Date().toISOString().split("T")[0]}
                      value={expiryDate}
                      onChange={(e) => {
                        setExpiryDate(e.target.value);
                        if (errors.expiryDate) setErrors((prev) => ({ ...prev, expiryDate: "" }));
                      }}
                      className={cn(errors.expiryDate && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.expiryDate && (
                      <p className="text-[11px] font-medium text-destructive mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock size={13} className="text-primary shrink-0" />
                  <span>{t("fileEncryptionNotice")}</span>
                </div>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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

          {/* Under Review Notice Card */}
          {!isLoading && status === "PENDING_VERIFICATION" && !isMissingDocsInPending && (
            <div className="rounded-xl border border-warning/30 bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {t("pendingReviewTitle")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("pendingReviewText")}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-foreground mb-3">
                  {t("whileWaiting")}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/expert/dashboard/services" className="gap-2">
                      <Briefcase size={14} />
                      {t("btnConfigureServices")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/expert/dashboard/availability" className="gap-2">
                      <Calendar size={14} />
                      {t("btnSetAvailability")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Verified Celebration Card */}
          {!isLoading && status === "VERIFIED" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <BadgeCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {t("verifiedBannerTitle")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("verifiedBannerText")}
                  </p>
                </div>
              </div>
              <div className="border-t border-primary/20 pt-4 flex flex-wrap gap-3">
                <Button size="sm" asChild>
                  <Link href="/expert/dashboard/calendar" className="gap-2">
                    <Calendar size={14} />
                    {t("btnGoCalendar")}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/expert/dashboard/profile" className="gap-2">
                    <ExternalLink size={14} />
                    {t("btnViewProfile")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar Column (Progress, Guidance & Trust) ── */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1 xl:col-span-4 min-w-0 content-start">
          {/* Verification Timeline Stepper */}
          {!isLoading && <VerificationTimeline status={status} />}

          {/* What Verification Unlocks Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3.5 flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles size={16} className="text-primary" />
              {t("unlockedTitle")}
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {[
                t("unlockedItem1"),
                t("unlockedItem2"),
                t("unlockedItem3"),
                t("unlockedItem4"),
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle size={14} className="shrink-0 text-primary mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Accreditation Guidelines Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3.5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <FileCheck size={16} className="text-primary" />
              {t("guidelinesTitle")}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="font-semibold text-foreground">{t("guidelineIdTitle")}</p>
                <p className="text-muted-foreground mt-0.5">{t("guidelineIdDesc")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="font-semibold text-foreground">{t("guidelineBarTitle")}</p>
                <p className="text-muted-foreground mt-0.5">{t("guidelineBarDesc")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="font-semibold text-foreground">{t("guidelineMatchingTitle")}</p>
                <p className="text-muted-foreground mt-0.5">{t("guidelineMatchingDesc")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="font-semibold text-foreground">{t("guidelineSlaTitle")}</p>
                <p className="text-muted-foreground mt-0.5">{t("guidelineSlaDesc")}</p>
              </div>
            </div>
          </div>

          {/* Security & Confidentiality Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck size={15} className="text-primary" />
              {t("securityTitle")}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("securityDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
