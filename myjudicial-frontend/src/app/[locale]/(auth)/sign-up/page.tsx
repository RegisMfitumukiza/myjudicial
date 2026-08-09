"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Logo } from "@/shared/components/logo";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import {
  ArrowRight, ArrowLeft, Check, CheckCircle2,
  Users, Briefcase, Home, Building2, ShieldCheck, Globe,
  Banknote, FileText, MapPin, Video, Phone, Mail, Shield,
  Star, Clock, Smartphone, UploadCloud, X, Camera, FileCheck2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { signIn as authSignIn, signOut } from "next-auth/react";

import { postAuthRegister, postAuthOtpSend } from "@/api/generated";
import { OtpInput } from "@/components/otp-input";
import { useCountdown } from "@/hooks/use-countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/shared/components/theme-toggle";

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

const EXPERT_TITLES = ["Advocate", "Notary Public", "Legal Consultant", "State Attorney", "In-House Counsel", "Other"];

const EXPERIENCE_OPTIONS = [
  { value: "0-2", label: "0 – 2 yrs" },
  { value: "3-5", label: "3 – 5 yrs" },
  { value: "6-10", label: "6 – 10 yrs" },
  { value: "10+", label: "10+ yrs" },
];

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
  /* (removed Apple sign-up) */

  /* ─── citizen intake ─── */
  const [cArea, setCArea] = useState("");
  const [cSituation, setCSituation] = useState("");
  const [cUrgency, setCUrgency] = useState("moderate");
  const [cDistrict, setCDistrict] = useState("");
  const [cLanguage, setCLanguage] = useState("english");
  const [cConsult, setCConsult] = useState("video");

  /* ─── expert intake ─── */
  const [eAreas, setEAreas] = useState<string[]>([]);
  const [ePrimary, setEPrimary] = useState("");
  const [eBar, setEBar] = useState("");
  const [eExp, setEExp] = useState("");
  const [eTitle, setETitle] = useState("");
  const [eFirm, setEFirm] = useState("");
  const [eRate, setERate] = useState("");

  /* ─── expert documents ─── */
  const [ePhoto, setEPhoto] = useState<File | null>(null);
  const [ePhotoPreview, setEPhotoPreview] = useState<string | null>(null);
  const [ePhotoDrag, setEPhotoDrag] = useState(false);
  const [eCV, setECV] = useState<File | null>(null);
  const [eCVDrag, setECVDrag] = useState(false);

  /* ─── account creation ─── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);

  /* ─── OTP ─── */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

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

  /* ────────── step labels ────────── */
  const labels = [t("progress.role"), t("progress.account"), t("progress.verify")];
  const TOTAL = 3;
  const ACCOUNT_STEP = 2;
  const OTP_STEP = 3;

  /* ────────── validation ────────── */
  const canNext = (): boolean => {
    switch (step) {
      case 1: return role !== "";
      case 2:
        if (!firstName.trim() || !lastName.trim()) return false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
        if (!/^\+\d{8,15}$/.test(phone.trim())) return false;
        return terms;
      case 3: return otpCode.length === 6;
      default: return true;
    }
  };

  /* ────────── account creation API ────────── */
  async function createAccount() {
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

      // After registration, send OTP to the email
      const otpRes = await postAuthOtpSend({ email: normalEmail });

      setPendingEmail(normalEmail);
      setOtpExpiresAt((otpRes as any).data?.expiresAt ?? null);
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
      setOtpExpiresAt((res as any).data?.expiresAt ?? null);
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
    if (step === ACCOUNT_STEP) { await createAccount(); return; }
    if (step === OTP_STEP) { await verifyOtp(); return; }
    setStep((s) => s + 1);
  }

  function handleBack() {
    if (step === OTP_STEP) {
      setPendingEmail(null); setOtpCode(""); setApiError(null);
      countdown.reset();
      setStep(ACCOUNT_STEP);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  /* ────────── doc upload helpers ────────── */
  function handlePhotoFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setEPhoto(file);
    setEPhotoPreview(URL.createObjectURL(file));
  }
  function handleCVFile(file: File) {
    const ok = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type);
    if (!ok) return;
    setECV(file);
  }
  function fmtBytes(b: number) {
    return b > 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
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
  const renderCitizenStep2 = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2 of {TOTAL}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("practiceArea.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("practiceArea.subtitle")}</p>
      <p className="mt-6 text-sm text-muted-foreground italic">{t("practiceArea.skip")}</p>
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

  /* ── STEP 2 (EXPERT) ── Specialisations ── */
  const renderExpertStep2 = () => {
    const toggle = (id: string) => {
      const next = eAreas.includes(id) ? eAreas.filter((a) => a !== id) : [...eAreas, id];
      setEAreas(next);
      if (next.length === 1) setEPrimary(next[0]);
      else if (!next.includes(ePrimary)) setEPrimary("");
    };
    return (
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: 2, total: TOTAL })}</p>
        <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("expert.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("expert.subtitle")}</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRACTICE_AREAS.map(({ id, label, icon, desc }) => (
            <SelectCard
              key={id}
              selected={eAreas.includes(id)}
              onClick={() => toggle(id)}
              icon={icon}
              label={label}
              desc={desc}
            />
          ))}
        </div>
        {eAreas.length > 1 && (
          <div className="mt-6">
            <p className="mb-2.5 text-sm font-bold text-brand-dark">{t("expert.expertSpecializations")}</p>
            <div className="flex flex-wrap gap-2">
              {eAreas.map((id) => {
                const area = PRACTICE_AREAS.find((a) => a.id === id);
                if (!area) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEPrimary(id)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-all ${ePrimary === id ? "border-brand-blue bg-brand-blue text-on-brand" : "border-border bg-card text-muted-foreground hover:border-border"
                      }`}
                  >
                    {ePrimary === id && <Star size={10} />} {area.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{t("expert.primarySpecializationDesc")}</p>
          </div>
        )}
      </div>
    );
  };

  /* ── STEP 3 (CITIZEN) ── Situation ── */
  const renderCitizenStep3 = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: 3, total: TOTAL })}</p>
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

  /* ── STEP 3 (EXPERT) ── Background ── */
  const renderExpertStep3 = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: 3, total: TOTAL })}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("expert.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("expert.subtitle")}</p>

      <div className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expert.barNumber")}</label>
            <input
              type="text"
              value={eBar}
              onChange={(e) => setEBar(e.target.value)}
              placeholder={t("expert.barPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expert.professionalTitle")}</label>
            <select
              value={eTitle}
              onChange={(e) => setETitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-brand-dark shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            >
              <option value="">{t("expert.selectTitle")}</option>
              {EXPERT_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("expert.yearsExperience")}</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {EXPERIENCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setEExp(o.value)}
                className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${eExp === o.value ? "border-brand-blue bg-muted text-brand-blue" : "border-border bg-background text-muted-foreground hover:border-border"
                  }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
            {t("expert.firm")} <span className="font-normal text-muted-foreground">({t("expert.firmOptional")})</span>
          </label>
          <input
            type="text"
            value={eFirm}
            onChange={(e) => setEFirm(e.target.value)}
            placeholder={t("expert.firmPlaceholder")}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expert.hourlyRate")}</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-sm font-bold text-muted-foreground">RWF</span>
            <input
              type="number"
              value={eRate}
              onChange={(e) => setERate(e.target.value)}
              placeholder="e.g. 45000"
              min={5000}
              step={1000}
              className="w-full rounded-xl border border-border bg-background py-3 pl-14 pr-4 text-sm text-brand-dark shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t("expert.platformAverage")}</p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-5 text-muted-foreground">
            {t("expert.verificationNote")}
          </p>
        </div>
      </div>
    </div>
  );

  /* ── STEP 4 (EXPERT ONLY) ── Documents: photo + CV ── */
  const renderExpertStep4Docs = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: 4, total: 6 })}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("documents.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("documents.subtitle")}
      </p>

      <div className="mt-8 space-y-8">

        {/* ── Profile Photo ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-brand-dark">
              {t("documents.profilePhoto")} <span className="text-red-500">*</span>
            </label>
            {ePhoto && (
              <button
                type="button"
                onClick={() => { setEPhoto(null); setEPhotoPreview(null); }}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
              >
                <X size={12} /> {t("documents.remove")}
              </button>
            )}
          </div>

          {ePhotoPreview ? (
            <div className="flex items-center gap-5 rounded-2xl border-2 border-brand-blue bg-muted p-5">
              <img
                src={ePhotoPreview}
                alt={t("documents.profilePreview")}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-brand-blue/20 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck2 size={16} className="text-green-600" />
                  <p className="text-sm font-bold text-brand-dark">{ePhoto!.name}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{fmtBytes(ePhoto!.size)}</p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:bg-muted">
                  <Camera size={12} /> {t("documents.changePhoto")}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setEPhotoDrag(true); }}
              onDragLeave={() => setEPhotoDrag(false)}
              onDrop={(e) => {
                e.preventDefault(); setEPhotoDrag(false);
                const f = e.dataTransfer.files[0];
                if (f) handlePhotoFile(f);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-colors ${ePhotoDrag ? "border-brand-blue bg-muted" : "border-border bg-muted hover:border-brand-blue hover:bg-muted/40"
                }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm">
                <Camera size={26} className="text-brand-blue" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-brand-dark">
                  {t("documents.photoDrag")} <span className="text-brand-blue underline">{t("documents.browse")}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("documents.photoFormats")}</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); }}
              />
            </label>
          )}
        </div>

        {/* ── CV / Résumé ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-brand-dark">
              {t("documents.cv")} <span className="text-red-500">*</span>
            </label>
            {eCV && (
              <button
                type="button"
                onClick={() => setECV(null)}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
              >
                <X size={12} /> {t("documents.remove")}
              </button>
            )}
          </div>

          {eCV ? (
            <div className="flex items-center gap-4 rounded-2xl border-2 border-brand-blue bg-muted px-5 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-on-brand shadow-md">
                <FileCheck2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-brand-dark">{eCV.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{fmtBytes(eCV.size)} · {t("documents.uploadedSuccessfully")}</p>
              </div>
              <label className="cursor-pointer rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:bg-muted">
                {t("documents.replace")}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCVFile(f); }}
                />
              </label>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setECVDrag(true); }}
              onDragLeave={() => setECVDrag(false)}
              onDrop={(e) => {
                e.preventDefault(); setECVDrag(false);
                const f = e.dataTransfer.files[0];
                if (f) handleCVFile(f);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-colors ${eCVDrag ? "border-brand-blue bg-muted" : "border-border bg-muted hover:border-brand-blue hover:bg-muted/40"
                }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm">
                <UploadCloud size={26} className="text-brand-blue" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-brand-dark">
                  {t("documents.cvDrag")} <span className="text-brand-blue underline">{t("documents.browse")}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("documents.cvFormats")}</p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCVFile(f); }}
              />
            </label>
          )}
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-muted/60 px-4 py-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-blue" />
          <p className="text-xs leading-5 text-muted-foreground">
            {t("documents.securityNote")}
          </p>
        </div>
      </div>
    </div>
  );

  /* ── STEP 2 ── Create account ── */
  const renderStep4 = () => (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("steps.of", { n: ACCOUNT_STEP, total: TOTAL })}</p>
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{t("account.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("account.subtitle")}</p>

      {apiError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {apiError}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.firstName")}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.lastName")}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mugisha"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.email")}</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            />
            <Mail className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("account.phone")}</label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250788000000"
              className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:ring-brand-blue/20"
            />
            <Phone className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("account.phoneHelp")}</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
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
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
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
              <p className="text-[11px] text-muted-foreground">
                {otpExpired
                  ? t("errors.invalidOtp")
                  : otpRemaining !== null
                    ? t("otp.expiresIn", { time: otpRemaining >= 60 ? `${Math.floor(otpRemaining / 60)}m ${otpRemaining % 60}s` : `${otpRemaining}s` })
                    : t("errors.general")}
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    if (step === 1) return renderStep1();
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
          <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-lg sm:px-10 sm:py-10">
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
            {[
              [ShieldCheck, t("trust.encrypted")],
              [Clock, t("trust.aiPowered")],
              [Smartphone, t("trust.escrow")],
            ].map(([Icon, label]) => (
              <span key={label as string} className="flex items-center gap-1.5">
                {/* @ts-expect-error dynamic icon */}
                <Icon size={11} /> {label}
              </span>
            ))}
           </div>
        </div>
      </div>
    </div>
  );
}
