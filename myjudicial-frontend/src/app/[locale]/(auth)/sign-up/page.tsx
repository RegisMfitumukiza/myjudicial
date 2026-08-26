"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Logo } from "@/shared/components/logo";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import {
  ArrowRight, ArrowLeft, Check, CheckCircle2,
  Users, Briefcase, Home, Building2, ShieldCheck, Globe,
  Banknote, FileText, MapPin, Video, Phone, Mail, Shield,
  Smartphone, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { signIn as authSignIn, signOut } from "next-auth/react";

import { postAuthRegister, postAuthOtpSend } from "@/api/generated";
import { OtpInput } from "@/components/otp-input";
import { useCountdown } from "@/hooks/use-countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { apiFetch } from "@/lib/api/client";

/* ══════════════════════════ DATA ══════════════════════════ */

const PRACTICE_AREAS = [
  { id: "family", label: "Family Law", icon: Users, desc: "Divorce, custody, adoption" },
  { id: "property", label: "Property & Land", icon: Home, desc: "Land disputes, titles, tenancy" },
  { id: "criminal", label: "Criminal Defense", icon: ShieldCheck, desc: "Representation & appeals" },
  { id: "business", label: "Business Law", icon: Building2, desc: "Contracts, company formation" },
  { id: "employment", label: "Employment", icon: Briefcase, desc: "Dismissal, workplace disputes" },
  { id: "immigration", label: "Immigration", icon: Globe, desc: "Visas, permits, citizenship" },
  { id: "debt", label: "Debt & Finance", icon: Banknote, desc: "Loans, bankruptcy, recovery" },
  { id: "other", label: "Other / Unsure", icon: FileText, desc: "Help me find the right area" },
] as const;

const KIGALI_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"];
const OTHER_DISTRICTS = [
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro",
];

/* ══════════════════════════ TYPES ══════════════════════════ */

type Role = "CITIZEN" | "EXPERT";

/* ══════════════════════════ HELPERS ══════════════════════════ */

/* ══════════════════════════ PROGRESS BAR ══════════════════════════ */

function ProgressBar({
  step, labels,
}: { step: number; labels: string[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {labels.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const act = step === n;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? "bg-brand-blue text-on-brand"
                  : act ? "border-2 border-brand-blue bg-background text-brand-blue shadow-sm"
                    : "border-2 border-border bg-background text-muted-foreground"
                  }`}>
                  {done ? <Check size={13} /> : n}
                </div>
                <span className={`hidden whitespace-nowrap text-[10px] font-semibold sm:block ${act ? "text-brand-blue" : done ? "text-muted-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div className={`mx-1 mb-3 h-0.5 flex-1 transition-colors ${step > n ? "bg-brand-blue" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════ CARD SELECTOR ══════════════════════════ */

function SelectCard({
  selected, onClick, icon: Icon, label, desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-start gap-2.5 rounded-2xl border-2 p-4 text-left transition-all ${selected
        ? "border-brand-blue bg-muted shadow-sm shadow-brand-blue/10"
        : "border-border bg-card hover:border-border hover:shadow-sm"
        }`}
    >
      {selected && (
        <span className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue`}>
              <Check size={10} className="text-on-brand" />
        </span>
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${selected ? "bg-brand-blue text-on-brand" : "bg-muted text-muted-foreground"}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className={`text-[13px] font-bold ${selected ? "text-brand-blue" : "text-brand-dark"}`}>{label}</p>
        {desc && <p className="mt-0.5 text-[11px] text-muted-foreground leading-4">{desc}</p>}
      </div>
    </button>
  );
}

/* ══════════════════════════ MAIN WIZARD ══════════════════════════ */

export default function SignUpPage() {
  const router = useRouter();

  /* ─── global step ─── */
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | "">("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ─── citizen intake ─── */
  const [cArea, setCArea] = useState("");
  const [cSituation, setCSituation] = useState("");
  const [cUrgency, setCUrgency] = useState("moderate");
  const [cDistrict, setCDistrict] = useState("");
  const [cLanguage, setCLanguage] = useState("english");
  const [cConsult, setCConsult] = useState("video");

  /* ─── account creation ─── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [triedAccountSubmit, setTriedAccountSubmit] = useState(false);
  // Honeypot — real users never see or fill this; bots do.
  const [companyWebsite, setCompanyWebsite] = useState("");

  /* ─── OTP ─── */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const countdown = useCountdown(60);
  const isVerifyingRef = useRef(false);

  const t = useTranslations("signup");

  useEffect(() => {
    if (!otpExpiresAt) return;
    const interval = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  // Alerts configuration for toast messages
  const ALERTS = [
    {
      id: "otp-expired",
      title: t("errors.general"),
      message: t("otp.expiredMessage"),
      action: t("otp.resend"),
    },
  ];

  const toastStyles = {
    success: "text-green-700 border-green-200 bg-green-50",
    error: "text-red-700 border-red-200 bg-red-50",
  };

  const otpRemaining = useMemo(() => {
    if (!otpExpiresAt) return null;
    return Math.max(0, Math.floor((new Date(otpExpiresAt).getTime() - Date.now()) / 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpExpiresAt, tick]);

  const otpExpired = otpRemaining !== null && otpRemaining <= 0;

  /* ────────── step layout (differs by role) ────────── */
  const isCitizenFlow = role === "CITIZEN";
  const AREA_STEP = 2;      // citizen only
  const NEEDS_STEP = 3;     // citizen only
  const ACCOUNT_STEP = isCitizenFlow ? 4 : 2;
  const OTP_STEP = ACCOUNT_STEP + 1;
  const TOTAL = OTP_STEP;

  const labels = useMemo(() => {
    const base = [t("progress.role")];
    if (isCitizenFlow) base.push(t("progress.area"), t("progress.needs"));
    base.push(t("progress.account"), t("progress.verify"));
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCitizenFlow]);

  // Move focus to the card on every step change so keyboard and screen-reader
  // users are announced into the new step.
  useEffect(() => {
    cardRef.current?.focus();
  }, [step]);

  /* ────────── account field validation ────────── */
  const normalizePhoneInput = (v: string): string => {
    let s = v.replace(/[\s().\-–—]/g, "");
    if (s && !s.startsWith("+")) s = `+${s.replace(/^\++/, "")}`;
    return s.slice(0, 16);
  };

  const accountErrors = {
    firstName: firstName.trim() === "" ? "" : firstName.trim().length < 2 ? t("errors.firstNameMin") : "",
    lastName: lastName.trim() === "" ? "" : lastName.trim().length < 2 ? t("errors.lastNameMin") : "",
    email: email.trim() === "" ? "" : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "" : t("errors.emailInvalid"),
    phone: phone.trim() === "" ? "" : /^\+\d{8,15}$/.test(phone.trim()) ? "" : t("errors.phoneInvalid"),
  };
  const hasAccountErrors = Object.values(accountErrors).some(Boolean);
  const showFieldErrors = triedAccountSubmit && hasAccountErrors;
  const showTermsError = triedAccountSubmit && !terms;

  /* ────────── validation ────────── */
  const canNext = (): boolean => {
    if (step === 1) return role !== "";
    if (isCitizenFlow && step === AREA_STEP) return cArea !== "";
    if (isCitizenFlow && step === NEEDS_STEP) return true; // all optional
    if (step === ACCOUNT_STEP) {
      return (
        firstName.trim().length >= 2 &&
        lastName.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
        /^\+\d{8,15}$/.test(phone.trim()) &&
        terms
      );
    }
    if (step === OTP_STEP) return otpCode.length === 6;
    return true;
  };

  /* ────────── account creation API ────────── */
  async function createAccount() {
    // Honeypot filled → almost certainly a bot. Pretend success, do nothing.
    if (companyWebsite.trim()) {
      setPendingEmail(email.trim().toLowerCase());
      setStep(OTP_STEP);
      return;
    }
    setTriedAccountSubmit(true);
    setIsLoading(true);
    setApiError(null);
    const normalEmail = email.trim().toLowerCase();
    try {
      await postAuthRegister({
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: normalEmail,
        phone: phone.trim(),
        role: role as "CITIZEN" | "EXPERT",
      });

      // The backend is idempotent: this succeeds whether or not the account
      // pre-existed (existing accounts simply receive a login code), so we
      // can always continue to verification without leaking enumeration.
      let expiresAt: string | null = null;
      try {
        const otpRes = await postAuthOtpSend({ email: normalEmail });
        expiresAt =
          (otpRes as { data?: { expiresAt?: string } })?.data?.expiresAt ?? null;
      } catch {
        // Never strand the user here: they can still hit "Resend" on the
        // next step once any rate limit or transient error clears.
        toast.warning(t("toast.sendFailedUseResend"));
      }

      setPendingEmail(normalEmail);
      setOtpCode("");
      setOtpExpiresAt(expiresAt);
      setStep(OTP_STEP);
      toast.success(t("toast.accountCreated"));
      countdown.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("toast.createAccountFailed");
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  /* ────────── persist citizen intake (best-effort, never blocks login) ────────── */
  async function submitOnboarding() {
    if (!isCitizenFlow || !cArea) return;
    try {
      await apiFetch("/auth/onboarding", {
        method: "POST",
        body: {
          role: "CITIZEN",
          citizen: {
            practiceArea: cArea,
            situation: cSituation.trim() || undefined,
            urgency: cUrgency,
            district: cDistrict || undefined,
            language: cLanguage,
            consultation: cConsult,
          },
        },
      });
    } catch (err) {
      // Non-blocking: the account is verified; intake can be re-collected later.
      console.warn("[signup] onboarding save failed", err);
    }
  }

  /* ────────── OTP verify ────────── */
  async function verifyOtp() {
    if (!pendingEmail) return;
    if (isVerifyingRef.current) return;
    if (otpExpired) { setApiError(t("otp.codeExpired")); return; }
    if (otpCode.length < 6) { setApiError(t("otp.enterComplete")); return; }
    isVerifyingRef.current = true;
    setIsLoading(true);
    setApiError(null);
    try {
      await signOut({ redirect: false });
      const result = await authSignIn("email-otp", { email: pendingEmail, code: otpCode, redirect: false });
      if (result?.error) {
        throw new Error(t("otp.invalidCode"));
      }
      setIsVerified(true);
      toast.success(t("toast.emailVerified"));
      await submitOnboarding();
      setTimeout(() => router.push("/post-auth"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("toast.verificationFailed");
      setOtpCode("");
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      isVerifyingRef.current = false;
    }
  }

  async function handleResend() {
    if (!pendingEmail || countdown.isActive) return;
    setIsResending(true);
    try {
      const res = await postAuthOtpSend({ email: pendingEmail });
      setOtpCode("");
      setApiError(null);
      setOtpExpiresAt((res as { data?: { expiresAt?: string } })?.data?.expiresAt ?? null);
      toast.success(t("toast.codeResent"));
      countdown.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("toast.resendFailed");
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  }

  /* ────────── navigation ────────── */
  async function handleNext() {
    if (step === ACCOUNT_STEP) {
      setTriedAccountSubmit(true);
      if (!canNext()) return;
      await createAccount();
      return;
    }
    if (step === OTP_STEP) { await verifyOtp(); return; }
    setStep((s) => s + 1);
  }

  function handleBack() {
    if (step === ACCOUNT_STEP && !isCitizenFlow) {
      setRole(""); setStep(1); setApiError(null);
      return;
    }
    if (step === ACCOUNT_STEP) {
      setStep(NEEDS_STEP); setApiError(null);
      return;
    }
    if (step === OTP_STEP) {
      setPendingEmail(null); setOtpCode(""); setApiError(null);
      countdown.reset();
      setStep(ACCOUNT_STEP);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  /* ══════════════════════════ STEP CONTENT ══════════════════════════ */

  /* ── STEP 1 ── Role selection ── */
  const renderStep1 = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: 1, total: TOTAL })}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("role.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("role.subtitle")}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setRole("CITIZEN")}
          className={`relative flex flex-col items-center gap-4 rounded-2xl border-2 px-6 py-8 text-center transition-all ${role === "CITIZEN"
            ? "border-brand-blue bg-muted shadow-md shadow-brand-blue/10"
            : "border-border bg-card hover:border-border hover:shadow-md"
            }`}
        >
          {role === "CITIZEN" && (
            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue">
              <Check size={12} className="text-on-brand" />
            </span>
          )}
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${role === "CITIZEN" ? "bg-brand-blue text-on-brand shadow-lg shadow-brand-blue/30" : "bg-muted text-muted-foreground"}`}>
            <Users size={30} />
          </div>
          <div>
            <p className={`text-lg font-extrabold ${role === "CITIZEN" ? "text-brand-blue" : "text-brand-dark"}`}>{t("role.citizen.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("role.citizen.desc")}</p>
          </div>
          <ul className="mt-2 space-y-1 text-left">
            {[
              t("role.citizenBenefits.browse"),
              t("role.citizenBenefits.fees"),
              t("role.citizenBenefits.book"),
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 size={12} className="shrink-0 text-brand-blue" /> {item}
              </li>
            ))}
          </ul>
        </button>

        <button
          type="button"
          onClick={() => setRole("EXPERT")}
          className={`relative flex flex-col items-center gap-4 rounded-2xl border-2 px-6 py-8 text-center transition-all ${role === "EXPERT"
            ? "border-brand-blue bg-muted shadow-md shadow-brand-blue/10"
            : "border-border bg-card hover:border-border hover:shadow-md"
            }`}
        >
          {role === "EXPERT" && (
            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue">
              <Check size={12} className="text-on-brand" />
            </span>
          )}
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${role === "EXPERT" ? "bg-brand-blue text-on-brand shadow-lg shadow-brand-blue/30" : "bg-muted text-muted-foreground"}`}>
            <Briefcase size={30} />
          </div>
          <div>
            <p className={`text-lg font-extrabold ${role === "EXPERT" ? "text-brand-blue" : "text-brand-dark"}`}>{t("role.expert.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("role.expert.desc")}</p>
          </div>
          <ul className="mt-2 space-y-1 text-left">
            {[
              t("role.expertBenefits.clients"),
              t("role.expertBenefits.manage"),
              t("role.expertBenefits.profile"),
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 size={12} className="shrink-0 text-brand-blue" /> {item}
              </li>
            ))}
          </ul>
        </button>
      </div>
    </div>
  );

  /* ── STEP 2 (CITIZEN) ── Practice area ── */
  const renderAreaStep = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: AREA_STEP, total: TOTAL })}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("practiceArea.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("practiceArea.subtitle")}</p>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRACTICE_AREAS.map(({ id, label, icon, desc }) => (
          <SelectCard
            key={id}
            selected={cArea === id}
            onClick={() => setCArea(id)}
            icon={icon}
            label={label}
            desc={desc}
          />
        ))}
      </div>
    </div>
  );

  /* ── STEP 3 (CITIZEN) ── Situation ── */
  const renderNeedsStep = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: NEEDS_STEP, total: TOTAL })}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("citizen.situation.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("citizen.situation.subtitle")}</p>

      <div className="mt-7 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("citizen.situation.briefLabel")} <span className="font-normal text-muted-foreground">({t("citizen.situation.briefOptional")})</span></label>
          <textarea
            rows={4}
            value={cSituation}
            onChange={(e) => setCSituation(e.target.value.slice(0, 500))}
            placeholder={t("citizen.situation.placeholder")}
            className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm text-brand-dark placeholder:text-muted-foreground shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">{cSituation.length} / 500</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("citizen.urgency.label")}</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { v: "not-urgent", l: t("citizen.urgency.notUrgent"), cls: "text-green-700  bg-green-50  border-green-200" },
              { v: "moderate", l: t("citizen.urgency.moderate"), cls: "text-amber-700  bg-amber-50  border-amber-200" },
              { v: "urgent", l: t("citizen.urgency.urgent"), cls: "text-orange-700 bg-orange-50 border-orange-200" },
              { v: "emergency", l: t("citizen.urgency.emergency"), cls: "text-red-700    bg-red-50    border-red-200" },
            ].map((u) => (
              <button
                key={u.v}
                type="button"
                onClick={() => setCUrgency(u.v)}
                className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${cUrgency === u.v ? u.cls : "border-border bg-background text-muted-foreground hover:border-border"
                  }`}
              >
                {u.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("citizen.location.district")}</label>
            <select
              value={cDistrict}
              onChange={(e) => setCDistrict(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-brand-dark shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            >
              <option value="">{t("citizen.location.selectDistrict")}</option>
              <optgroup label="Kigali City">
                {KIGALI_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </optgroup>
              <optgroup label="Other Districts">
                {OTHER_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("citizen.language.label")}</label>
            <div className="flex flex-col gap-2">
              {[["kinyarwanda", "Kinyarwanda"], ["english", "English"], ["french", "French"]].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCLanguage(v)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${cLanguage === v ? "border-brand-blue bg-muted text-brand-blue" : "border-border bg-background text-muted-foreground hover:border-border"
                    }`}
                >
                  {cLanguage === v && <Check size={13} />} {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("citizen.consultationType.label")}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: "video", l: t("citizen.consultationType.video"), i: Video },
              { v: "phone", l: t("citizen.consultationType.phone"), i: Phone },
              { v: "inperson", l: t("citizen.consultationType.inPerson"), i: MapPin },
            ].map(({ v, l, i: Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => setCConsult(v)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 text-sm font-bold transition-all ${cConsult === v ? "border-brand-blue bg-muted text-brand-blue" : "border-border bg-background text-muted-foreground hover:border-border"
                  }`}
              >
                <Icon size={18} /> {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

    /* ── Account step ── Create account ── */
  const renderStep4 = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: ACCOUNT_STEP, total: TOTAL })}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("account.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("account.subtitle")}</p>

      {apiError && (
        <div role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {apiError}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="su-first-name" className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.firstName")}</label>
            <input
              id="su-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
              autoComplete="given-name"
              maxLength={50}
              aria-invalid={showFieldErrors && !!accountErrors.firstName}
              aria-describedby={showFieldErrors && accountErrors.firstName ? "su-first-name-error" : undefined}
              className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20 ${showFieldErrors && accountErrors.firstName ? "border-red-400" : "border-border"}`}
            />
            {showFieldErrors && accountErrors.firstName && (
              <p id="su-first-name-error" className="mt-1.5 text-xs font-semibold text-red-600">{accountErrors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="su-last-name" className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.lastName")}</label>
            <input
              id="su-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mugisha"
              autoComplete="family-name"
              maxLength={50}
              aria-invalid={showFieldErrors && !!accountErrors.lastName}
              aria-describedby={showFieldErrors && accountErrors.lastName ? "su-last-name-error" : undefined}
              className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20 ${showFieldErrors && accountErrors.lastName ? "border-red-400" : "border-border"}`}
            />
            {showFieldErrors && accountErrors.lastName && (
              <p id="su-last-name-error" className="mt-1.5 text-xs font-semibold text-red-600">{accountErrors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="su-email" className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.email")}</label>
          <div className="relative">
            <input
              id="su-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              aria-invalid={showFieldErrors && !!accountErrors.email}
              aria-describedby={showFieldErrors && accountErrors.email ? "su-email-error" : undefined}
              className={`w-full rounded-xl border bg-background py-3 pl-4 pr-11 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20 ${showFieldErrors && accountErrors.email ? "border-red-400" : "border-border"}`}
            />
            <Mail className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
          {showFieldErrors && accountErrors.email && (
            <p id="su-email-error" className="mt-1.5 text-xs font-semibold text-red-600">{accountErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="su-phone" className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.phone")}</label>
          <div className="relative">
            <input
              id="su-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
              placeholder="+250788000000"
              autoComplete="tel"
              aria-invalid={showFieldErrors && !!accountErrors.phone}
              aria-describedby={`su-phone-help${showFieldErrors && accountErrors.phone ? " su-phone-error" : ""}`}
              className={`w-full rounded-xl border bg-background py-3 pl-4 pr-11 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20 ${showFieldErrors && accountErrors.phone ? "border-red-400" : "border-border"}`}
            />
            <Phone className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
          {showFieldErrors && accountErrors.phone ? (
            <p id="su-phone-error" className="mt-1.5 text-xs font-semibold text-red-600">{accountErrors.phone}</p>
          ) : (
            <p id="su-phone-help" className="mt-1.5 text-xs text-muted-foreground">{t("account.phoneHelp")}</p>
          )}
        </div>

        {/* Honeypot — visually hidden; bots fill it, humans never see it */}
        <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="su-company-website">Company website</label>
          <input
            id="su-company-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            aria-invalid={showTermsError}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-brand-blue"
          />
          <span className="text-xs leading-5 text-muted-foreground">
            {t("account.terms")}{' '}
            <Link href="/terms" className="font-semibold text-brand-blue hover:underline">{t("account.termsLink")}</Link>{' '}
            {t("account.and")}{' '}
            <Link href="/privacy-policy" className="font-semibold text-brand-blue hover:underline">{t("account.privacyLink")}</Link>.
            {t("account.ageConfirmation")}
          </span>
        </label>
        {showTermsError && (
          <p className="-mt-2 text-xs font-semibold text-red-600">{t("errors.termsRequired")}</p>
        )}

        <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Shield size={10} /> {t("account.sslSecure")}</span>
          <span className="flex items-center gap-1"><ShieldCheck size={10} /> {t("account.noSpam")}</span>
          <span className="flex items-center gap-1"><Smartphone size={10} /> {t("account.momoPayments")}</span>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: OTP_STEP, total: TOTAL })} &mdash; {t("otp.finalStep")}</p>
      {isVerified ? (
        <>
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("otp.verified")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("otp.verifiedRedirect")}
          </p>
        </>
      ) : (
        <>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10">
            <Mail className="h-7 w-7 text-brand-blue" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("otp.title")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("otp.subtitle")} <span className="font-bold text-brand-dark">{pendingEmail}</span>. {t("otp.subtitle2")}
          </p>

          {apiError && (
            <div role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyOtp(); }} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("otp.codeLabel")}</label>
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={verifyOtp}
                disabled={isLoading || isResending || otpExpired}
                error={apiError}
              />

            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setPendingEmail(null); setOtpCode(""); setApiError(null); setOtpExpiresAt(null); setStep(ACCOUNT_STEP); countdown.reset(); }} className="text-xs font-semibold text-muted-foreground hover:text-brand-dark">
                {t("nav.back")}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown.isActive || isResending}
                className="text-xs font-semibold text-brand-blue hover:text-blue-800 disabled:text-slate-300 dark:text-white/20"
              >
                {isResending ? t("otp.resending") : countdown.isActive ? t("otp.resendIn", { seconds: countdown.remaining }) : t("otp.resend")}
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-3">
              <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                {otpExpired
                  ? t("errors.invalidOtp")
                  : otpRemaining !== null
                    ? t("otp.expiresIn", { time: otpRemaining >= 60 ? `${Math.floor(otpRemaining / 60)}m ${otpRemaining % 60}s` : `${otpRemaining}s` })
                    : t("otp.validFor15m")}
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    if (step === 1) return renderStep1();
    if (isCitizenFlow && step === AREA_STEP) return renderAreaStep();
    if (isCitizenFlow && step === NEEDS_STEP) return renderNeedsStep();
    if (step === ACCOUNT_STEP) {
      if (isLoading) {
        return (
          <div className="space-y-6">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        );
      }
      return renderStep4();
    }
    return renderStep5();
  };

  const nextLabel = () => {
    if (step === ACCOUNT_STEP) return t("nav.createAccount");
    if (step === OTP_STEP) return t("otp.verify");
    return t("nav.next");
  };

  const showNextButton = () => {
    if (step === OTP_STEP && isVerified) return false;
    return true;
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Top bar — matches platform Header ── */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="mx-auto flex max-w-[1400px] h-16 items-center gap-2 px-4 sm:px-6">
          <div className="flex flex-1 items-center justify-start shrink-0 mr-4">
            <Logo iconSize={22} fontSize="text-[18px]" className="text-brand-dark dark:text-white" />
          </div>
          <div className="flex flex-1 items-center justify-end gap-1">
            <LanguageSwitcher variant="compact" />
            <ThemeToggle />
            <p className="hidden sm:block text-sm text-muted-foreground">
              {t("header.alreadyHaveAccount")}{" "}
              <Link href="/sign-in" className="font-bold text-brand-blue hover:underline">{t("header.signIn")}</Link>
            </p>
          </div>
        </div>
      </header>

      {/* ── Wizard body ── */}
      <div className="flex flex-1 justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-3xl">

          {/* Progress */}
          {role && <ProgressBar step={step} labels={labels} />}

          {/* Content card */}
          <div
            ref={cardRef}
            tabIndex={-1}
            className="rounded-2xl border border-border bg-card px-6 py-8 shadow-lg outline-none sm:px-10 sm:py-10"
          >
            {renderContent()}

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
              {showNextButton() && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-0"
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              {showNextButton() && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext() || isLoading}
                  className="flex items-center gap-2 rounded-xl bg-brand-blue px-7 py-3 text-sm font-bold text-on-brand transition hover:bg-brand-blue/90 disabled:opacity-40"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {nextLabel()}</>
                  ) : (
                    <>{nextLabel()} {step < OTP_STEP && <ArrowRight size={15} />}</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck size={11} /> {t("trust.encrypted")}</span>
            <span className="flex items-center gap-1.5"><Smartphone size={11} /> {t("trust.aiPowered")}</span>
            <span className="flex items-center gap-1.5"><Smartphone size={11} /> {t("trust.escrow")}</span>
           </div>
        </div>
      </div>
    </div>
  );
}
