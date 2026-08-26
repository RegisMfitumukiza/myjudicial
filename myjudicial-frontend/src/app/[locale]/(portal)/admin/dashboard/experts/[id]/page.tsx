"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { toast } from "sonner";
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
} from "lucide-react";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
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
  verificationId: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  identityDocumentObjectKey?: string | null;
  barCertificateObjectKey?: string | null;
  additionalDocumentKeys: string[];
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

function expertStatusTone(status: ExpertStatus): "neutral" | "pending" | "success" | "destructive" {
  switch (status) {
    case "VERIFIED":             return "success";
    case "PENDING_VERIFICATION": return "pending";
    case "REJECTED":
    case "SUSPENDED":            return "destructive";
    default:                     return "neutral";
  }
}

function expertStatusLabel(status: ExpertStatus): string {
  switch (status) {
    case "VERIFIED":             return "Verified";
    case "PENDING_VERIFICATION": return "Pending Review";
    case "REJECTED":             return "Rejected";
    case "SUSPENDED":            return "Suspended";
    default:                     return "Draft";
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
      if (url) URL.revokeObjectURL(url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId, objectKey]);

  const isImage = mimeType ? mimeType.startsWith("image/") : /\.(jpg|jpeg|png|webp|gif)$/i.test(objectKey);
  const isPdf   = mimeType ? mimeType === "application/pdf" : /\.pdf$/i.test(objectKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-card border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <FileText size={17} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{label}</h3>
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download size={14} /> Download
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
        <div className="flex flex-1 items-center justify-center overflow-auto p-4">
          {loading && (
            <LoadingSpinner label="Loading document..." />
          )}
          {error && (
            <div className="text-center">
              <AlertTriangle size={40} className="mx-auto mb-3 text-destructive" />
              <p className="text-sm text-foreground">Could not load document.</p>
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ExternalLink size={12} /> Open in new tab
                </a>
              )}
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
                <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                <a href={url} download={objectKey.split('/').pop()} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
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
              Required
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
              <ExternalLink size={11} /> View
            </Button>
          )}
          <span className={`text-xs font-medium ${submitted ? "text-green-600" : "text-muted-foreground"}`}>
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
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading expert details..." />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader
          title="Expert Details"
          backHref="/admin/dashboard/experts"
          backLabel="Expert Management"
        />
        <ErrorState
          title="Expert not found"
          message={(error as Error)?.message ?? "The expert you are looking for does not exist."}
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/dashboard/experts">Back to Experts</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // ── Derived state ──

  const displayName = expert.fullName || `${expert.firstName ?? ""} ${expert.lastName ?? ""}`.trim() || expert.email;
  const isSuspended = expert.accountStatus === "SUSPENDED";

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
    <div className="space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <PageHeader
        title={displayName}
        backHref="/admin/dashboard/experts"
        backLabel="Expert Management"
        actions={
          isSuspended ? (
            <Button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              id="btn-activate-expert"
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle size={14} /> Activate Account
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setShowSuspendModal(true)}
              id="btn-suspend-expert"
            >
              <Ban size={14} /> Suspend Account
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
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow">
                  {displayName.charAt(0).toUpperCase()}
                </div>
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
                    <StatusBadge tone="destructive">Suspended</StatusBadge>
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
                      <Phone size={13} className="shrink-0 text-muted-foreground" /> {expert.phone}
                    </div>
                  )}
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
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Hash size={12} /> Bar Number</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{expert.barNumber}</span>
                    </div>
                  )}
                  {expert.yearsOfExperience != null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Briefcase size={12} /> Experience</span>
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
              {expert.specialties.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specialties</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {expert.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {formatSpecialty(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {expert.languages.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Languages</h3>
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
                  <span className="font-mono">{expert.id.slice(0, 8)}...</span>
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
            <StatCard label="Total Bookings" value={expert.totalBookings} />
            <StatCard label="Total Reviews" value={expert.totalReviews} />
            <StatCard
              label="Avg Rating"
              value={expert.avgRating != null ? expert.avgRating.toFixed(1) : "--"}
              hint="out of 5"
            />
            <StatCard
              label="Total Earnings"
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
                  <h2 className="font-semibold text-foreground">Verification</h2>
                  <p className="text-xs text-muted-foreground">
                    {expert.verificationStatus
                      ? `Status: ${expert.verificationStatus}`
                      : "No verification submitted"}
                  </p>
                </div>
              </div>
              {isVerified && (
                <StatusBadge tone="success">Verified</StatusBadge>
              )}
            </div>

            <CardContent className="space-y-6 pt-5">

              {/* Document checklist */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText size={14} className="text-primary" /> Document Checklist
                </h3>
                <div className="rounded-xl border border-border bg-muted/50 px-4">
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
                <section className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Missing Required Documents</p>
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
                      All required documents submitted — ready for approval
                    </p>
                  </div>
                </section>
              )}

              {/* Rejection reason */}
              {isRejected && expert.rejectionReason && (
                <section className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2">Rejection Reason</p>
                  <p className="text-sm text-red-800 dark:text-red-300">{expert.rejectionReason}</p>
                </section>
              )}

              {/* VERIFICATION ACTIONS */}
              {!isVerified && (
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Actions</h3>

                  <div className="flex flex-wrap gap-2">

                    {/* Approve */}
                    {isPending && allRequiredPresent && !showRejectForm && !showCorrectionsForm && (
                      <Button
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                        id="btn-approve-verification"
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <BadgeCheck size={14} /> Approve Verification
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
                        <AlertTriangle size={14} /> Request Corrections
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
                        <XCircle size={14} /> Reject
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
                        <Bell size={14} /> Send Reminder
                      </Button>
                    )}

                    {/* Reset to Draft */}
                    {isRejected && !showRejectForm && !showCorrectionsForm && (
                      <Button
                        variant="outline"
                        onClick={() => resetMutation.mutate()}
                        disabled={resetMutation.isPending}
                        id="btn-reset-to-draft"
                      >
                        <RefreshCw size={14} /> Allow Resubmission
                      </Button>
                    )}
                  </div>

                  {/* Reject Form */}
                  {showRejectForm && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-3 dark:border-red-700 dark:bg-red-950/30">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">Rejection reason <span className="font-normal text-destructive">(will be emailed to the expert)</span></p>
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
                          onClick={() => { if (rejectReason.trim().length < 10) { toast.error("Please enter at least 10 characters"); return; } rejectMutation.mutate(rejectReason.trim()); }}
                          disabled={rejectMutation.isPending || rejectReason.trim().length < 10}
                        >
                          Confirm Rejection
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
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Correction notes <span className="font-normal text-yellow-600 dark:text-yellow-400">(will be emailed to the expert)</span></p>
                      <textarea
                        rows={3}
                        value={correctionNotes}
                        onChange={(e) => setCorrectionNotes(e.target.value)}
                        placeholder="e.g. Please upload a higher resolution scan of your bar certificate. The current version is too blurry to verify."
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 outline-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => { if (correctionNotes.trim().length < 10) { toast.error("Please enter at least 10 characters"); return; } correctionsMutation.mutate(correctionNotes.trim()); }}
                          disabled={correctionsMutation.isPending || correctionNotes.trim().length < 10}
                          className="bg-yellow-600 text-white hover:bg-yellow-700"
                        >
                          Send Corrections Request
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
                <h2 className="font-semibold text-foreground">Recent Bookings</h2>
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
                        {new Date(b.scheduledStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
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
            <DialogTitle>Suspend Expert Account</DialogTitle>
            <DialogDescription>
              You are about to suspend <span className="font-medium text-foreground">{displayName}</span>.
              They will be hidden from the map and unable to receive new bookings.
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
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
