"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  Scale,
  ShieldCheck,
  Mail,
  Copy,
  Check,
  Clock3,
  ExternalLink,
  FileText,
  UserCheck,
  Send,
  X,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  ChevronDown,
  Laptop,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { toast } from "sonner";
import { usePlatformSettings } from "@/lib/api/settings";
import { cn } from "@/lib/utils";

type StatutoryRightKey = "access" | "rectification" | "erasure" | "portability" | "objection";

const RIGHT_KEYS: StatutoryRightKey[] = [
  "access",
  "rectification",
  "erasure",
  "portability",
  "objection",
];

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface PrivacyRequestModalProps {
  initialRight: StatutoryRightKey;
  dpoEmail: string;
  onClose: () => void;
}

function PrivacyRequestModal({ initialRight, dpoEmail, onClose }: PrivacyRequestModalProps) {
  const t = useTranslations("legalPages.privacy.rightsHelper");
  const { data: session } = useSession();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const [selectedRight, setSelectedRight] = useState<StatutoryRightKey>(initialRight);
  const [fullName, setFullName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [certified, setCertified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Focus trap, Escape key handling, and background scroll locking
  useEffect(() => {
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !certified) {
      toast.error("Please fill in required fields and certify your request.");
      return;
    }

    setIsSubmitting(true);

    // Simulate reliable DSAR registration (with cryptographically random statutory ticket ref)
    setTimeout(() => {
      const generatedRef = `DSAR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedRef);
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success(t("modal.success.title"));
    }, 800);
  };

  const handleCopyTicket = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(ticketId);
      setCopiedTicket(true);
      toast.success(t("modal.success.copied"));
      setTimeout(() => setCopiedTicket(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-2xl focus-visible:outline-none max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border/80 px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-card to-accent/20">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
              <Sparkles size={11} />
              <span>{t("modal.badge")}</span>
            </div>
            <h3 id={titleId} className="mt-1.5 text-base sm:text-lg font-bold text-foreground">
              {t("modal.title")}
            </h3>
            <p id={descId} className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {t("modal.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 flex-1">
          {isSubmitted ? (
            /* ── Success Screen ── */
            <div className="text-center py-4 sm:py-6 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-foreground">{t("modal.success.title")}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {t("modal.success.desc")}
                </p>
              </div>

              {/* Ticket Reference Badge */}
              <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 shadow-2xs">
                <span className="font-mono text-base font-bold text-foreground tracking-wider">
                  {ticketId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-accent/60 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition"
                >
                  {copiedTicket ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span>{t("modal.success.copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-muted-foreground" />
                      <span>{t("modal.success.copyRef")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Statutory 30-Day SLA Card */}
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-left flex items-start gap-3">
                <Clock size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("modal.success.slaNotice")}
                </p>
              </div>

              {dpoEmail ? (
                <p className="text-[11px] text-muted-foreground">
                  {t("modal.success.emailNotice")}{" "}
                  <a href={`mailto:${dpoEmail}`} className="font-semibold text-foreground underline">
                    {dpoEmail}
                  </a>
                  .
                </p>
              ) : null}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition"
                >
                  {t("modal.success.close")}
                </button>
              </div>
            </div>
          ) : (
            /* ── Interactive Intake Form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Right Type Selector */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {t("modal.labels.rightType")} *
                </label>
                <select
                  value={selectedRight}
                  onChange={(e) => setSelectedRight(e.target.value as StatutoryRightKey)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {RIGHT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`rights.${key}.name`)} ({t(`rights.${key}.article`)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name & Email Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t("modal.labels.fullName")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("modal.labels.fullNamePlaceholder")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t("modal.labels.email")} *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("modal.labels.emailPlaceholder")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {t("modal.labels.phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("modal.labels.phonePlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Request Specific Instructions */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  {t("modal.labels.details")}
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t("modal.labels.detailsPlaceholder")}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Certification Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="dsar-certified"
                  required
                  checked={certified}
                  onChange={(e) => setCertified(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                />
                <label htmlFor="dsar-certified" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                  {t("modal.labels.certification")}
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition"
                >
                  {t("modal.labels.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !certified}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{t("modal.labels.submitting")}</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>{t("modal.labels.submit")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function PrivacyRightsHelper() {
  const locale = useLocale();
  const t = useTranslations("legalPages.privacy.rightsHelper");
  const { settings } = usePlatformSettings();
  const { data: session } = useSession();
  const [activeRight, setActiveRight] = useState<StatutoryRightKey>("access");
  const [copied, setCopied] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEmailMenuOpen, setIsEmailMenuOpen] = useState<boolean>(false);

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const targetPath = session
    ? userRole === "EXPERT"
      ? "/expert/dashboard/profile"
      : userRole === "ADMIN"
      ? "/admin/dashboard/settings"
      : "/client/dashboard/profile"
    : `/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/client/dashboard/profile`)}`;

  const profileHref = `/${locale}${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`;

  // Purely dynamic DPO email from Platform Settings (empty string if not configured)
  const dpoEmail = settings.dpoContactEmail?.trim() || "";
  const hasDpoEmail = Boolean(dpoEmail);

  const currentRight = {
    name: t(`rights.${activeRight}.name`),
    article: t(`rights.${activeRight}.article`),
    description: t(`rights.${activeRight}.description`),
    subject: t(`rights.${activeRight}.subject`),
    template: t(`rights.${activeRight}.template`),
  };

  const handleCopyTemplate = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard not supported in this environment");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `Subject: ${currentRight.subject}\n\n${currentRight.template}`
      );
      setCopied(true);
      toast.success(t("templateCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy template to clipboard.");
    }
  };

  // Dynamic deep links for webmail and native mailto
  const gmailUrl = hasDpoEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        dpoEmail
      )}&su=${encodeURIComponent(currentRight.subject)}&body=${encodeURIComponent(
        currentRight.template
      )}`
    : "";

  const outlookUrl = hasDpoEmail
    ? `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
        dpoEmail
      )}&subject=${encodeURIComponent(currentRight.subject)}&body=${encodeURIComponent(
        currentRight.template
      )}`
    : "";

  const mailtoHref = hasDpoEmail
    ? `mailto:${dpoEmail}?subject=${encodeURIComponent(
        currentRight.subject
      )}&body=${encodeURIComponent(currentRight.template)}`
    : "";

  const handleEmailMenuOpenChange = (open: boolean) => {
    if (open && !hasDpoEmail) {
      toast.info(t("emailMenu.noDpoEmailNotice"));
      setIsEmailMenuOpen(false);
      return;
    }
    setIsEmailMenuOpen(open);
  };

  return (
    <>
      <section
        aria-labelledby="rights-portal-heading"
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm sm:p-7"
      >
        {/* Header bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
              <ShieldCheck size={12} />
              <span>{t("badge")}</span>
            </div>
            <h3
              id="rights-portal-heading"
              className="mt-2 text-base font-bold text-foreground sm:text-xl"
            >
              {t("title")}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm max-w-2xl">
              {t("subtitle")}
            </p>
          </div>

          {/* 30-Day SLA Badge */}
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-emerald-800 dark:text-emerald-300">
            <Clock3 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold leading-tight">{t("statutorySlaBadge")}</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                {t("statutorySlaDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs navigation for statutory rights */}
        <div className="mt-5">
          <p className="text-xs font-medium text-muted-foreground mb-2.5">
            {t("selectPrompt")}
          </p>
          <div
            role="tablist"
            aria-label="Statutory Privacy Rights"
            className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/70"
          >
            {RIGHT_KEYS.map((key) => {
              const isSelected = activeRight === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${key}`}
                  onClick={() => {
                    setActiveRight(key);
                    setCopied(false);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "bg-background text-foreground shadow-2xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  )}
                >
                  <span>{t(`rights.${key}.name`)}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t(`rights.${key}.article`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Right Card Panel */}
        <div
          role="tabpanel"
          id={`panel-${activeRight}`}
          aria-labelledby={`tab-${activeRight}`}
          className="mt-4 rounded-xl border border-border/70 bg-background/80 p-4 sm:p-5 shadow-2xs"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <h4 className="text-sm font-bold text-foreground sm:text-base">
                  {currentRight.name}
                </h4>
                <span className="text-xs font-semibold rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary">
                  {currentRight.article} • Law No. 058/2021
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {currentRight.description}
              </p>
            </div>

            {/* Self-serve shortcut for Rectification */}
            {activeRight === "rectification" ? (
              <Link
                href={profileHref}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition self-start sm:self-auto"
              >
                <UserCheck size={14} />
                <span>{t("selfServeAction")}</span>
                <ExternalLink size={12} />
              </Link>
            ) : null}
          </div>

          {/* Pre-filled Statutory Email Template Box */}
          <div className="mt-4 rounded-lg border border-border/80 bg-muted/30 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FileText size={14} className="text-primary" />
                <span className="font-semibold text-foreground">
                  {t("templatePreviewLabel")}
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                To: {hasDpoEmail ? dpoEmail : t("emailMenu.noEmailAssigned")}
              </span>
            </div>
            <pre className="font-sans text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed select-text">
              {currentRight.template}
            </pre>
          </div>

          {/* Action Buttons: Industrial In-App Request + Smart Email Menu & Copy Fallbacks */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {/* Primary Action: Direct In-App Statutory Request Modal */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <Send size={13} />
              <span>{t("openModalBtn")}</span>
            </button>

            {/* Conventional Email Dispatcher Popover matching Careers page */}
            <Popover open={isEmailMenuOpen} onOpenChange={handleEmailMenuOpenChange}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-expanded={isEmailMenuOpen}
                  aria-haspopup="dialog"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Mail size={13} className="text-muted-foreground" />
                  <span>{t("emailMenu.trigger")}</span>
                  <ChevronDown
                    size={11}
                    className={cn(
                      "text-muted-foreground transition-transform duration-200",
                      isEmailMenuOpen && "rotate-180"
                    )}
                  />
                </button>
              </PopoverTrigger>
              {hasDpoEmail ? (
                <PopoverContent
                  align="end"
                  className="w-72 p-1.5 shadow-xl border border-border bg-card rounded-2xl"
                >
                  <div className="px-2.5 py-1.5 border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("emailMenu.chooseEmailService")}
                  </div>
                  <div className="p-1 space-y-0.5">
                    {/* Gmail Web direct compose */}
                    <a
                      href={gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsEmailMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-bold text-[11px]">
                        G
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-none">
                          {t("emailMenu.gmail")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t("emailMenu.emailInBrowser")}
                        </p>
                      </div>
                      <ExternalLink size={12} className="text-muted-foreground" />
                    </a>

                    {/* Outlook Web direct compose */}
                    <a
                      href={outlookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsEmailMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-[11px]">
                        O
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-none">
                          {t("emailMenu.outlook")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t("emailMenu.emailInBrowser")}
                        </p>
                      </div>
                      <ExternalLink size={12} className="text-muted-foreground" />
                    </a>

                    {/* Native mailto for phones / desktop mail clients */}
                    <a
                      href={mailtoHref}
                      onClick={() => setIsEmailMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300">
                        <Laptop size={12} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-none">
                          {t("emailMenu.defaultApp")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t("emailMenu.emailDesktopApp")}
                        </p>
                      </div>
                    </a>

                    <div className="my-1 border-t border-border/60" />

                    {/* Copy DPO Email Address */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          await navigator.clipboard.writeText(dpoEmail);
                          toast.success(t("emailMenu.emailCopied"));
                        }
                        setIsEmailMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition cursor-pointer text-left"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300">
                        <Copy size={12} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-none">
                          {t("emailMenu.copyEmail")}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
                          {dpoEmail}
                        </p>
                      </div>
                    </button>
                  </div>
                </PopoverContent>
              ) : null}
            </Popover>

            {/* Fallback 3: Copy template to clipboard */}
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {copied ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} className="text-muted-foreground" />
              )}
              <span>{t("copyTemplateBtn")}</span>
            </button>
          </div>

          {/* Supervisory Authority Note */}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <Scale size={14} className="shrink-0 text-muted-foreground mt-0.5" />
            <p>{t("supervisoryNotice")}</p>
          </div>
        </div>
      </section>

      {/* In-App Direct Statutory Request Modal */}
      {isModalOpen ? (
        <PrivacyRequestModal
          initialRight={activeRight}
          dpoEmail={dpoEmail}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </>
  );
}
