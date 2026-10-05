"use client";

import { useState, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const OfficeMap = dynamic(
  () => import("@/features/search/components/office-map").then((mod) => mod.OfficeMap),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-muted/30" />,
  }
);
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  Send,
  ShieldCheck,
  Globe2,
  Users,
  UserCheck,
  Building2,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Scale,
  HelpCircle,
  Compass,
  Zap,
  ChevronDown,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { usePlatformSettings } from "@/lib/api/settings";

type DepartmentKey = "client" | "advocate" | "institutional" | "general";

function ContactClientContent() {
  const t = useTranslations("contactPage");
  const { settings } = usePlatformSettings();
  const searchParams = useSearchParams();

  const activeEmail = settings.supportEmail || t("info.email");
  const activeHotline = settings.hotlinePhone || t("office.hotline");
  const activeWhatsapp = settings.whatsappNumber || activeHotline;
  const activeBuilding = settings.officeBuilding || t("office.building");
  const activeStreet = settings.officeStreet || "";
  const activeDistrict = settings.officeDistrict || t("office.district");
  const activePoBox = settings.officePoBox || t("office.poBox");
  const activeHours = settings.supportWorkingHours || t("info.hours");

  // Dynamic Map & WhatsApp URLs
  const mapSearchQuery = encodeURIComponent(
    `${activeBuilding || "Centenary House"}, ${activeDistrict || "Kigali, Rwanda"}`
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${mapSearchQuery}&ll=-1.9452,30.0611`;
  const whatsappText = encodeURIComponent(t("office.whatsappPrefill"));
  const whatsappUrl = `https://wa.me/${activeWhatsapp.replace(/[^0-9]/g, "")}?text=${whatsappText}`;

  // Read URL query parameter "?type=institutional" or "?type=advocate" etc.
  const initialType = searchParams.get("type");
  const defaultDepartment: DepartmentKey =
    initialType === "institutional"
      ? "institutional"
      : initialType === "advocate"
      ? "advocate"
      : initialType === "client"
      ? "client"
      : "general";

  const [department, setDepartment] = useState<DepartmentKey>(defaultDepartment);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+250");
  const [reference, setReference] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [isEmailMenuOpen, setIsEmailMenuOpen] = useState(false);

  // Anti-Bot: Honeypot & speed trap defense
  const formRenderTs = useRef(Date.now()).current;
  const [honeypot, setHoneypot] = useState("");

  // Department metadata
  const departmentConfig: Record<
    DepartmentKey,
    { email: string; title: string; desc: string; icon: typeof Users }
  > = {
    client: {
      email: activeEmail,
      title: t("departments.client.title"),
      desc: t("departments.client.desc"),
      icon: Users,
    },
    advocate: {
      email: activeEmail,
      title: t("departments.advocate.title"),
      desc: t("departments.advocate.desc"),
      icon: UserCheck,
    },
    institutional: {
      email: activeEmail,
      title: t("departments.institutional.title"),
      desc: t("departments.institutional.desc"),
      icon: Building2,
    },
    general: {
      email: activeEmail,
      title: t("form.categories.general"),
      desc: t("hero.subtitle"),
      icon: MessageSquare,
    },
  };

  const handleCopy = async (text: string, type: "ticket" | "email") => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      if (type === "ticket") {
        setCopiedTicket(true);
        toast.success(t("actions.ticketCopied"));
        setTimeout(() => setCopiedTicket(false), 2000);
      } else {
        setCopiedEmail(text);
        toast.success(t("actions.emailCopied"));
        setTimeout(() => setCopiedEmail(null), 2000);
      }
    } catch {
      if (type === "ticket") {
        setCopiedTicket(true);
        setTimeout(() => setCopiedTicket(false), 2000);
      } else {
        setCopiedEmail(text);
        setTimeout(() => setCopiedEmail(null), 2000);
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = t("validation.nameRequired");
    }
    if (!email.trim()) {
      errs.email = t("validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = t("validation.emailInvalid");
    }
    if (!subject.trim()) {
      errs.subject = t("validation.subjectRequired");
    }
    if (!message.trim()) {
      errs.message = t("validation.messageRequired");
    } else if (message.trim().length < 10) {
      errs.message = t("validation.messageMinLength");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
      const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1").replace(/\/+$/, "");
      const res = await fetch(`${base}${prefix}/content/contact/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim() ? `${countryCode} ${phone.trim()}` : undefined,
          department,
          reference: reference.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          website_url: honeypot.trim() || undefined,
          _form_render_ts: formRenderTs,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || t("form.submitError"));
      }

      const payload = await res.json();
      const newTicketId =
        payload?.data?.ticketId ||
        `MJ-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      setTicketId(newTicketId);
      setIsSubmitted(true);
      toast.success(t("form.successTitle"));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : t("form.submitError");
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setName("");
    setEmail("");
    setPhone("");
    setCountryCode("+250");
    setReference("");
    setSubject("");
    setMessage("");
    setErrors({});
  };

  const currentDept = departmentConfig[department];

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-12 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-3 min-[360px]:px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3.5 sm:mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Mail size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span className="truncate">{t("hero.badge")}</span>
            </div>

            <h1 className="text-2xl min-[360px]:text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.16] sm:leading-[1.12] text-balance break-words">
              {t("hero.title")}
            </h1>

            <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Institutional Trust Badges */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 max-w-4xl mx-auto text-left">
            <div className="flex items-start sm:items-center gap-3.5 rounded-2xl border border-border bg-card/60 p-3.5 sm:p-4 shadow-2xs min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Clock size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">{t("trustPillars.sla")}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed break-words mt-0.5">{t("trustPillars.slaDesc")}</p>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3.5 rounded-2xl border border-border bg-card/60 p-3.5 sm:p-4 shadow-2xs min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <ShieldCheck size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">{t("trustPillars.compliance")}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed break-words mt-0.5">{t("trustPillars.complianceDesc")}</p>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3.5 rounded-2xl border border-border bg-card/60 p-3.5 sm:p-4 shadow-2xs min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Globe2 size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">{t("trustPillars.languages")}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed break-words mt-0.5">{t("trustPillars.languagesDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Operations & Form Section ──────────────────────── */}
      <section className="bg-background py-10 sm:py-20">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 items-start">
            
            {/* Left Column: Direct Operations & Physical Presence (5 cols) */}
            <div className="lg:col-span-5">
              
              {/* Kigali Headquarters & Operations Desk Card */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-6">
                
                {/* Header: Office title & P.O. Box */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <MapPin size={17} className="text-foreground shrink-0" />
                    <h2 className="text-base font-bold text-foreground">{t("office.title")}</h2>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground font-mono">
                    {activePoBox}
                  </span>
                </div>

                {/* Physical Address Block */}
                <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground text-sm break-words">{activeBuilding}</p>
                  <p className="break-words">{activeStreet ? `${activeStreet}, ` : ""}{activeDistrict}</p>
                  <p className="text-[11px] text-muted-foreground italic break-words">
                    {t("office.landmark")}
                  </p>
                </div>

                {/* Direct Real-Time Communication Lines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`tel:${activeHotline.replace(/\s+/g, "")}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 text-left hover:bg-muted/40 transition shadow-2xs"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("office.title")}
                      </p>
                      <p className="text-xs font-bold text-foreground truncate">{activeHotline}</p>
                    </div>
                  </a>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 text-left hover:bg-muted/40 transition shadow-2xs"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                      <MessageSquare size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        WhatsApp
                      </p>
                      <p className="text-xs font-bold text-foreground truncate">{activeWhatsapp}</p>
                    </div>
                  </a>
                </div>

                {/* Interactive Map with Verified Location Overlay */}
                <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-border bg-muted/20">
                  <OfficeMap
                    latitude={-1.9452}
                    longitude={30.0611}
                    label={activeBuilding}
                    className="h-full w-full"
                  />

                  {/* Floating Tag */}
                  <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/95 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-foreground shadow-2xs">
                    <MapPin size={12} className="text-foreground shrink-0" />
                    <span>{t("office.mapBadge")}</span>
                  </div>
                </div>

                {/* Visiting Guidelines Notice */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("info.appointmentNotice")}
                </p>

                {/* External Directions Links */}
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-2.5">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition text-center shadow-2xs"
                  >
                    <span>{t("office.openGoogleMaps")}</span>
                    <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                  </a>

                  <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition text-center shadow-2xs"
                  >
                    <span>{t("office.openAppleMaps")}</span>
                    <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                  </a>
                </div>

                {/* Working Hours */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-foreground shrink-0" />
                    <span>{t("labels.hours")}</span>
                  </span>
                  <span className="font-semibold text-foreground text-[11px] sm:text-xs">
                    {activeHours}
                  </span>
                </div>

              </div>
            </div>

            {/* Right Column: Interactive Intake Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-card p-4 min-[360px]:p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden">
                
                {isSubmitted ? (
                  /* ── Success Confirmation Screen ── */
                  <div className="py-6 sm:py-8 text-center space-y-5 sm:space-y-6">
                    <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
                        {t("form.successTitle")}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                        {t("form.successDesc")}:
                      </p>
                    </div>

                    {/* Ticket Reference Badge with Copy Action */}
                    <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xs max-w-full">
                      <span className="font-mono text-sm sm:text-base font-bold text-foreground tracking-wider break-all">
                        {ticketId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(ticketId, "ticket")}
                        aria-label={copiedTicket ? t("actions.copied") : t("actions.copyTicket")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-accent/60 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition"
                      >
                        {copiedTicket ? (
                          <>
                            <Check size={12} />
                            <span>{t("actions.copied")}</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>{t("actions.copy")}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* SLA Notice Box */}
                    <div className="rounded-2xl border border-border bg-muted/30 p-3.5 sm:p-4 max-w-lg mx-auto text-left flex items-start gap-3">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white mt-0.5">
                        <Clock size={16} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        {t("form.successSla")}
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-2xl border border-border bg-background/60 p-3.5 sm:p-4 max-w-lg mx-auto text-left text-xs space-y-2">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">{t("form.categoryLabel")}</span>
                        <span className="font-semibold text-foreground">{currentDept.title}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">{t("form.name")}</span>
                        <span className="font-semibold text-foreground break-all">{name}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">{t("form.email")}</span>
                        <span className="font-semibold text-foreground break-all">{email}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-foreground px-6 py-2.5 text-xs font-bold transition shadow-xs w-full sm:w-auto text-center"
                      >
                        {t("form.sendAnother")}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Interactive Intake Form ── */
                  <form onSubmit={handleSubmit} noValidate className="space-y-5 sm:space-y-6">
                    {/* Anti-Bot: Hidden Honeypot Input */}
                    <div
                      className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0 pointer-events-none"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <label htmlFor="contact-website-hp">Company Website</label>
                      <input
                        type="text"
                        id="contact-website-hp"
                        name="website_url"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
                        {t("form.title")}
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                        {t("form.subtitle")}
                      </p>
                    </div>

                    {/* Department Selector Pills */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 font-mono">
                        {t("form.categoryLabel")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(["client", "advocate", "institutional", "general"] as const).map((key) => {
                          const isActive = department === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setDepartment(key)}
                              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold text-center transition shadow-2xs ${
                                isActive
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              }`}
                            >
                              {t(`form.categories.${key}`)}
                            </button>
                          );
                        })}
                      </div>

                      {/* Routing Recipient Note */}
                      <p className="mt-2 text-[11px] text-muted-foreground break-words">
                        {t("form.directedTo")}{" "}
                        <span className="font-semibold text-foreground">{currentDept.email}</span> ({currentDept.title})
                      </p>
                    </div>

                    {/* Name & Email Row */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="mb-1.5 block text-xs font-bold text-foreground">
                          {t("form.name")} <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          className={`w-full rounded-xl border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition ${
                            errors.name
                              ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
                              : "border-border focus:border-foreground focus:ring-1 focus:ring-foreground"
                          }`}
                          placeholder={t("formPlaceholders.name")}
                        />
                        {errors.name && (
                          <p className="mt-1 text-[11px] font-medium text-destructive">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-foreground">
                          {t("form.email")} <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                          }}
                          className={`w-full rounded-xl border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition ${
                            errors.email
                              ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
                              : "border-border focus:border-foreground focus:ring-1 focus:ring-foreground"
                          }`}
                          placeholder={t("formPlaceholders.email")}
                        />
                        {errors.email && (
                          <p className="mt-1 text-[11px] font-medium text-destructive">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone & Case Reference Row */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="phone" className="mb-1.5 block text-xs font-bold text-foreground">
                          {t("form.phone")}
                        </label>
                        <div className="relative flex rounded-xl border border-border bg-background focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground transition overflow-hidden">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            aria-label={t("form.phoneCountryCode")}
                            className="inline-flex items-center px-2 min-[360px]:px-2.5 py-2 text-xs font-semibold text-foreground border-r border-border bg-muted/20 focus:outline-none cursor-pointer"
                          >
                            <option value="+250">RW +250</option>
                            <option value="+254">KE +254</option>
                            <option value="+256">UG +256</option>
                            <option value="+255">TZ +255</option>
                            <option value="+257">BI +257</option>
                            <option value="+243">CD +243</option>
                            <option value="+33">FR +33</option>
                            <option value="+32">BE +32</option>
                            <option value="+44">UK +44</option>
                            <option value="+1">US +1</option>
                          </select>
                          <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            placeholder={t("formPlaceholders.phone")}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reference" className="mb-1.5 block text-xs font-bold text-foreground">
                          {t("form.reference")}
                        </label>
                        <input
                          type="text"
                          id="reference"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition font-mono"
                          placeholder={t("formPlaceholders.reference")}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="mb-1.5 block text-xs font-bold text-foreground">
                        {t("form.subject")} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => {
                          setSubject(e.target.value);
                          if (errors.subject) setErrors((prev) => ({ ...prev, subject: "" }));
                        }}
                        className={`w-full rounded-xl border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition ${
                          errors.subject
                            ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
                            : "border-border focus:border-foreground focus:ring-1 focus:ring-foreground"
                        }`}
                        placeholder={t("formPlaceholders.subject")}
                      />
                      {errors.subject && (
                        <p className="mt-1 text-[11px] font-medium text-destructive">{errors.subject}</p>
                      )}
                    </div>

                    {/* Message Area with Character Count */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="message" className="block text-xs font-bold text-foreground">
                          {t("form.message")} <span className="text-destructive">*</span>
                        </label>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {message.length} / 2000
                        </span>
                      </div>
                      <textarea
                        id="message"
                        rows={5}
                        maxLength={2000}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (errors.message) setErrors((prev) => ({ ...prev, message: "" }));
                        }}
                        className={`w-full resize-none rounded-xl border bg-background px-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition ${
                          errors.message
                            ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
                            : "border-border focus:border-foreground focus:ring-1 focus:ring-foreground"
                        }`}
                        placeholder={t("formPlaceholders.message")}
                      />
                      {errors.message && (
                        <p className="mt-1 text-[11px] font-medium text-destructive">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit Action */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-8 py-3.5 text-xs sm:text-sm font-bold transition shadow-xs disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>{t("form.submitting")}</span>
                          </>
                        ) : (
                          <>
                            <span>{t("form.submit")}</span>
                            <Send size={15} />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Direct Email Dispatcher (Desktop Mail App, Gmail Web, Outlook.com Web, Copy) */}
                    <div className="pt-3 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{t("form.directEmailNotice")}</span>
                        <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                          {currentDept.email}
                        </span>
                      </div>

                      <Popover open={isEmailMenuOpen} onOpenChange={setIsEmailMenuOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Mail size={13} className="text-muted-foreground" />
                            <span>{t("emailMenu.trigger")}</span>
                            <ChevronDown
                              size={11}
                              className={`text-muted-foreground transition-transform duration-200 ${
                                isEmailMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </PopoverTrigger>
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
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                                currentDept.email
                              )}&su=${encodeURIComponent(
                                subject.trim() || `MyJudicial Inquiry — ${currentDept.title}`
                              )}&body=${encodeURIComponent(
                                [
                                  message.trim() || "[Describe your inquiry here]",
                                  "",
                                  name.trim() ? `Sender: ${name}` : "",
                                  phone.trim() ? `Phone: ${countryCode} ${phone}` : "",
                                  reference.trim() ? `Case/Booking Ref: ${reference}` : "",
                                  "",
                                  "— Sent via MyJudicial Contact Portal",
                                ]
                                  .filter(Boolean)
                                  .join("\n")
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setIsEmailMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-bold text-[11px]">
                                G
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs leading-none">{t("emailMenu.gmail")}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {t("emailMenu.emailInBrowser")}
                                </p>
                              </div>
                              <ExternalLink size={12} className="text-muted-foreground" />
                            </a>

                            {/* Outlook.com Web direct compose */}
                            <a
                              href={`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
                                currentDept.email
                              )}&subject=${encodeURIComponent(
                                subject.trim() || `MyJudicial Inquiry — ${currentDept.title}`
                              )}&body=${encodeURIComponent(
                                [
                                  message.trim() || "[Describe your inquiry here]",
                                  "",
                                  name.trim() ? `Sender: ${name}` : "",
                                  phone.trim() ? `Phone: ${countryCode} ${phone}` : "",
                                  reference.trim() ? `Case/Booking Ref: ${reference}` : "",
                                  "",
                                  "— Sent via MyJudicial Contact Portal",
                                ]
                                  .filter(Boolean)
                                  .join("\n")
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setIsEmailMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-[11px]">
                                O
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs leading-none">{t("emailMenu.outlook")}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {t("emailMenu.emailInBrowser")}
                                </p>
                              </div>
                              <ExternalLink size={12} className="text-muted-foreground" />
                            </a>

                            {/* Default Mail App */}
                            <a
                              href={`mailto:${currentDept.email}?subject=${encodeURIComponent(
                                subject.trim() || `MyJudicial Inquiry — ${currentDept.title}`
                              )}&body=${encodeURIComponent(
                                [
                                  message.trim() || "[Describe your inquiry here]",
                                  "",
                                  name.trim() ? `Sender: ${name}` : "",
                                  phone.trim() ? `Phone: ${countryCode} ${phone}` : "",
                                  reference.trim() ? `Case/Booking Ref: ${reference}` : "",
                                  "",
                                  "— Sent via MyJudicial Contact Portal",
                                ]
                                  .filter(Boolean)
                                  .join("\n")
                              )}`}
                              onClick={() => setIsEmailMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300">
                                <Laptop size={12} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs leading-none">{t("emailMenu.defaultApp")}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {t("emailMenu.emailOnDevice")}
                                </p>
                              </div>
                              <ExternalLink size={12} className="text-muted-foreground" />
                            </a>

                            {/* Copy Email Address */}
                            <button
                              type="button"
                              onClick={() => {
                                handleCopy(currentDept.email, "email");
                                setIsEmailMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-accent transition cursor-pointer"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                <Copy size={12} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs leading-none">
                                  {t("emailMenu.copyEmailAddress")}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                                  {currentDept.email}
                                </p>
                              </div>
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Self-Service Fast-Track Strip ───────────────────────── */}
      <section className="bg-muted/20 py-16 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Zap size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("selfService.badge")}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("selfService.title")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              {t("selfService.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Search Advocates */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                  <Scale size={22} />
                </div>
                <h3 className="text-base font-bold text-foreground">{t("selfService.card1Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("selfService.card1Desc")}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:underline group"
                >
                  <span>{t("selfService.card1Action")}</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Pricing & Escrow */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="text-base font-bold text-foreground">{t("selfService.card2Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("selfService.card2Desc")}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:underline group"
                >
                  <span>{t("selfService.card2Action")}</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: FAQs & Guides */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                  <HelpCircle size={22} />
                </div>
                <h3 className="text-base font-bold text-foreground">{t("selfService.card3Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("selfService.card3Desc")}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href="/faqs"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:underline group"
                >
                  <span>{t("selfService.card3Action")}</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ContactClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ContactClientContent />
    </Suspense>
  );
}
