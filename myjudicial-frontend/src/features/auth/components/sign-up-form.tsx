"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { signIn as authSignIn, signOut } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  ArrowRight, Briefcase, CheckCircle2, Mail, User,
  Shield, Lock, Loader2, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field, FieldContent, FieldError, FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/otp-input";
import { postAuthRegister, postAuthOtpSend } from "@/api/generated";
import { useCountdown } from "@/hooks/use-countdown";

/* ── Schema ── */
const signUpSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName:  z.string().trim().min(2, "Last name must be at least 2 characters."),
  email:     z.string().email("Please enter a valid email address.").trim().toLowerCase(),
  phone:     z.string().trim()
    .min(1, "Phone number is required.")
    .regex(/^\+\d{8,15}$/, "Enter a valid international phone number (e.g. +250788000000)."),
  role:      z.enum(["CITIZEN", "EXPERT"]),
  terms:     z.boolean().refine((v) => v, "You must accept the terms to continue."),
});
type SignUpValues = z.infer<typeof signUpSchema>;

/* ── Step indicator ── */
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const t = useTranslations("expertDashboard_sign-up-form");
  const labels = [t("stepDetails"), t("stepVerify"), t("stepComplete")];
  return (
    <div className="mb-8 flex items-center gap-3">
      {labels.map((label, i) => {
        const n = i + 1;
        return (
          <div key={n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
                  current >= n
                    ? "bg-brand-blue dark:bg-white text-on-brand"
                    : "border-2 border-slate-200 dark:border-white/20 text-slate-400 dark:text-white/40"
                }`}
              >
                {current > n ? <CheckCircle2 size={14} /> : n}
              </div>
              <span className={`text-[12px] font-semibold ${current >= n ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/40"}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-px flex-1 w-12 transition-colors ${current > n ? "bg-brand-blue dark:bg-white" : "bg-slate-200 dark:bg-white/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main component ── */
export function SignUpForm() {
  const t = useTranslations("expertDashboard_sign-up-form");
  const router = useRouter();
  const [error, setError]             = useState<string | null>(null);
  const [message, setMessage]         = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode]         = useState("");


  const countdown = useCountdown(60);
  const isVerifyingRef = useRef(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpRemaining, setOtpRemaining] = useState<number | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);

  const otpExpiresAtRef = useRef(0);

  useEffect(() => {
    setOtpRemaining(null);
    setOtpExpired(false);
    if (!otpExpiresAt) return;
    const expiresMs = new Date(otpExpiresAt).getTime();
    otpExpiresAtRef.current = expiresMs;
    const initId = setTimeout(() => {
      const r = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setOtpRemaining(r);
      if (r <= 0) { setOtpExpired(true); return; }
    }, 0);
    const interval = setInterval(() => {
      const next = Math.max(0, Math.floor((otpExpiresAtRef.current - Date.now()) / 1000));
      setOtpRemaining(next);
      if (next <= 0) { setOtpExpired(true); clearInterval(interval); }
    }, 1000);
    return () => { clearTimeout(initId); clearInterval(interval); };
  }, [otpExpiresAt]);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", role: "CITIZEN", terms: false },
  });

  const selectedRole = useWatch({ control: form.control, name: "role" });
  const acceptedTerms = useWatch({ control: form.control, name: "terms" });

  async function createAccount(values: SignUpValues) {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    const email = values.email.trim().toLowerCase();
    try {
      await postAuthRegister({
        fullName: `${values.firstName.trim()} ${values.lastName.trim()}`,
        email,
        phone: values.phone.trim(),
        role: values.role,
      });

      // Note: Registration now only sends welcome email
      // We need to send OTP for verification as a separate step
      const otpRes = await postAuthOtpSend({ email });

      setPendingEmail(email);
      setOtpCode("");
      setOtpExpiresAt((otpRes as any).data?.expiresAt ?? null);
      setOtpExpired(false);
      setStep(2);
      toast.success(t("checkEmailForCode"));
      countdown.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("failedToCreate");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp() {
    if (!pendingEmail) return;
    if (isVerifyingRef.current) return;
    if (otpExpired) { setError(t("codeExpiredReqNew")); return; }
    if (otpCode.length < 6) { setError(t("enterCompleteCode")); return; }
    isVerifyingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      await signOut({ redirect: false });
      const result = await authSignIn("email-otp", { email: pendingEmail, code: otpCode, redirect: false });
      if (result?.error) {
        throw new Error("Email verification code is invalid or expired.");
      }
      setStep(3);
      toast.success(t("emailVerified"));
      setTimeout(() => router.push("/post-auth"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("emailVerifyFail");
      setOtpCode("");
      setError(msg);
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
      setError(null);
      setOtpExpiresAt((res as any).data?.expiresAt ?? null);
      setOtpExpired(false);
      toast.success(t("newCodeSent"));
      countdown.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("failedToResend");
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  }

  const isOtpLoading = isLoading || isResending;

  /* ── STEP 3: Success ── */
  if (step === 3) {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-white/10">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-brand-dark">{t("accountVerified")}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-white/50">
          {t("redirecting")}
        </p>
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue dark:text-white" />
        </div>
      </div>
    );
  }

  /* ── STEP 2: OTP verification ── */
  if (step === 2) {
    return (
      <div>
        <Steps current={2} />

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 dark:bg-white/10">
          <Mail className="h-7 w-7 text-brand-blue dark:text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-dark">{t("checkInbox")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/50">
          {t("weSentCodeTo")}{" "}
          <span className="font-semibold text-brand-dark">{pendingEmail}</span>.
          {t("enterItBelow")}
        </p>

        {message && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-brand-blue/20 dark:border-white/20 bg-brand-blue/5 dark:bg-white/5 px-4 py-3 text-sm text-brand-dark">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue dark:text-white" />
            {message}
          </div>
        )}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={(e) => { e.preventDefault(); verifyOtp(); }} className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("verificationCode")}</label>
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              onComplete={verifyOtp}
              disabled={isOtpLoading || otpExpired}
              error={error}
            />

          </div>

          <Button
            type="submit"
            disabled={isOtpLoading || otpCode.length < 6 || otpExpired}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-bold text-white dark:bg-white dark:text-black hover:bg-brand-blue/90 dark:hover:bg-white/90 disabled:opacity-50"
          >
            {isOtpLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("verifying")}</>
            ) : (
              <><ArrowRight className="h-4 w-4" /> {t("verifyAndActivate")}</>
            )}
          </Button>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => { setStep(1); setOtpCode(""); setError(null); setOtpExpiresAt(null); setOtpExpired(false); }} className="text-xs font-semibold text-slate-500 dark:text-white/50 hover:text-brand-dark dark:hover:text-white">
              {t("changeEmail")}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown.isActive || isResending}
              className="text-xs font-semibold text-brand-blue dark:text-white hover:text-blue-800 dark:hover:text-white disabled:text-slate-300 dark:disabled:text-white/20"
            >
              {isResending ? t("resending") : countdown.isActive ? t("resendIn", { seconds: countdown.remaining }) : t("resendCode")}
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 px-4 py-3">
          <Shield className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/40" />
          <p className="text-[11px] text-slate-500 dark:text-white/50">
            {otpExpired
              ? t("codeExpired")
              : otpRemaining !== null
                ? (otpRemaining >= 60 ? t("codeExpiresInMins", { minutes: Math.floor(otpRemaining / 60), seconds: otpRemaining % 60 }) : t("codeExpiresInSecs", { seconds: otpRemaining }))
                : t("codeExpiresIn10Mins")}
          </p>
        </div>
      </div>
    );
  }

  /* ── STEP 1: Sign-up form ── */
  return (
    <div>
      <Steps current={1} />

      <h1 className="text-2xl font-extrabold text-brand-dark">{t("createAccountTitle")}</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-white/50">
        {t("createAccountSub")}
      </p>

      {error && (
        <Alert variant="destructive" className="mt-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Role selector ── */}
      <div className="mt-6">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">{t("iAmJoiningAs")}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => form.setValue("role", "CITIZEN")}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all ${
              selectedRole === "CITIZEN"
                ? "border-brand-blue dark:border-white bg-brand-blue/5 dark:bg-white/5 shadow-sm"
                : "border-slate-200 dark:border-white/20 bg-white hover:border-slate-300 dark:hover:border-white/30"
            }`}
          >
            {selectedRole === "CITIZEN" && (
              <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue dark:bg-white">
                <CheckCircle2 size={10} className="text-on-brand" />
              </span>
            )}
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedRole === "CITIZEN" ? "bg-brand-blue dark:bg-white text-on-brand" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50"}`}>
              <User size={20} />
            </div>
            <div>
              <p className={`text-sm font-bold ${selectedRole === "CITIZEN" ? "text-brand-blue dark:text-white" : "text-slate-700 dark:text-white/70"}`}>{t("iNeedLegalHelp")}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/40">{t("findBookLawyer")}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => form.setValue("role", "EXPERT")}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all ${
              selectedRole === "EXPERT"
                ? "border-brand-blue dark:border-white bg-brand-blue/5 dark:bg-white/5 shadow-sm"
                : "border-slate-200 dark:border-white/20 bg-white hover:border-slate-300 dark:hover:border-white/30"
            }`}
          >
            {selectedRole === "EXPERT" && (
              <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue dark:bg-white">
                <CheckCircle2 size={10} className="text-on-brand" />
              </span>
            )}
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedRole === "EXPERT" ? "bg-brand-blue dark:bg-white text-on-brand" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50"}`}>
              <Briefcase size={20} />
            </div>
            <div>
              <p className={`text-sm font-bold ${selectedRole === "EXPERT" ? "text-brand-blue dark:text-white" : "text-slate-700 dark:text-white/70"}`}>{t("imALawyer")}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/40">{t("joinGetClients")}</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Email form ── */}
      <form onSubmit={form.handleSubmit(createAccount)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="firstName" className="text-sm font-semibold text-foreground">{t("firstName")}</FieldLabel>
            <FieldContent>
              <Input
                id="firstName"
                placeholder={t("firstNamePlaceholder")}
                disabled={isLoading}
                className="h-11 rounded-xl border-border text-sm text-foreground focus-visible:ring-brand-blue/20"
                {...form.register("firstName")}
              />
            </FieldContent>
            <FieldError className="text-xs text-brand-alert">{form.formState.errors.firstName?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName" className="text-sm font-semibold text-foreground">{t("lastName")}</FieldLabel>
            <FieldContent>
              <Input
                id="lastName"
                placeholder={t("lastNamePlaceholder")}
                disabled={isLoading}
                className="h-11 rounded-xl border-border text-sm text-foreground focus-visible:ring-brand-blue/20"
                {...form.register("lastName")}
              />
            </FieldContent>
            <FieldError className="text-xs text-brand-alert">{form.formState.errors.lastName?.message}</FieldError>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email" className="text-sm font-semibold text-foreground">{t("emailAddress")}</FieldLabel>
          <FieldContent>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                disabled={isLoading}
                className="h-11 rounded-xl border-brand-border pr-10 text-sm text-gray-900 dark:text-white focus-visible:ring-brand-blue/20 dark:focus-visible:ring-white/20"
                {...form.register("email")}
              />
              <Mail className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400 dark:text-white/40" />
            </div>
          </FieldContent>
          <FieldError className="text-xs text-brand-alert">{form.formState.errors.email?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="phone" className="text-sm font-semibold text-brand-dark">{t("phoneNumber")}</FieldLabel>
          <FieldContent>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                placeholder={t("phonePlaceholder")}
                disabled={isLoading}
                className="h-11 rounded-xl border-brand-border pr-10 text-sm text-gray-900 dark:text-white focus-visible:ring-brand-blue/20 dark:focus-visible:ring-white/20"
                {...form.register("phone")}
              />
              <Phone className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400 dark:text-white/40" />
            </div>
          </FieldContent>
          <FieldError className="text-xs text-brand-alert">{form.formState.errors.phone?.message}</FieldError>
        </Field>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => form.setValue("terms", checked === true, { shouldValidate: true })}
            className="mt-0.5 shrink-0"
          />
          <label htmlFor="terms" className="cursor-pointer text-xs leading-5 text-slate-500 dark:text-white/50">
            {t("agreeTermsPart1")}{" "}
            <Link href="/terms" className="font-semibold text-brand-blue dark:text-white hover:underline">{t("termsOfService")}</Link>{" "}
            {t("and")}{" "}
            <Link href="/privacy-policy" className="font-semibold text-brand-blue dark:text-white hover:underline">{t("privacyPolicy")}</Link>
            {t("agreeTermsPart2")}
          </label>
        </div>
        {form.formState.errors.terms && (
          <p className="text-xs text-brand-alert">{form.formState.errors.terms.message}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-bold text-white dark:bg-white dark:text-black hover:bg-brand-blue/90 dark:hover:bg-white/90"
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {t("creatingAccount")}</>
          ) : (
            <><ArrowRight className="h-4 w-4" /> {t("createFreeAccount")}</>
          )}
        </Button>
      </form>

      {/* Security row */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400 dark:text-white/40">
        <span className="flex items-center gap-1"><Lock size={10} /> {t("sslSecure")}</span>
        <span className="flex items-center gap-1"><Shield size={10} /> {t("noSpam")}</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={10} /> {t("freeToJoin")}</span>
      </div>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-white/50">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/sign-in" className="font-bold text-brand-blue dark:text-white hover:underline">{t("signIn")}</Link>
      </p>
    </div>
  );
}
