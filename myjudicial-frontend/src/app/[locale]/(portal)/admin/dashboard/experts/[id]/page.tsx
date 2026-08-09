"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { toast } from "sonner";
import {
  ArrowLeft,
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
  Clock,
  Shield,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  User,
  ExternalLink,
  Bell,
  RefreshCw,
  Download,
  X,
  BadgeCheck,
  TrendingUp,
  Hash,
} from "lucide-react";

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
  // Verification fields
  verificationId: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  identityDocumentObjectKey?: string | null;
  barCertificateObjectKey?: string | null;
  additionalDocumentKeys: string[];
  // Pre-signed URLs
  barCertificateUrl?: string | null;
  identityDocumentUrl?: string | null;
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

async function approveVerification(verificationId: string) {
  return apiFetch(`/admin-verification/${verificationId}/approve`, { method: "PATCH" });
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

function formatSpecialty(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; Icon: any }> = {
  DRAFT:               { color: "text-slate-600",  bg: "bg-slate-100  dark:bg-slate-800/50 dark:text-slate-400",  label: "Draft",           Icon: Clock        },
  PENDING_VERIFICATION:{ color: "text-amber-700",  bg: "bg-amber-100  dark:bg-amber-900/30 dark:text-amber-400",  label: "Pending Review",  Icon: Clock        },
  VERIFIED:            { color: "text-green-700",  bg: "bg-green-100  dark:bg-green-900/30 dark:text-green-400",  label: "Verified",        Icon: BadgeCheck   },
  REJECTED:            { color: "text-red-700",    bg: "bg-red-100    dark:bg-red-900/30   dark:text-red-400",    label: "Rejected",        Icon: XCircle      },
  SUSPENDED:           { color: "text-red-700",    bg: "bg-red-100    dark:bg-red-900/30   dark:text-red-400",    label: "Suspended",       Icon: Ban          },
};

// ── Document Viewer Sheet ──

function DocumentViewer({
  verificationId,
  objectKey,
  label,
  onClose,
}: {
  verificationId: string;
  objectKey: string;
  label: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDocumentStream(verificationId, objectKey)
      .then((res) => { setUrl(res.url); setMimeType(res.mimeType); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });

    return () => {
      // Cleanup blob URL when modal closes
      if (url) URL.revokeObjectURL(url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId, objectKey]);

  const isImage = mimeType ? mimeType.startsWith("image/") : /\.(jpg|jpeg|png|webp|gif)$/i.test(objectKey);
  const isPdf   = mimeType ? mimeType === "application/pdf" : /\.pdf$/i.test(objectKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/10">
              <FileText size={17} className="text-brand-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{objectKey}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download={objectKey.split('/').pop()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download size={14} /> Download
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-4">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-blue" />
              <p className="text-sm text-slate-500">Loading document…</p>
            </div>
          )}
          {error && (
            <div className="text-center">
              <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm text-slate-600">Could not load document.</p>
              <a href={url ?? "#"} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
                <ExternalLink size={12} /> Open in new tab
              </a>
            </div>
          )}
          {url && !loading && !error && (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={label} className="max-h-full max-w-full rounded-lg object-contain shadow" />
            ) : isPdf ? (
              <iframe src={url} className="h-full w-full rounded-lg" title={label} />
            ) : (
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Preview not available for this file type.</p>
                <a href={url} download={objectKey.split('/').pop()} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90">
                  <ExternalLink size={13} /> Download File

                </a>
              </div>
            )
          )}
        </div>
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
}: {
  label: string;
  objectKey: string | null | undefined;
  required: boolean;
  verificationId: string | null;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const submitted = !!objectKey;

  return (
    <>
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {submitted ? (
            <CheckCircle size={15} className="shrink-0 text-green-500" />
          ) : (
            <XCircle size={15} className={`shrink-0 ${required ? "text-red-400" : "text-slate-300 dark:text-slate-600"}`} />
          )}
          <span className={`text-sm ${submitted ? "text-slate-700 dark:text-slate-300" : required ? "font-medium text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
            {label}
          </span>
          {required && !submitted && (
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:bg-red-950/30 dark:text-red-400">
              Required
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {submitted && verificationId && objectKey && (
            <button
              onClick={() => setViewerOpen(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-blue hover:bg-blue-50 transition-colors dark:hover:bg-blue-950/20"
            >
              <ExternalLink size={11} /> View
            </button>
          )}
          <span className={`text-xs font-medium ${submitted ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"}`}>
            {submitted ? "Submitted" : "Missing"}
          </span>
        </div>
      </div>

      {viewerOpen && objectKey && verificationId && (
        <DocumentViewer
          verificationId={verificationId}
          objectKey={objectKey}
          label={label}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

// ── Stat Card ──

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main Page ──

export default function ExpertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const expertId = params.id as string;

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCorrectionsForm, setShowCorrectionsForm] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");

  const { data: expert, isLoading, error } = useQuery({
    queryKey: ["admin-expert-detail", expertId],
    queryFn: () => fetchExpert(expertId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-expert-detail", expertId] });

  const suspendMutation = useMutation({
    mutationFn: ({ reason }: { reason: string }) => suspendExpert(expertId, reason),
    onSuccess: () => { invalidate(); setShowSuspendModal(false); setSuspendReason(""); toast.success("Expert suspended successfully"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateExpert(expertId),
    onSuccess: () => { invalidate(); toast.success("Expert activated successfully"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveVerification(expert!.verificationId!),
    onSuccess: () => { invalidate(); toast.success("Verification approved — expert is now VERIFIED"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectVerification(expert!.verificationId!, reason),
    onSuccess: () => { invalidate(); setShowRejectForm(false); setRejectReason(""); toast.success("Verification rejected"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const reminderMutation = useMutation({
    mutationFn: () => sendReminder(expertId),
    onSuccess: (res: any) => {
      const missing = res?.data?.missingDocuments as string[] | undefined;
      toast.success(
        missing && missing.length > 0
          ? `Reminder sent. Expert notified about: ${missing.join(", ")}`
          : "Reminder sent successfully"
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const correctionsMutation = useMutation({
    mutationFn: (notes: string) => requestCorrections(expert!.verificationId!, notes),
    onSuccess: () => { invalidate(); setShowCorrectionsForm(false); setCorrectionNotes(""); toast.success("Corrections request sent to expert"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetToDraft(expertId),
    onSuccess: () => { invalidate(); toast.success("Expert reset to DRAFT — they can now resubmit documents"); },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Expert not found</p>
          <Link href="/admin/dashboard/experts" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-blue hover:underline">
            <ArrowLeft size={14} /> Back to Experts
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived state ──

  const statusCfg = STATUS_CONFIG[expert.expertStatus] ?? STATUS_CONFIG.DRAFT;
  const StatusIcon = statusCfg.Icon;
  const displayName = expert.fullName || `${expert.firstName ?? ""} ${expert.lastName ?? ""}`.trim() || expert.email;
  const isSuspended = expert.accountStatus === "SUSPENDED";

  // Build document checklist
  const requiredDocs = [
    { label: "Identity Document", key: expert.identityDocumentObjectKey, required: true },
    { label: "Bar Certificate",   key: expert.barCertificateObjectKey,   required: true },
  ];
  const optionalDocs = [
    { label: "Profile Photo",     key: expert.profileImageObjectKey,     required: false },
    ...expert.additionalDocumentKeys.map((k, i) => ({
      label: `Additional Document ${i + 1}`,
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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      {/* ── Top bar ── */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard/experts"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ArrowLeft size={15} /> Expert Management
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              {isSuspended ? (
                <button
                  onClick={() => activateMutation.mutate()}
                  disabled={activateMutation.isPending}
                  id="btn-activate-expert"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {activateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Activate Account
                </button>
              ) : (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  id="btn-suspend-expert"
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Ban size={14} /> Suspend Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ══ LEFT COLUMN ══ */}
          <div className="space-y-5 lg:col-span-1">

            {/* Expert Overview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-900">
              {/* Avatar / Photo */}
              <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-blue to-blue-400 flex items-center justify-center text-3xl font-bold text-white shadow">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h1>
                  {expert.displayName && expert.displayName !== displayName && (
                    <p className="text-sm text-slate-500">{expert.displayName}</p>
                  )}
                  {expert.firmName && (
                    <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                      <Briefcase size={12} /> {expert.firmName}
                    </p>
                  )}
                </div>
                {/* Status badges */}
                <div className="flex flex-wrap justify-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                    <StatusIcon size={11} /> {statusCfg.label}
                  </span>
                  {isSuspended && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <Ban size={11} /> Suspended
                    </span>
                  )}
                </div>
                {expert.avgRating != null && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} className="fill-current" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{expert.avgRating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">({expert.totalReviews} reviews)</span>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <Mail size={13} className="shrink-0 text-slate-400" /> {expert.email}
                  </div>
                  {expert.phone && (
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                      <Phone size={13} className="shrink-0 text-slate-400" /> {expert.phone}
                    </div>
                  )}
                  {expert.officeAddress && (
                    <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-slate-400" />
                      <span>{expert.officeAddress}{expert.city ? `, ${expert.city}` : ""}{expert.country ? `, ${expert.country}` : ""}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Details */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Professional</h3>
                <div className="space-y-2 text-sm">
                  {expert.barNumber && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500"><Hash size={12} /> Bar Number</span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{expert.barNumber}</span>
                    </div>
                  )}
                  {expert.yearsOfExperience != null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500"><Briefcase size={12} /> Experience</span>
                      <span className="text-slate-800 dark:text-slate-200">{expert.yearsOfExperience} yrs</span>
                    </div>
                  )}
                  {expert.baseConsultationFee != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Base Fee</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {expert.baseConsultationFee.toLocaleString()} {expert.currency ?? "RWF"}
                      </span>
                    </div>
                  )}
                  {expert.primarySpecialty && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Primary</span>
                      <span className="text-xs font-medium text-brand-blue">{formatSpecialty(expert.primarySpecialty)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specialties */}
              {expert.specialties.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Specialties</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {expert.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                        {formatSpecialty(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {expert.languages.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Languages</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {expert.languages.map((l) => (
                      <span key={l} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        <Globe size={10} /> {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Meta */}
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Calendar size={11} /> Joined</span>
                  <span>{new Date(expert.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {expert.lastLoginAt && (
                  <div className="flex items-center justify-between">
                    <span>Last Login</span>
                    <span>{new Date(expert.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Expert ID</span>
                  <span className="font-mono">{expert.id.slice(0, 8)}…</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {expert.bio && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-900">
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Bio</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{expert.bio}</p>
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="space-y-5 lg:col-span-2">

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Bookings"  value={expert.totalBookings}  />
              <StatCard label="Total Reviews"   value={expert.totalReviews}   />
              <StatCard label="Avg Rating"      value={expert.avgRating != null ? expert.avgRating.toFixed(1) : "—"} sub="out of 5" />
              <StatCard label="Total Earnings"  value={`${(expert.totalEarnings ?? 0).toLocaleString()} ${expert.currency ?? "RWF"}`} />
            </div>

            {/* ══ VERIFICATION PANEL ══ */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-gray-900 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10">
                    <Shield size={16} className="text-brand-blue" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Verification</h2>
                    <p className="text-xs text-slate-500">
                      {expert.verificationStatus
                        ? `Status: ${expert.verificationStatus}`
                        : "No verification submitted"}
                    </p>
                  </div>
                </div>
                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
              </div>

              <div className="p-6 space-y-6">

                {/* Document checklist */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                    <FileText size={14} className="text-brand-blue" /> Document Checklist
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-900/50">
                    {allDocs.map((doc) => (
                      <DocRow
                        key={doc.label}
                        label={doc.label}
                        objectKey={doc.key}
                        required={doc.required}
                        verificationId={expert.verificationId}
                      />
                    ))}
                  </div>
                </section>

                {/* Missing documents banner */}
                {!isVerified && missingRequired.length > 0 && (
                  <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Missing Required Documents</p>
                        <ul className="mt-1.5 space-y-1">
                          {missingRequired.map((d) => (
                            <li key={d} className="text-xs text-amber-700 dark:text-amber-400">• {d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}

                {/* All docs present banner */}
                {!isVerified && allRequiredPresent && isPending && (
                  <section className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={16} className="shrink-0 text-green-600" />
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                        All required documents submitted — ready for approval
                      </p>
                    </div>
                  </section>
                )}

                {/* Rejection reason */}
                {isRejected && expert.rejectionReason && (
                  <section className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-400 mb-2">Rejection Reason</p>
                    <p className="text-sm text-red-800 dark:text-red-300">{expert.rejectionReason}</p>
                  </section>
                )}

                {/* ══ VERIFICATION ACTIONS ══ */}
                {!isVerified && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Actions</h3>

                    {/* Primary action buttons */}
                    <div className="flex flex-wrap gap-2">

                      {/* Approve — only when all required docs present and PENDING */}
                      {isPending && allRequiredPresent && !showRejectForm && !showCorrectionsForm && (
                        <button
                          onClick={() => approveMutation.mutate()}
                          disabled={approveMutation.isPending}
                          id="btn-approve-verification"
                          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {approveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                          Approve Verification
                        </button>
                      )}

                      {/* Request Corrections */}
                      {isPending && !showRejectForm && !showCorrectionsForm && (
                        <button
                          onClick={() => setShowCorrectionsForm(true)}
                          id="btn-request-corrections"
                          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20"
                        >
                          <AlertTriangle size={14} /> Request Corrections
                        </button>
                      )}

                      {/* Reject */}
                      {isPending && !showRejectForm && !showCorrectionsForm && (
                        <button
                          onClick={() => setShowRejectForm(true)}
                          id="btn-reject-verification"
                          className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      )}

                      {/* Send Reminder — when docs missing */}
                      {!isPending || missingRequired.length > 0 ? (
                        !showRejectForm && !showCorrectionsForm && (
                          <button
                            onClick={() => reminderMutation.mutate()}
                            disabled={reminderMutation.isPending}
                            id="btn-send-reminder"
                            className="inline-flex items-center gap-2 rounded-lg border border-brand-blue px-4 py-2 text-sm font-medium text-brand-blue hover:bg-brand-blue/5 disabled:opacity-50 dark:hover:bg-brand-blue/10"
                          >
                            {reminderMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                            Send Reminder
                          </button>
                        )
                      ) : null}

                      {/* Reset to Draft — when REJECTED */}
                      {isRejected && !showRejectForm && !showCorrectionsForm && (
                        <button
                          onClick={() => resetMutation.mutate()}
                          disabled={resetMutation.isPending}
                          id="btn-reset-to-draft"
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          {resetMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          Allow Resubmission
                        </button>
                      )}
                    </div>

                    {/* Reject Form */}
                    {showRejectForm && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3 dark:border-red-800 dark:bg-red-950/20">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-200">Rejection reason <span className="font-normal text-red-600">(will be emailed to the expert)</span></p>
                        <textarea
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. The uploaded identity document is not legible. Please resubmit a clear, high-resolution scan."
                          className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:bg-gray-900 dark:text-white dark:border-red-700"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { if (rejectReason.trim().length < 10) { toast.error("Please enter at least 10 characters"); return; } rejectMutation.mutate(rejectReason.trim()); }}
                            disabled={rejectMutation.isPending || rejectReason.trim().length < 10}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {rejectMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                            Confirm Rejection
                          </button>
                          <button onClick={() => { setShowRejectForm(false); setRejectReason(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Corrections Form */}
                    {showCorrectionsForm && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3 dark:border-amber-800 dark:bg-amber-950/20">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Correction notes <span className="font-normal text-amber-600">(will be emailed to the expert)</span></p>
                        <textarea
                          rows={3}
                          value={correctionNotes}
                          onChange={(e) => setCorrectionNotes(e.target.value)}
                          placeholder="e.g. Please upload a higher resolution scan of your bar certificate. The current version is too blurry to verify."
                          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:bg-gray-900 dark:text-white dark:border-amber-700"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { if (correctionNotes.trim().length < 10) { toast.error("Please enter at least 10 characters"); return; } correctionsMutation.mutate(correctionNotes.trim()); }}
                            disabled={correctionsMutation.isPending || correctionNotes.trim().length < 10}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            {correctionsMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
                            Send Corrections Request
                          </button>
                          <button onClick={() => { setShowCorrectionsForm(false); setCorrectionNotes(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>

            {/* ══ RECENT BOOKINGS ══ */}
            {expert.recentBookings.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-gray-900">
                <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                  <TrendingUp size={15} className="text-brand-blue" />
                  <h2 className="font-semibold text-slate-900 dark:text-white">Recent Bookings</h2>
                  <span className="ml-auto text-xs text-slate-400">Last {expert.recentBookings.length}</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expert.recentBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{b.citizen.fullName}</p>
                        <p className="text-xs text-slate-400">{b.citizen.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          b.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : b.status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {b.status}
                        </span>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {new Date(b.scheduledStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ SUSPEND MODAL ══ */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Suspend Expert Account</h3>
            <p className="mt-1 text-sm text-slate-500">
              You are about to suspend <span className="font-medium text-slate-800 dark:text-white">{displayName}</span>.
              They will be hidden from the map and unable to receive new bookings.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Provide a detailed reason (minimum 10 characters)…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-slate-100 dark:border-slate-700"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowSuspendModal(false); setSuspendReason(""); }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (suspendReason.trim().length < 10) return; suspendMutation.mutate({ reason: suspendReason }); }}
                disabled={suspendReason.trim().length < 10 || suspendMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {suspendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
