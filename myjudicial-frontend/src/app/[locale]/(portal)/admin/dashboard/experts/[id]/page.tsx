"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Ban,
  Briefcase,
  Globe,
  Star,
  Shield,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Bell,
  RefreshCw,
  Download,
  X,
  BadgeCheck,
  TrendingUp,
  Hash,
  Copy,
  Check,
  Eye,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";

// ── Types ──

type ExpertStatus = "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED";
type AccountStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED";
type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | null;

interface ExpertDetail {
  id: string;
  expertProfileId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  displayName?: string;
  phone?: string;
  momoNumber?: string | null;
  accountStatus: AccountStatus;
  bio?: string;
  firmName?: string;
  primarySpecialty?: string;
  barNumber?: string;
  yearsOfExperience?: number;
  expertStatus: ExpertStatus;
  specialties: string[];
  languages: string[];
  officeAddress?: string;
  city?: string;
  country?: string;
  baseConsultationFee?: number;
  currency?: string;
  avgRating?: number;
  totalBookings: number;
  totalReviews: number;
  totalEarnings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  createdAt: string;
  lastLoginAt?: string;
  verified: boolean;
  profileImageObjectKey?: string | null;
  profileImageUrl?: string | null;
  verificationId: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  identityDocumentObjectKey?: string | null;
  barCertificateObjectKey?: string | null;
  additionalDocumentKeys: string[];
  barCertificateUrl?: string | null;
  identityDocumentUrl?: string | null;
  credentialsExpiry?: string | null;
  certifications?: {
    id: string;
    certificateName: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string | null;
    documentObjectKey?: string | null;
    createdAt?: string;
  }[];
  recentBookings: {
    id: string;
    status: string;
    scheduledStart: string;
    citizen: { fullName: string; email: string };
  }[];
}

// ── API ──

async function fetchExpert(id: string): Promise<ExpertDetail> {
  const res = await apiFetch<{ data: ExpertDetail }>(`/admin/experts/${id}`);
  return (res as any).data;
}

async function suspendExpert(id: string, reason: string) {
  return apiFetch(`/admin/experts/${id}/suspend`, {
    method: "PATCH",
    body: { reason, notifyExpert: true },
  });
}

async function activateExpert(id: string) {
  return apiFetch(`/admin/experts/${id}/activate`, { method: "PATCH" });
}

async function approveVerification(verificationId: string, credentialsExpiry?: string) {
  return apiFetch(`/admin-verification/${verificationId}/approve`, {
    method: "PATCH",
    body: credentialsExpiry ? { credentialsExpiry } : undefined,
  });
}

async function rejectVerification(verificationId: string, reason: string) {
  return apiFetch(`/admin-verification/${verificationId}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}

async function sendReminder(expertUserId: string) {
  return apiFetch(`/admin/experts/${expertUserId}/send-verification-reminder`, { method: "POST" });
}

async function requestCorrections(verificationId: string, notes: string) {
  return apiFetch(`/admin-verification/${verificationId}/request-corrections`, {
    method: "POST",
    body: { notes },
  });
}

async function resetToDraft(expertUserId: string) {
  return apiFetch(`/admin/experts/${expertUserId}/reset-to-resubmit`, { method: "PATCH" });
}

async function setCredentialDates(expertUserId: string, body: {
  certificateName: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  auditNote?: string;
}) {
  return apiFetch(`/admin/experts/${expertUserId}/credentials`, {
    method: "PATCH",
    body,
  });
}

async function getDocumentStream(verificationId: string, objectKey: string): Promise<{ url: string; mimeType: string }> {
  const blob = await apiFetchBlob(
    `/admin-verification/${verificationId}/document-stream?key=${encodeURIComponent(objectKey)}`,
    { method: "GET" }
  );
  return {
    url: URL.createObjectURL(blob),
    mimeType: blob.type
  };
}

// ── Helpers ──

function formatSpecialty(s?: string | null) {
  if (!s) return "";
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function expertStatusTone(status: ExpertStatus): "neutral" | "pending" | "success" | "destructive" {
  switch (status) {
    case "VERIFIED":             return "success";
    case "PENDING_VERIFICATION": return "pending";
    case "REJECTED":
    case "SUSPENDED":            return "destructive";
    default:                     return "neutral";
  }
}

function verificationStatusTone(status: VerificationStatus): "neutral" | "pending" | "success" | "destructive" {
  switch (status) {
    case "APPROVED": return "success";
    case "PENDING":  return "pending";
    case "REJECTED":
    case "EXPIRED":  return "destructive";
    default:         return "neutral";
  }
}

function bookingStatusTone(status: string): "success" | "destructive" | "warning" | "neutral" {
  switch (status) {
    case "COMPLETED":  return "success";
    case "CANCELLED":  return "destructive";
    case "CONFIRMED":
    case "IN_PROGRESS": return "warning";
    default:           return "neutral";
  }
}

// ── Document Viewer Sheet (Standalone overlay) ──

function DocumentViewer({
  verificationId,
  objectKey,
  label,
  onClose,
  t,
}: {
  verificationId: string;
  objectKey: string;
  label: string;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    getDocumentStream(verificationId, objectKey)
      .then((res) => {
        if (!active) return;
        setUrl(res.url);
        setMimeType(res.mimeType);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId, objectKey, retryKey]);

  const isImage = mimeType ? mimeType.startsWith("image/") : /\.(jpg|jpeg|png|webp|gif)$/i.test(objectKey);
  const isPdf   = mimeType ? mimeType === "application/pdf" : /\.pdf$/i.test(objectKey);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <FileText size={17} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{label}</h3>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{objectKey}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download={objectKey.split('/').pop()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download size={13} /> {t("download")}
              </a>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-4 bg-muted/10">
          {loading && (
            <LoadingSpinner label={t("loading")} />
          )}
          {error && (
            <div className="text-center p-6">
              <AlertTriangle size={36} className="mx-auto mb-3 text-destructive" />
              <p className="text-sm font-semibold text-foreground">{t("failedToLoadDocument")}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Could not load or decrypt document preview from storage.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRetryKey((k) => k + 1)}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw size={12} /> Retry
                </Button>
              </div>
            </div>
          )}
          {url && !loading && !error && (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={label} className="max-h-full max-w-full rounded-lg object-contain shadow bg-background" />
            ) : isPdf ? (
              <iframe src={url} className="h-full w-full rounded-lg bg-white" title={label} />
            ) : (
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("view")}</p>
                <a href={url} download={objectKey.split('/').pop()} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <ExternalLink size={13} /> {t("download")}
                </a>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Embedded Document Preview (Split-Pane Workstation) ──

function EmbeddedDocumentPreview({
  verificationId,
  objectKey,
  label,
  t,
}: {
  verificationId: string | null;
  objectKey: string | null | undefined;
  label: string;
  t: (key: string) => string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!verificationId || !objectKey) {
      setLoading(false);
      setError(true);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);

    getDocumentStream(verificationId, objectKey)
      .then((res) => {
        if (!active) return;
        setUrl(res.url);
        setMimeType(res.mimeType);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId, objectKey, retryKey]);

  const isImage = mimeType ? mimeType.startsWith("image/") : /\.(jpg|jpeg|png|webp|gif)$/i.test(objectKey || "");
  const isPdf   = mimeType ? mimeType === "application/pdf" : /\.pdf$/i.test(objectKey || "");

  if (!objectKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center bg-muted/20">
        <FileText size={36} className="mb-2 text-muted-foreground/60" />
        <p className="text-xs font-semibold text-foreground">{t("noBarCertificateOnFile")}</p>
        <p className="text-[11px] text-muted-foreground mt-1">No certificate scan uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-muted/20 overflow-hidden">
      {/* Workstation Viewer Toolbar */}
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5 bg-card/70 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <BadgeCheck size={14} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">{label}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground truncate hidden sm:inline-block max-w-[140px]">
            {objectKey.split("/").pop()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink size={11} /> Open
            </a>
          )}
          {url && (
            <a
              href={url}
              download={objectKey.split("/").pop()}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Download size={11} /> Save
            </a>
          )}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setRetryKey((k) => k + 1)}
            className="h-6 px-1.5 text-[11px]"
            title="Reload preview"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Embedded Document Viewport */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-auto bg-muted/30 min-h-[300px]">
        {loading && <LoadingSpinner label={t("loading")} />}
        {error && (
          <div className="text-center p-4">
            <AlertTriangle size={32} className="mx-auto mb-2 text-amber-500" />
            <p className="text-xs font-semibold text-foreground">{t("failedToLoadDocument")}</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
              Could not decrypt or render the official document scan.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-3 text-xs gap-1.5"
            >
              <RefreshCw size={12} /> Retry Preview
            </Button>
          </div>
        )}
        {url && !loading && !error && (
          isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="max-h-full max-w-full rounded-md object-contain shadow-sm border border-border bg-background" />
          ) : isPdf ? (
            <iframe src={url} className="h-full w-full rounded-md border border-border shadow-sm bg-white" title={label} />
          ) : (
            <div className="text-center p-6">
              <FileText size={40} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Binary Document</p>
              <a href={url} download={objectKey.split("/").pop()} className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline">
                Download file
              </a>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Document Row ──

function DocRow({
  label,
  objectKey,
  required,
  verificationId,
  t,
}: {
  label: string;
  objectKey: string | null | undefined;
  required: boolean;
  verificationId: string | null;
  t: (key: string) => string;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const submitted = !!objectKey;

  return (
    <>
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex items-center gap-3">
          {submitted ? (
            <CheckCircle size={15} className="shrink-0 text-green-500" />
          ) : (
            <XCircle size={15} className={`shrink-0 ${required ? "text-destructive" : "text-muted-foreground"}`} />
          )}
          <span className={`text-sm ${submitted ? "text-foreground" : required ? "font-medium text-destructive" : "text-muted-foreground"}`}>
            {label}
          </span>
          {required && !submitted && (
            <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              {t("required")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {submitted && verificationId && objectKey && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setViewerOpen(true)}
              className="text-primary hover:bg-primary/5"
            >
              <ExternalLink size={11} /> {t("view")}
            </Button>
          )}
          <span className={`text-xs font-medium ${submitted ? "text-green-600" : "text-muted-foreground"}`}>
            {submitted ? t("submitted") : t("missing")}
          </span>
        </div>
      </div>

      {viewerOpen && objectKey && verificationId && (
        <DocumentViewer
          verificationId={verificationId}
          objectKey={objectKey}
          label={label}
          onClose={() => setViewerOpen(false)}
          t={t}
        />
      )}
    </>
  );
}

// ── Main Page ──

export default function ExpertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("admin.experts");
  const locale = useLocale();
  const expertId = params.id as string;

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCorrectionsForm, setShowCorrectionsForm] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // ── Accreditation & Document Audit Approval Modal State ──
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [confirmedExpiryDate, setConfirmedExpiryDate] = useState("");
  const [checklist, setChecklist] = useState({
    barMatch: false,
    issueDateMatch: false,
    expiryDateMatch: false,
    sealAuthentic: false,
  });
  const [auditViewerKey, setAuditViewerKey] = useState<string | null>(null);

  // ── Credential Audit / Backfill Modal State (Track 1) ──
  const [showCredentialAuditModal, setShowCredentialAuditModal] = useState(false);
  const [auditModalTab, setAuditModalTab] = useState<"preview" | "form">("preview");
  const [approveModalTab, setApproveModalTab] = useState<"preview" | "checklist">("preview");
  const [credAuditForm, setCredAuditForm] = useState({
    certificateName: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    auditNote: "",
  });

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success(t("copied"));
    setTimeout(() => setCopiedId(false), 2000);
  };

  const expertStatusLabel = (status: ExpertStatus): string => {
    switch (status) {
      case "VERIFIED":             return t("verified");
      case "PENDING_VERIFICATION": return t("pendingReview");
      case "REJECTED":             return t("reject");
      case "SUSPENDED":            return t("suspended");
      default:                     return "Draft";
    }
  };

  const { data: expert, isLoading, error } = useQuery({
    queryKey: ["admin-expert-detail", expertId],
    queryFn: () => fetchExpert(expertId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-expert-detail", expertId] });

  const suspendMutation = useMutation({
    mutationFn: ({ reason }: { reason: string }) => suspendExpert(expertId, reason),
    onSuccess: () => { invalidate(); setShowSuspendModal(false); setSuspendReason(""); toast.success(t("expertSuspended")); },
    onError: () => toast.error(t("actionFailed")),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateExpert(expertId),
    onSuccess: () => { invalidate(); toast.success(t("expertActivated")); },
    onError: () => toast.error(t("actionFailed")),
  });

  const approveMutation = useMutation({
    mutationFn: (credentialsExpiry?: string | void) =>
      approveVerification(expert!.verificationId!, typeof credentialsExpiry === "string" ? credentialsExpiry : undefined),
    onSuccess: () => {
      invalidate();
      setShowApproveModal(false);
      setChecklist({ barMatch: false, issueDateMatch: false, expiryDateMatch: false, sealAuthentic: false });
      toast.success(t("verificationApproved"));
    },
    onError: () => toast.error(t("actionFailed")),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectVerification(expert!.verificationId!, reason),
    onSuccess: () => { invalidate(); setShowRejectForm(false); setRejectReason(""); toast.success(t("verificationRejected")); },
    onError: () => toast.error(t("actionFailed")),
  });

  const reminderMutation = useMutation({
    mutationFn: () => sendReminder(expertId),
    onSuccess: (res: any) => {
      const missing = res?.data?.missingDocuments as string[] | undefined;
      toast.success(
        missing && missing.length > 0
          ? `${t("reminderSent")}: ${missing.join(", ")}`
          : t("reminderSent")
      );
    },
    onError: () => toast.error(t("actionFailed")),
  });

  const correctionsMutation = useMutation({
    mutationFn: (notes: string) => requestCorrections(expert!.verificationId!, notes),
    onSuccess: () => { invalidate(); setShowCorrectionsForm(false); setCorrectionNotes(""); toast.success(t("correctionsSent")); },
    onError: () => toast.error(t("actionFailed")),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetToDraft(expertId),
    onSuccess: () => {
      invalidate();
      setShowResetModal(false);
      toast.success(t("resetSuccess"));
    },
    onError: () => toast.error(t("actionFailed")),
  });

  const credentialAuditMutation = useMutation({
    mutationFn: () => setCredentialDates(expertId, {
      certificateName: credAuditForm.certificateName,
      issuer: credAuditForm.issuer,
      issueDate: credAuditForm.issueDate,
      expiryDate: credAuditForm.expiryDate,
      auditNote: credAuditForm.auditNote || undefined,
    }),
    onSuccess: () => {
      invalidate();
      setShowCredentialAuditModal(false);
      setCredAuditForm({ certificateName: "", issuer: "", issueDate: "", expiryDate: "", auditNote: "" });
      toast.success(t("credentialDatesSetSuccess"));
    },
    onError: () => toast.error(t("actionFailed")),
  });

  const latestCert = Array.isArray(expert?.certifications) ? expert.certifications[0] : undefined;
  const effectiveExpiry = latestCert?.expiryDate || expert?.credentialsExpiry || null;
  const initialExpiry = effectiveExpiry
    ? new Date(effectiveExpiry).toISOString().split("T")[0]
    : "";

  useEffect(() => {
    if (initialExpiry && !confirmedExpiryDate) {
      setConfirmedExpiryDate(initialExpiry);
    }
  }, [initialExpiry, confirmedExpiryDate]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <LoadingSpinner label={t("loading")} />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <PageHeader
          title={t("title")}
          backHref="/admin/dashboard/experts"
          backLabel={t("backToExperts")}
        />
        <ErrorState
          title={t("failedToLoad")}
          message={(error as Error)?.message ?? t("noExperts")}
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/dashboard/experts">{t("backToExperts")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // ── Derived state ──

  const displayName = expert.fullName || `${expert.firstName ?? ""} ${expert.lastName ?? ""}`.trim() || expert.email || "Expert";
  const isSuspended = expert.accountStatus === "SUSPENDED";

  const isChecklistComplete =
    checklist.barMatch &&
    checklist.issueDateMatch &&
    checklist.expiryDateMatch &&
    checklist.sealAuthentic &&
    Boolean(confirmedExpiryDate);

  const requiredDocs = [
    { label: t("identityDocument"), key: expert.identityDocumentObjectKey, required: true },
    { label: t("barCertificate"),   key: expert.barCertificateObjectKey,   required: true },
  ];
  const optionalDocs = [
    { label: t("profilePhoto"),     key: expert.profileImageObjectKey,     required: false },
    ...(Array.isArray(expert.additionalDocumentKeys) ? expert.additionalDocumentKeys : []).map((k, i) => ({
      label: `${t("additionalDocument")} ${i + 1}`,
      key: k,
      required: false,
    })),
  ];
  const allDocs = [...requiredDocs, ...optionalDocs];

  const missingRequired = requiredDocs.filter((d) => !d.key).map((d) => d.label);
  const allRequiredPresent = missingRequired.length === 0;
  const isPending = expert.verificationStatus === "PENDING";
  const isVerified = expert.expertStatus === "VERIFIED";
  const isRejected = expert.expertStatus === "REJECTED";

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Page Header */}
      <PageHeader
        title={displayName}
        backHref="/admin/dashboard/experts"
        backLabel={t("backToExperts")}
        actions={
          isSuspended ? (
            <Button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              id="btn-activate-expert"
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle size={14} /> {t("activate")}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setShowSuspendModal(true)}
              id="btn-suspend-expert"
            >
              <Ban size={14} /> {t("suspend")}
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT COLUMN */}
        <div className="space-y-5 lg:col-span-1">

          {/* Expert Overview Card */}
          <Card>
            <CardContent className="pt-5">
              {/* Avatar / Photo */}
              <div className="flex flex-col items-center gap-3 pb-5 border-b border-border">
                <ExpertAvatar
                  src={expert.profileImageUrl}
                  name={displayName}
                  size="2xl"
                  className="shadow ring-4 ring-background"
                />
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                  {expert.displayName && expert.displayName !== displayName && (
                    <p className="text-sm text-muted-foreground">{expert.displayName}</p>
                  )}
                  {expert.firmName && (
                    <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Briefcase size={12} /> {expert.firmName}
                    </p>
                  )}
                </div>
                {/* Status badges */}
                <div className="flex flex-wrap justify-center gap-2">
                  <StatusBadge tone={expertStatusTone(expert.expertStatus)}>
                    {expertStatusLabel(expert.expertStatus)}
                  </StatusBadge>
                  {isSuspended && (
                    <StatusBadge tone="destructive">{t("suspended")}</StatusBadge>
                  )}
                </div>
                {expert.avgRating != null && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} className="fill-current" />
                    <span className="text-sm font-semibold text-foreground">{expert.avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({expert.totalReviews} reviews)</span>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail size={13} className="shrink-0 text-muted-foreground" /> {expert.email}
                  </div>
                  {expert.phone && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone size={13} className="shrink-0 text-muted-foreground" />
                      <span>{expert.phone}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">(Contact)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <CreditCard size={13} className="shrink-0 text-primary" />
                    {expert.momoNumber ? (
                      <span className="font-mono text-xs text-foreground font-medium flex items-center gap-1.5 flex-wrap">
                        {expert.momoNumber}
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Payout MoMo
                        </span>
                      </span>
                    ) : expert.phone ? (
                      <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        {expert.phone}
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Fallback MoMo
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-destructive italic">No payout MoMo registered</span>
                    )}
                  </div>
                  {expert.officeAddress && (
                    <div className="flex items-start gap-2.5 text-muted-foreground">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
                      <span>{expert.officeAddress}{expert.city ? `, ${expert.city}` : ""}{expert.country ? `, ${expert.country}` : ""}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Details */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Professional</h3>
                <div className="space-y-2 text-sm">
                  {expert.barNumber && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Hash size={12} /> {t("barNumber")}</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{expert.barNumber}</span>
                    </div>
                  )}
                  {expert.yearsOfExperience != null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Briefcase size={12} /> {t("yearsOfExperience")}</span>
                      <span className="text-foreground">{expert.yearsOfExperience} yrs</span>
                    </div>
                  )}
                  {expert.baseConsultationFee != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Base Fee</span>
                      <span className="font-semibold text-foreground">
                        {expert.baseConsultationFee.toLocaleString()} {expert.currency ?? "RWF"}
                      </span>
                    </div>
                  )}
                  {expert.primarySpecialty && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Primary</span>
                      <span className="text-xs font-medium text-primary">{formatSpecialty(expert.primarySpecialty)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specialties */}
              {(() => {
                const allSpecialties = Array.from(
                  new Set(
                    [
                      expert.primarySpecialty,
                      ...(Array.isArray(expert.specialties) ? expert.specialties : []),
                    ].filter((s): s is string => Boolean(s))
                  )
                );
                if (allSpecialties.length === 0) return null;
                return (
                  <div className="mt-5 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("specialties")}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {allSpecialties.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            s === expert.primarySpecialty
                              ? "bg-primary/10 border border-primary/20 text-primary"
                              : "bg-muted border border-border text-muted-foreground"
                          }`}
                        >
                          {formatSpecialty(s)}
                          {s === expert.primarySpecialty && (
                            <span className="ml-1 text-[10px] opacity-75 font-normal">(Primary)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Languages */}
              {expert.languages.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("languages")}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {expert.languages.map((l) => (
                      <span key={l} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <Globe size={10} /> {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Meta */}
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {t("joined")}</span>
                  <span>{new Date(expert.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {expert.lastLoginAt && (
                  <div className="flex items-center justify-between">
                    <span>{t("lastLogin")}</span>
                    <span>{new Date(expert.lastLoginAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-0.5">
                  <span title="Internal platform user account identifier (UUID)">{t("expertId")}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono text-[11px] bg-muted/80 text-foreground px-1.5 py-0.5 rounded border border-border"
                      title={expert.id}
                    >
                      {expert.id.slice(0, 8)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(expert.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted cursor-pointer"
                      title={expert.id}
                      aria-label={t("expertId")}
                    >
                      {copiedId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {expert.bio && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-foreground">Bio</h3>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">{expert.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5 lg:col-span-2">

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label={t("totalBookings")} value={expert.totalBookings} />
            <StatCard label={t("totalReviews")} value={expert.totalReviews} />
            <StatCard
              label={t("rating")}
              value={expert.avgRating != null ? expert.avgRating.toFixed(1) : "--"}
              hint="out of 5"
            />
            <StatCard
              label={t("earnings")}
              value={`${(expert.totalEarnings ?? 0).toLocaleString()} ${expert.currency ?? "RWF"}`}
            />
          </div>

          {/* VERIFICATION PANEL */}
          <Card>
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Shield size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{t("credentials")}</h2>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{t("status")}:</span>
                    {expert.verificationStatus ? (
                      <StatusBadge tone={verificationStatusTone(expert.verificationStatus)}>
                        {expert.verificationStatus}
                      </StatusBadge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No verification submitted</span>
                    )}
                  </div>
                </div>
              </div>
              {isVerified && (
                <StatusBadge tone="success">{t("verified")}</StatusBadge>
              )}
            </div>

            <CardContent className="space-y-6 pt-5">

              {/* Certificate & Accreditation Audit Card */}
              <section className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card p-4 sm:p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {t("auditCardTitle")}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {t("auditCardDesc")}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                    <BadgeCheck size={11} /> {t("auditVisualBadge")}
                  </span>
                </div>

                <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-background/60 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("barNumber")}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                      {expert.barNumber || "--"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("certIssuer")}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {latestCert?.issuer || "Rwanda Bar Association"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("certName")}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-foreground truncate" title={latestCert?.certificateName}>
                      {latestCert?.certificateName || t("barCertificate")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("certIssueDate")}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {latestCert?.issueDate
                        ? new Date(latestCert.issueDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
                        : "--"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 p-2.5 sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("certExpiryDate")}
                      </p>
                      {effectiveExpiry && (
                        <span className="text-[11px] font-medium text-primary">
                          {(() => {
                            const exp = new Date(effectiveExpiry);
                            const now = new Date();
                            const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays < 0) return "Expired";
                            if (diffDays === 1) return "1 day remaining";
                            return `${diffDays} days remaining`;
                          })()}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-bold text-foreground">
                      {effectiveExpiry
                        ? new Date(effectiveExpiry).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
                        : "--"}
                    </p>
                  </div>
                </div>

                {/* Audit Card Bottom Actions */}
                <div className="mt-3.5 border-t border-border/80 pt-3 space-y-2.5">
                  {/* Missing dates banner for already-verified experts */}
                  {isVerified && !effectiveExpiry && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-3 py-2">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 flex-1">
                        {t("credentialDatesNotSet")}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {t("crossVerifyHint")}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Audit & Set Validity Dates — shown when dates are missing for verified expert */}
                      {isVerified && !effectiveExpiry && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setCredAuditForm({
                              certificateName: latestCert?.certificateName || "Rwanda Bar Practicing Certificate",
                              issuer: latestCert?.issuer || "Rwanda Bar Association",
                              issueDate: latestCert?.issueDate ? new Date(latestCert.issueDate).toISOString().split("T")[0] : "",
                              expiryDate: "",
                              auditNote: "",
                            });
                            setShowCredentialAuditModal(true);
                          }}
                          className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
                        >
                          <ShieldCheck size={13} /> {t("auditSetDatesBtn")}
                        </Button>
                      )}
                      {/* Update Credential Dates — shown for verified expert who already has dates (annual renewal) */}
                      {isVerified && effectiveExpiry && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCredAuditForm({
                              certificateName: latestCert?.certificateName || "Rwanda Bar Practicing Certificate",
                              issuer: latestCert?.issuer || "Rwanda Bar Association",
                              issueDate: latestCert?.issueDate ? new Date(latestCert.issueDate).toISOString().split("T")[0] : "",
                              expiryDate: initialExpiry,
                              auditNote: "",
                            });
                            setShowCredentialAuditModal(true);
                          }}
                          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <RefreshCw size={13} /> {t("updateCredentialDatesBtn")}
                        </Button>
                      )}
                      {expert.barCertificateObjectKey && expert.verificationId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAuditViewerKey(expert.barCertificateObjectKey!)}
                          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Eye size={13} /> {t("inspectBarCert")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </section>


              {/* Document checklist */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText size={14} className="text-primary" /> {t("documents")}
                </h3>
                <div className="rounded-xl border border-border bg-muted/50 px-4">
                  {allDocs.map((doc) => (
                    <DocRow
                      key={doc.label}
                      label={doc.label}
                      objectKey={doc.key}
                      required={doc.required}
                      verificationId={expert.verificationId}
                      t={t}
                    />
                  ))}
                </div>
              </section>

              {/* Missing documents banner */}
              {!isVerified && missingRequired.length > 0 && (
                <section className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{t("missing")}</p>
                      <ul className="mt-1.5 space-y-1">
                        {missingRequired.map((d) => (
                          <li key={d} className="text-xs text-yellow-700 dark:text-yellow-400">&bull; {d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* All docs present banner */}
              {!isVerified && allRequiredPresent && isPending && (
                <section className="rounded-xl border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950/30">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="shrink-0 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                      {t("verifiedCredentials")}
                    </p>
                  </div>
                </section>
              )}

              {/* Rejection reason */}
              {isRejected && expert.rejectionReason && (
                <section className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2">{t("rejectionReason")}</p>
                  <p className="text-sm text-red-800 dark:text-red-300">{expert.rejectionReason}</p>
                </section>
              )}

              {/* VERIFICATION ACTIONS */}
              {!isVerified && (
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">{t("actions")}</h3>

                  <div className="flex flex-wrap gap-2">

                    {/* Approve - opens mandatory audit checklist modal */}
                    {isPending && allRequiredPresent && !showRejectForm && !showCorrectionsForm && (
                      <Button
                        onClick={() => {
                          if (initialExpiry) setConfirmedExpiryDate(initialExpiry);
                          setShowApproveModal(true);
                        }}
                        disabled={approveMutation.isPending}
                        id="btn-approve-verification"
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <BadgeCheck size={14} /> {t("approveVerification")}
                      </Button>
                    )}

                    {/* Request Corrections */}
                    {isPending && !showRejectForm && !showCorrectionsForm && (
                      <Button
                        variant="outline"
                        onClick={() => setShowCorrectionsForm(true)}
                        id="btn-request-corrections"
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950/20"
                      >
                        <AlertTriangle size={14} /> {t("requestCorrections")}
                      </Button>
                    )}

                    {/* Reject */}
                    {isPending && !showRejectForm && !showCorrectionsForm && (
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectForm(true)}
                        id="btn-reject-verification"
                        className="border-red-300 text-destructive hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        <XCircle size={14} /> {t("rejectVerification")}
                      </Button>
                    )}

                    {/* Send Reminder */}
                    {(!isPending || missingRequired.length > 0) && !showRejectForm && !showCorrectionsForm && (
                      <Button
                        variant="outline"
                        onClick={() => reminderMutation.mutate()}
                        disabled={reminderMutation.isPending}
                        id="btn-send-reminder"
                      >
                        <Bell size={14} /> {t("sendReminder")}
                      </Button>
                    )}

                    {/* Reset to Draft */}
                    {!isVerified && !showRejectForm && !showCorrectionsForm && (
                      <Button
                        variant="outline"
                        onClick={() => setShowResetModal(true)}
                        disabled={resetMutation.isPending}
                        id="btn-reset-to-draft"
                      >
                        <RefreshCw size={14} className={resetMutation.isPending ? "animate-spin" : ""} /> {t("resetToDraft")}
                      </Button>
                    )}
                  </div>

                  {/* Reject Form */}
                  {showRejectForm && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-3 dark:border-red-700 dark:bg-red-950/30">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">{t("rejectionReason")}</p>

                      {/* Quick Discrepancy Templates */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-red-900/80 dark:text-red-300/80">
                          {t("discrepancyTemplates")}:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setRejectReason(
                                t("templateExpiryText", {
                                  date: effectiveExpiry
                                    ? new Date(effectiveExpiry).toLocaleDateString(locale)
                                    : "--",
                                })
                              )
                            }
                            className="rounded-md border border-red-300 bg-red-100/70 px-2 py-1 text-[11px] font-medium text-red-900 transition-colors hover:bg-red-200 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-900/60"
                          >
                            {t("discrepancyExpiryMismatch")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRejectReason(
                                t("templateBarText", {
                                  barNumber: expert.barNumber || "--",
                                })
                              )
                            }
                            className="rounded-md border border-red-300 bg-red-100/70 px-2 py-1 text-[11px] font-medium text-red-900 transition-colors hover:bg-red-200 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-900/60"
                          >
                            {t("discrepancyBarMismatch")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectReason(t("templateIllegibleText"))}
                            className="rounded-md border border-red-300 bg-red-100/70 px-2 py-1 text-[11px] font-medium text-red-900 transition-colors hover:bg-red-200 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-900/60"
                          >
                            {t("discrepancyIllegible")}
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. The uploaded identity document is not legible. Please resubmit a clear, high-resolution scan."
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 outline-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => { if (rejectReason.trim().length < 10) { toast.error(t("minChars")); return; } rejectMutation.mutate(rejectReason.trim()); }}
                          disabled={rejectMutation.isPending || rejectReason.trim().length < 10}
                        >
                          {t("confirmRejection")}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowRejectForm(false); setRejectReason(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Corrections Form */}
                  {showCorrectionsForm && (
                    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 space-y-3 dark:border-yellow-700 dark:bg-yellow-950/30">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{t("correctionNotes")}</p>

                      {/* Quick Discrepancy Templates */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-yellow-900/80 dark:text-yellow-300/80">
                          {t("discrepancyTemplates")}:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setCorrectionNotes(
                                t("templateExpiryText", {
                                  date: effectiveExpiry
                                    ? new Date(effectiveExpiry).toLocaleDateString(locale)
                                    : "--",
                                })
                              )
                            }
                            className="rounded-md border border-yellow-300 bg-yellow-100/70 px-2 py-1 text-[11px] font-medium text-yellow-900 transition-colors hover:bg-yellow-200 dark:border-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-200 dark:hover:bg-yellow-900/60"
                          >
                            {t("discrepancyExpiryMismatch")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCorrectionNotes(
                                t("templateBarText", {
                                  barNumber: expert.barNumber || "--",
                                })
                              )
                            }
                            className="rounded-md border border-yellow-300 bg-yellow-100/70 px-2 py-1 text-[11px] font-medium text-yellow-900 transition-colors hover:bg-yellow-200 dark:border-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-200 dark:hover:bg-yellow-900/60"
                          >
                            {t("discrepancyBarMismatch")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCorrectionNotes(t("templateIllegibleText"))}
                            className="rounded-md border border-yellow-300 bg-yellow-100/70 px-2 py-1 text-[11px] font-medium text-yellow-900 transition-colors hover:bg-yellow-200 dark:border-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-200 dark:hover:bg-yellow-900/60"
                          >
                            {t("discrepancyIllegible")}
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={correctionNotes}
                        onChange={(e) => setCorrectionNotes(e.target.value)}
                        placeholder="e.g. Please upload a higher resolution scan of your bar certificate. The current version is too blurry to verify."
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 outline-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => { if (correctionNotes.trim().length < 10) { toast.error(t("minChars")); return; } correctionsMutation.mutate(correctionNotes.trim()); }}
                          disabled={correctionsMutation.isPending || correctionNotes.trim().length < 10}
                          className="bg-yellow-600 text-white hover:bg-yellow-700"
                        >
                          {t("confirmCorrections")}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowCorrectionsForm(false); setCorrectionNotes(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </CardContent>
          </Card>

          {/* RECENT BOOKINGS */}
          {expert.recentBookings.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <TrendingUp size={15} className="text-primary" />
                <h2 className="font-semibold text-foreground">{t("bookings")}</h2>
                <span className="ml-auto text-xs text-muted-foreground">Last {expert.recentBookings.length}</span>
              </div>
              <div className="divide-y divide-border">
                {expert.recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.citizen.fullName}</p>
                      <p className="text-xs text-muted-foreground">{b.citizen.email}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge tone={bookingStatusTone(b.status)}>
                        {b.status}
                      </StatusBadge>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(b.scheduledStart).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* SUSPEND MODAL */}
      <Dialog open={showSuspendModal} onOpenChange={(open) => {
        if (!open) {
          setShowSuspendModal(false);
          setSuspendReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suspendExpert")}</DialogTitle>
            <DialogDescription>
              {t("confirmSuspension")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Provide a detailed reason (minimum 10 characters)..."
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 outline-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSuspendModal(false); setSuspendReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (suspendReason.trim().length < 10) return; suspendMutation.mutate({ reason: suspendReason }); }}
              disabled={suspendReason.trim().length < 10 || suspendMutation.isPending}
            >
              {t("confirmSuspension")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET TO DRAFT MODAL */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("resetConfirmTitle")}</DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              {t("resetConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetModal(false)}
              disabled={resetMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="default"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              id="btn-confirm-reset-to-draft"
            >
              {resetMutation.isPending && (
                <RefreshCw size={14} className="mr-1.5 animate-spin" />
              )}
              {t("resetConfirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ACCREDITATION & DOCUMENT AUDIT APPROVAL MODAL */}
      <Dialog
        open={showApproveModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowApproveModal(false);
            setChecklist({
              barMatch: false,
              issueDateMatch: false,
              expiryDateMatch: false,
              sealAuthentic: false,
            });
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[96vw] h-[92vh] sm:h-[88vh] max-h-[850px] p-0 flex flex-col overflow-hidden gap-0 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card shrink-0 pr-12">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm font-bold text-foreground">
                    {t("approveModalTitle")}
                  </DialogTitle>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {Object.values(checklist).filter(Boolean).length}/4 Verified
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t("approveModalDesc")}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Tab Switcher (< lg) */}
          <div className="flex lg:hidden border-b border-border bg-muted/40 p-1.5 shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setApproveModalTab("preview")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                approveModalTab === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText size={13} />
              {t("barCertificate")}
            </button>
            <button
              type="button"
              onClick={() => setApproveModalTab("checklist")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                approveModalTab === "checklist"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck size={13} />
              {t("checklistTitle") || "Checklist & Dates"}
            </button>
          </div>

          {/* Split Body */}
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden bg-background">
            {/* Left 7 cols: Embedded Document Preview */}
            <div
              className={cn(
                "lg:col-span-7 h-full flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden bg-muted/15",
                approveModalTab === "preview" ? "flex flex-1" : "hidden lg:flex"
              )}
            >
              <EmbeddedDocumentPreview
                verificationId={expert.verificationId || expert.id}
                objectKey={expert.barCertificateObjectKey}
                label={t("barCertificate")}
                t={t}
              />
              <div className="lg:hidden p-2.5 border-t border-border bg-card flex justify-end shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setApproveModalTab("checklist")}
                  className="w-full text-xs gap-1.5"
                >
                  <span>Continue to Checklist</span>
                  <ArrowRight size={13} />
                </Button>
              </div>
            </div>

            {/* Right 5 cols: Checklist & Confirmed Expiry Date */}
            <div
              className={cn(
                "lg:col-span-5 h-full flex flex-col justify-between overflow-y-auto p-4 sm:p-6 bg-card",
                approveModalTab === "checklist" ? "flex flex-1" : "hidden lg:flex"
              )}
            >
              <div className="space-y-4">
                {/* Practitioner summary */}
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("expert")}:</span>
                    <span className="font-semibold text-foreground">{displayName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("barNumber")}:</span>
                    <span className="font-mono font-bold text-foreground">{expert.barNumber || "--"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("certName")}:</span>
                    <span className="font-medium text-foreground">{latestCert?.certificateName || t("barCertificate")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("certExpiryDate")}:</span>
                    <span className="font-bold text-primary">
                      {effectiveExpiry
                        ? new Date(effectiveExpiry).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
                        : "--"}
                    </span>
                  </div>
                </div>

                {/* Mandatory checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {t("checkListHeader")}
                    </p>
                    <span className="text-[11px] font-medium text-primary">
                      {isChecklistComplete ? "Ready to approve" : "Check all 4"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("checkListSubtext")}
                  </p>

                  <div className="space-y-2 rounded-xl border border-border bg-card p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-foreground select-none">
                      <input
                        type="checkbox"
                        checked={checklist.barMatch}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, barMatch: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{t("checkBarMatch", { barNumber: expert.barNumber || "--" })}</span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-foreground select-none">
                      <input
                        type="checkbox"
                        checked={checklist.issueDateMatch}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, issueDateMatch: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>
                        {t("checkIssueDate", {
                          date: latestCert?.issueDate
                            ? new Date(latestCert.issueDate).toLocaleDateString(locale)
                            : "--",
                        })}
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-foreground select-none">
                      <input
                        type="checkbox"
                        checked={checklist.expiryDateMatch}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, expiryDateMatch: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>
                        {t("checkExpiryDate", {
                          date: effectiveExpiry
                            ? new Date(effectiveExpiry).toLocaleDateString(locale)
                            : "--",
                        })}
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-foreground select-none">
                      <input
                        type="checkbox"
                        checked={checklist.sealAuthentic}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, sealAuthentic: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{t("checkSeal")}</span>
                    </label>
                  </div>
                </div>

                {/* Editable Confirmed Expiry Date */}
                <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3">
                  <Label htmlFor="confirmedExpiryDate" className="text-xs font-semibold text-foreground">
                    {t("confirmedExpiryDateLabel")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmedExpiryDate"
                    type="date"
                    value={confirmedExpiryDate}
                    onChange={(e) => setConfirmedExpiryDate(e.target.value)}
                    className="bg-card text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("confirmedExpiryDateHint")}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApproveModal(false)}
                  disabled={approveMutation.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!isChecklistComplete) return;
                    approveMutation.mutate(confirmedExpiryDate);
                  }}
                  disabled={!isChecklistComplete || approveMutation.isPending}
                  className="bg-green-600 text-white hover:bg-green-700 gap-1.5"
                >
                  {approveMutation.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <BadgeCheck size={14} />
                  )}
                  {t("confirmAndApproveBtn")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREDENTIAL AUDIT / BACKFILL MODAL (Track 1 — Split-Pane Workstation) */}
      <Dialog
        open={showCredentialAuditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCredentialAuditModal(false);
            setCredAuditForm({ certificateName: "", issuer: "", issueDate: "", expiryDate: "", auditNote: "" });
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[96vw] h-[92vh] sm:h-[88vh] max-h-[850px] p-0 flex flex-col overflow-hidden gap-0 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card shrink-0 pr-12">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  {effectiveExpiry ? t("updateCredentialDatesModalTitle") : t("auditSetDatesModalTitle")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {effectiveExpiry ? t("updateCredentialDatesModalDesc") : t("auditSetDatesModalDesc")}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Tab Switcher (< lg) */}
          <div className="flex lg:hidden border-b border-border bg-muted/40 p-1.5 shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setAuditModalTab("preview")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                auditModalTab === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText size={13} />
              {t("barCertificate")}
            </button>
            <button
              type="button"
              onClick={() => setAuditModalTab("form")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                auditModalTab === "form"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar size={13} />
              {effectiveExpiry ? t("updateCredentialDatesBtn") : t("auditSetDatesBtn")}
            </button>
          </div>

          {/* Split Body */}
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden bg-background">
            {/* Left 7 cols: Embedded Document Preview */}
            <div
              className={cn(
                "lg:col-span-7 h-full flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden bg-muted/15",
                auditModalTab === "preview" ? "flex flex-1" : "hidden lg:flex"
              )}
            >
              <EmbeddedDocumentPreview
                verificationId={expert.verificationId || expert.id}
                objectKey={expert.barCertificateObjectKey}
                label={t("barCertificate")}
                t={t}
              />
              <div className="lg:hidden p-2.5 border-t border-border bg-card flex justify-end shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAuditModalTab("form")}
                  className="w-full text-xs gap-1.5"
                >
                  <span>Continue to Record Dates</span>
                  <ArrowRight size={13} />
                </Button>
              </div>
            </div>

            {/* Right 5 cols: Credential Form */}
            <div
              className={cn(
                "lg:col-span-5 h-full flex flex-col justify-between overflow-y-auto p-4 sm:p-6 bg-card",
                auditModalTab === "form" ? "flex flex-1" : "hidden lg:flex"
              )}
            >
              <div className="space-y-4">
                {/* Expert Summary */}
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("expert")}:</span>
                    <span className="font-semibold text-foreground">{displayName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("barNumber")}:</span>
                    <span className="font-mono font-bold text-foreground">{expert.barNumber || "--"}</span>
                  </div>
                  {effectiveExpiry && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("certExpiryDate")}:</span>
                      <span className="font-bold text-primary">
                        {new Date(effectiveExpiry).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Audit notice */}
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30 p-3 text-xs">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
                    {t("auditSetDatesNotice")}
                  </p>
                </div>

                {/* Certificate Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="credAuditCertName" className="text-xs font-semibold text-foreground">
                    {t("certName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="credAuditCertName"
                    value={credAuditForm.certificateName}
                    onChange={(e) => setCredAuditForm((p) => ({ ...p, certificateName: e.target.value }))}
                    placeholder="e.g. Rwanda Bar Practicing Certificate"
                    className="text-xs bg-background"
                  />
                </div>

                {/* Issuing Authority */}
                <div className="space-y-1.5">
                  <Label htmlFor="credAuditIssuer" className="text-xs font-semibold text-foreground">
                    {t("certIssuer")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="credAuditIssuer"
                    value={credAuditForm.issuer}
                    onChange={(e) => setCredAuditForm((p) => ({ ...p, issuer: e.target.value }))}
                    placeholder="e.g. Rwanda Bar Association"
                    className="text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Issue Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="credAuditIssueDate" className="text-xs font-semibold text-foreground">
                      {t("certIssueDate")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="credAuditIssueDate"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={credAuditForm.issueDate}
                      onChange={(e) => setCredAuditForm((p) => ({ ...p, issueDate: e.target.value }))}
                      className="text-xs bg-background"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="credAuditExpiryDate" className="text-xs font-semibold text-foreground">
                      {t("certExpiryDate")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="credAuditExpiryDate"
                      type="date"
                      min={credAuditForm.issueDate || new Date().toISOString().split("T")[0]}
                      value={credAuditForm.expiryDate}
                      onChange={(e) => setCredAuditForm((p) => ({ ...p, expiryDate: e.target.value }))}
                      className="text-xs bg-background"
                    />
                  </div>
                </div>

                {/* Audit Note */}
                <div className="space-y-1.5">
                  <Label htmlFor="credAuditNote" className="text-xs font-semibold text-muted-foreground">
                    {t("auditNote")} <span className="text-[10px] font-normal">({t("optional")})</span>
                  </Label>
                  <Input
                    id="credAuditNote"
                    value={credAuditForm.auditNote}
                    onChange={(e) => setCredAuditForm((p) => ({ ...p, auditNote: e.target.value }))}
                    placeholder={t("auditNotePlaceholder")}
                    className="text-xs bg-background"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCredentialAuditModal(false)}
                  disabled={credentialAuditMutation.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const { certificateName, issuer, issueDate, expiryDate } = credAuditForm;
                    if (!certificateName.trim() || !issuer.trim() || !issueDate || !expiryDate) {
                      toast.error(t("allFieldsRequired"));
                      return;
                    }
                    if (expiryDate <= issueDate) {
                      toast.error(t("expiryAfterIssue"));
                      return;
                    }
                    credentialAuditMutation.mutate();
                  }}
                  disabled={
                    credentialAuditMutation.isPending ||
                    !credAuditForm.certificateName ||
                    !credAuditForm.issuer ||
                    !credAuditForm.issueDate ||
                    !credAuditForm.expiryDate
                  }
                  className="bg-amber-600 text-white hover:bg-amber-700 gap-1.5"
                >
                  {credentialAuditMutation.isPending ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  {t("confirmSetDatesBtn")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standalone Inspection Document Viewer */}
      {auditViewerKey && expert.verificationId && (
        <DocumentViewer
          verificationId={expert.verificationId}
          objectKey={auditViewerKey}
          label={t("barCertificate")}
          onClose={() => setAuditViewerKey(null)}
          t={t}
        />
      )}
    </div>
  );
}
