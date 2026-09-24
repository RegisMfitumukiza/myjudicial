"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";

type DepartmentKey = "client" | "advocate" | "institutional" | "general";

function ContactClientContent() {
  const t = useTranslations("contactPage");
  const searchParams = useSearchParams();

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
  const [reference, setReference] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Department metadata
  const departmentConfig: Record<
    DepartmentKey,
    { email: string; title: string; desc: string; icon: typeof Users }
  > = {
    client: {
      email: t("departments.client.email"),
      title: t("departments.client.title"),
      desc: t("departments.client.desc"),
      icon: Users,
    },
    advocate: {
      email: t("departments.advocate.email"),
      title: t("departments.advocate.title"),
      desc: t("departments.advocate.desc"),
      icon: UserCheck,
    },
    institutional: {
      email: t("departments.institutional.email"),
      title: t("departments.institutional.title"),
      desc: t("departments.institutional.desc"),
      icon: Building2,
    },
    general: {
      email: t("info.email"),
      title: t("form.categories.general"),
      desc: t("hero.subtitle"),
      icon: MessageSquare,
    },
  };

  const handleCopy = (text: string, type: "ticket" | "email") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
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
      errs.name = "Full name is required";
    }
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!subject.trim()) {
      errs.subject = "Subject is required";
    }
    if (!message.trim()) {
      errs.message = "Message cannot be empty";
    } else if (message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate real network submission & ticket allocation
    setTimeout(() => {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const newTicketId = `MJ-2026-${randomSuffix}`;
      setTicketId(newTicketId);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 650);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setName("");
    setEmail("");
    setPhone("");
    setReference("");
    setSubject("");
    setMessage("");
    setErrors({});
  };

  const currentDept = departmentConfig[department];

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Mail size={14} className="text-foreground shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Institutional Trust Badges */}
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground">
                <Clock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{t("trustPillars.sla")}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t("trustPillars.slaDesc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{t("trustPillars.compliance")}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t("trustPillars.complianceDesc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground">
                <Globe2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{t("trustPillars.languages")}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t("trustPillars.languagesDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Operations & Form Section ──────────────────────── */}
      <section className="bg-background py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 items-start">
            
            {/* Left Column: Direct Operations & Physical Presence (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Department Routing Desk */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h2 className="text-base font-bold text-foreground">{t("info.title")}</h2>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Kigali, RW
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Citizen Support */}
                  <div className="rounded-2xl border border-border/80 bg-background/50 p-4 transition-colors hover:border-foreground/30">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                        <Users size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{t("departments.client.title")}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {t("departments.client.desc")}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <a
                            href={`mailto:${t("departments.client.email")}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
                          >
                            <span>{t("departments.client.email")}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(t("departments.client.email"), "email")}
                            aria-label={`Copy ${t("departments.client.email")}`}
                            className="text-muted-foreground hover:text-foreground transition p-1"
                          >
                            {copiedEmail === t("departments.client.email") ? (
                              <Check size={13} className="text-foreground" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advocate Verification */}
                  <div className="rounded-2xl border border-border/80 bg-background/50 p-4 transition-colors hover:border-foreground/30">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                        <UserCheck size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{t("departments.advocate.title")}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {t("departments.advocate.desc")}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <a
                            href={`mailto:${t("departments.advocate.email")}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
                          >
                            <span>{t("departments.advocate.email")}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(t("departments.advocate.email"), "email")}
                            aria-label={`Copy ${t("departments.advocate.email")}`}
                            className="text-muted-foreground hover:text-foreground transition p-1"
                          >
                            {copiedEmail === t("departments.advocate.email") ? (
                              <Check size={13} className="text-foreground" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Partnerships */}
                  <div className="rounded-2xl border border-border/80 bg-background/50 p-4 transition-colors hover:border-foreground/30">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                        <Building2 size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{t("departments.institutional.title")}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {t("departments.institutional.desc")}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <a
                            href={`mailto:${t("departments.institutional.email")}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
                          >
                            <span>{t("departments.institutional.email")}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(t("departments.institutional.email"), "email")}
                            aria-label={`Copy ${t("departments.institutional.email")}`}
                            className="text-muted-foreground hover:text-foreground transition p-1"
                          >
                            {copiedEmail === t("departments.institutional.email") ? (
                              <Check size={13} className="text-foreground" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Telephone Hotline & WhatsApp */}
                <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="tel:+250788312456"
                    className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left hover:bg-muted/40 transition shadow-2xs"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                      <Phone size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("office.title")}
                      </p>
                      <p className="text-xs font-bold text-foreground truncate">{t("office.hotline")}</p>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/250788312456?text=Hello%20MyJudicial%20Legal%20Operations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left hover:bg-muted/40 transition shadow-2xs"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                      <MessageSquare size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        WhatsApp
                      </p>
                      <p className="text-xs font-bold text-foreground truncate">{t("office.whatsapp")}</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Physical Headquarters & Verified OpenStreetMap */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <MapPin size={17} className="text-foreground shrink-0" />
                    <h3 className="text-base font-bold text-foreground">{t("office.title")}</h3>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground font-mono">
                    {t("office.poBox")}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground">{t("office.building")}</p>
                  <p>{t("office.district")}</p>
                  <p className="text-[11px] text-muted-foreground italic">
                    {t("office.landmark")}
                  </p>
                </div>

                {/* OpenStreetMap Verified Embed (Zero API Key Failures) */}
                <div className="relative mt-5 h-56 w-full overflow-hidden rounded-2xl border border-border bg-muted/30">
                  <iframe
                    title={t("officeMapTitle")}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src="https://www.openstreetmap.org/export/embed.html?bbox=30.055%2C-1.948%2C30.066%2C-1.942&layer=mapnik&marker=-1.9452%2C30.0611"
                    className="w-full h-full grayscale contrast-125 dark:invert dark:opacity-85 transition-opacity"
                  />
                  
                  {/* Floating Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/90 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-foreground shadow-2xs">
                    <MapPin size={12} className="text-foreground" />
                    <span>Centenary House • Kigali CBD</span>
                  </div>
                </div>

                {/* External Directions Links */}
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Centenary+House,+Kigali,+Rwanda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                  >
                    <span>{t("office.openGoogleMaps")}</span>
                    <ExternalLink size={12} className="text-muted-foreground" />
                  </a>

                  <a
                    href="https://maps.apple.com/?q=Centenary+House+Kigali+Rwanda&ll=-1.9452,30.0611"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                  >
                    <span>{t("office.openAppleMaps")}</span>
                    <ExternalLink size={12} className="text-muted-foreground" />
                  </a>
                </div>

                {/* Working Hours */}
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-foreground" />
                    <span>{t("labels.hours")}</span>
                  </span>
                  <span className="font-semibold text-foreground text-[11px] sm:text-xs">
                    {t("info.hours")}
                  </span>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Intake Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden">
                
                {isSubmitted ? (
                  /* ── Success Confirmation Screen ── */
                  <div className="py-8 text-center space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
                      <CheckCircle2 size={36} className="text-foreground" />
                    </div>

                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {t("form.successTitle")}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t("form.successDesc")}:
                      </p>
                    </div>

                    {/* Ticket Reference Badge with Copy Action */}
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-3 shadow-2xs">
                      <span className="font-mono text-sm sm:text-base font-bold text-foreground tracking-wider">
                        {ticketId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(ticketId, "ticket")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-accent/60 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition"
                      >
                        {copiedTicket ? (
                          <>
                            <Check size={12} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* SLA Notice Box */}
                    <div className="rounded-2xl border border-border bg-muted/30 p-4 max-w-lg mx-auto text-left flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground mt-0.5">
                        <Clock size={16} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("form.successSla")}
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-2xl border border-border bg-background/60 p-4 max-w-lg mx-auto text-left text-xs space-y-2">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">{t("form.categoryLabel")}</span>
                        <span className="font-semibold text-foreground">{currentDept.title}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">{t("form.name")}</span>
                        <span className="font-semibold text-foreground">{name}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">{t("form.email")}</span>
                        <span className="font-semibold text-foreground">{email}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-foreground px-6 py-2.5 text-xs font-bold transition shadow-xs"
                      >
                        {t("form.sendAnother")}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Interactive Intake Form ── */
                  <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {t("form.title")}
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        {t("form.subtitle")}
                      </p>
                    </div>

                    {/* Department Selector Pills */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 font-mono">
                        {t("form.categoryLabel")}
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(["client", "advocate", "institutional", "general"] as const).map((key) => {
                          const isActive = department === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setDepartment(key)}
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold text-center transition shadow-2xs ${
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
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Directed to: <span className="font-semibold text-foreground">{currentDept.email}</span> ({currentDept.title})
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
                          <span className="inline-flex items-center px-3 text-xs font-semibold text-muted-foreground border-r border-border bg-muted/20 select-none">
                            +250
                          </span>
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

                    {/* Fallback Direct Email Link */}
                    <div className="pt-3 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{t("form.directEmailNotice")}</span>
                      <a
                        href={`mailto:${currentDept.email}?subject=${encodeURIComponent(
                          subject || "MyJudicial Inquiry"
                        )}`}
                        className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
                      >
                        <span>{t("form.openEmailApp")}</span>
                        <ExternalLink size={12} />
                      </a>
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
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              Fast-Track Solutions
            </span>
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
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
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
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
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
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                  <HelpCircle size={22} />
                </div>
                <h3 className="text-base font-bold text-foreground">{t("selfService.card3Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("selfService.card3Desc")}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href="/help"
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
