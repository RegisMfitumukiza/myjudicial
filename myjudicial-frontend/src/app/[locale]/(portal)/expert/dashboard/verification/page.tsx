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
  AlertTriangle,
} from "lucide-react";
import {
  useGetExpertsCompliance,
  getGetExpertsComplianceQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";

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
    border: string;
    badge: string;
    icon: React.ElementType;
    titleKey: string;
    descriptionKey: string;
  }
> = {
  VERIFIED: {
    border:
      "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: BadgeCheck,
    titleKey: "statusVerifiedTitle",
    descriptionKey: "statusVerifiedDesc",
  },
  PENDING_VERIFICATION: {
    border:
      "border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
    titleKey: "statusPendingTitle",
    descriptionKey: "statusPendingDesc",
  },
  REJECTED: {
    border: "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
    titleKey: "statusRejectedTitle",
    descriptionKey: "statusRejectedDesc",
  },
  DRAFT: {
    border:
      "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600",
    badge:
      "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    icon: ShieldAlert,
    titleKey: "statusDraftTitle",
    descriptionKey: "statusDraftDesc",
  },
  SUSPENDED: {
    border: "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
    titleKey: "statusSuspendedTitle",
    descriptionKey: "statusSuspendedDesc",
  },
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
    <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-brand-dark dark:text-gray-100">
        {t("timelineProgress")}
      </h3>
      <div className="relative">
        <div className="absolute left-3.5 top-0 h-full w-px bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-5">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4 pl-2">
              <div
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  step.done
                    ? "border-green-500 bg-green-500"
                    : step.active
                    ? "border-brand-blue bg-brand-blue/10"
                    : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                }`}
              >
                {step.done ? (
                  <CheckCircle size={14} className="text-white" />
                ) : step.active ? (
                  <Clock size={12} className="text-brand-blue" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p
                  className={`text-sm font-medium leading-none ${
                    step.done
                      ? "text-green-700 dark:text-green-400"
                      : step.active
                      ? "text-brand-blue"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
        {label} <span className="text-red-500">*</span>
      </label>

      {attached ? (
        <div className="relative flex items-center gap-3 rounded-xl border border-brand-blue/30 bg-brand-blue/5 p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand-border/20 bg-white">
            {isImage && attached.preview ? (
              <img
                src={attached.preview}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FileText
                  size={24}
                  className={isPDF ? "text-red-500" : "text-gray-400"}
                />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-brand-dark dark:text-gray-100">
              {attached.file.name}
            </p>
            <p className="text-xs text-gray-400">
              {(attached.file.size / 1024).toFixed(1)} KB &bull;{" "}
              {attached.file.type.split("/")[1]?.toUpperCase() ?? t("fileLabel")}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle size={9} /> {t("readyToSubmit")}
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
          >
            <X size={12} />
          </button>
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
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all ${
            dragging
              ? "border-brand-blue bg-brand-blue/5"
              : "border-brand-border/30 bg-gray-50 hover:border-brand-blue/50 hover:bg-brand-blue/5 dark:border-gray-700 dark:bg-gray-800"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10">
            <Upload size={18} className="text-brand-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-brand-blue">
              {t("clickToUpload")}
            </span>{" "}
            {t("orDragDrop")}
          </p>
          <p className="text-[11px] text-gray-400">
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
      docTypes.forEach((t) => formData.append("documentTypes[]", t));

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
      toast.error(
        error instanceof Error ? error.message : t("toastSubmitFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">
          {t("titleVerification")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("subtitleVerification")}
        </p>
      </div>

      <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
        {/* ── Main Column ── */}
        <div className="space-y-5">
          {/* Status Banner */}
          {isLoading ? (
            <div className="h-28 animate-pulse rounded-xl border border-brand-border/20 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          ) : (
            <div
              className={`flex items-start gap-4 rounded-xl border p-5 shadow-md ${style.border}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/60 shadow-sm dark:bg-black/20">
                <StatusIcon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
                    {t(style.titleKey)}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {t(style.descriptionKey)}
                </p>

                {/* Rejection reason */}
                {status === "REJECTED" &&
                  compliance?.lastVerification?.rejectionReason && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50/60 p-3 text-xs dark:border-red-900/30 dark:bg-red-950/20">
                      <p className="flex items-center gap-1 font-semibold text-red-800 dark:text-red-300">
                        <AlertTriangle size={12} /> {t("rejectionReasonLabel")}
                      </p>
                      <p className="mt-1 italic text-red-700 dark:text-red-400">
                        &ldquo;{compliance.lastVerification.rejectionReason}&rdquo;
                      </p>
                      <p className="mt-2 font-medium text-red-800 dark:text-red-300">
                        {t("rejectionReasonInstruction")}
                      </p>
                    </div>
                  )}

                {/* Expiry warning */}
                {compliance?.daysUntilExpiry != null && (
                  <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    &#9888; {compliance.daysUntilExpiry === 1 ? t("credentialsExpireInOne", { days: compliance.daysUntilExpiry }) : t("credentialsExpireInOther", { days: compliance.daysUntilExpiry })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Document Upload Form */}
          {!isLoading && canSubmit && (
            <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-5 flex items-center gap-2">
                <Upload size={16} className="text-brand-blue" />
                <h3 className="text-sm font-bold text-brand-dark dark:text-gray-100">
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
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {t("labelBarNumber")}
                  </label>
                  <input
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder={t("placeholderBarNumber")}
                    className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {t("labelCertName")}
                  </label>
                  <input
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    placeholder={t("placeholderCertName")}
                    className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {t("labelIssuer")}
                  </label>
                  <input
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder={t("placeholderIssuer")}
                    className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {t("labelIssueDate")}
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-brand-border/10 pt-4">
                <p className="text-xs text-gray-400">
                  {t("fileEncryptionNotice")}
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || (!identityFile && !certificateFile)
                  }
                  className="flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  {isSubmitting ? t("btnSubmitting") : t("btnSubmitReview")}
                </button>
              </div>
            </div>
          )}

          {/* Verified — what is unlocked */}
          {status === "VERIFIED" && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 dark:border-green-900/30 dark:bg-green-950/20">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-green-800 dark:text-green-300">
                <BadgeCheck size={16} /> {t("unlockedTitle")}
              </h3>
              <ul className="space-y-2 text-xs text-green-800 dark:text-green-400">
                {[
                  t("unlockedItem1"),
                  t("unlockedItem2"),
                  t("unlockedItem3"),
                  t("unlockedItem4"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle size={12} className="shrink-0" />
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
