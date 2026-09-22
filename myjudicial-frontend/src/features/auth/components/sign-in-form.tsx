"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { signIn as authSignIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Mail, Shield, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { OtpInput } from "@/components/otp-input";
import { postAuthOtpSend } from "@/api/generated";
import { useCountdown } from "@/hooks/use-countdown";
import { useTranslations } from "next-intl";

const ADMIN_PORTAL_HOST = (process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com")
  .replace(/^https?:\/\//, "")
  .toLowerCase();

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim().toLowerCase(),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const magicLinkHandledRef = useRef(false);
  const callbackUrl = searchParams.get("callbackUrl");
  const postAuthPath = callbackUrl ? `/post-auth?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/post-auth";
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(() => {
    if (searchParams.get("registered")) return t("accountCreatedVerify");
    if (searchParams.get("reset")) return t("passwordUpdated");
    if (searchParams.get("type") === "magic") return t("completingSignIn");
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const verifyOtpRef = useRef(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpRemaining, setOtpRemaining] = useState<number | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);
  const [adminMode, setAdminMode] = useState(() => searchParams.get("admin") === "1");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [adminRememberMe, setAdminRememberMe] = useState(false);

  const countdown = useCountdown(60);
  const isVerifyingRef = useRef(false);

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

  useEffect(() => {
    const token = searchParams.get("token");
    const isMagicLink = searchParams.get("type") === "magic";
    if (!token || !isMagicLink || magicLinkHandledRef.current) return;
    magicLinkHandledRef.current = true;
    setIsLoading(true);
    setError(null);
    setMessage(t("completingSignIn"));
    authSignIn("email-magic", { token, redirect: false })
      .then((result) => {
        if (result?.error) throw new Error(t("magicLinkInvalid"));
        toast.success(t("signedInSuccessfully"));
        router.push(`${postAuthPath}${postAuthPath.includes("?") ? "&" : "?"}email_verified=1`);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : t("magicLinkFailed");
        setError(msg);
        toast.error(msg);
        setMessage(null);
      })
      .finally(() => setIsLoading(false));
  }, [router, searchParams, postAuthPath, t]);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "" },
  });

  async function requestOtp(values: SignInValues) {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    const email = values.email.trim().toLowerCase();
    try {
      const response = await postAuthOtpSend({ email });
      setPendingEmail(email);
      setOtpCode("");
      setOtpExpiresAt((response as any).data?.expiresAt ?? null);
      setOtpExpired(false);
      toast.success(t("codeSentCheckInbox"));
      countdown.start();
    } catch {
      setError(t("failedToSendCode"));
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp() {
    if (!pendingEmail) return;
    if (isVerifyingRef.current) return;
    if (otpExpired) { setError(t("codeExpiredRequestNew")); return; }
    if (otpCode.length < 6) { setError(t("enterCompleteCode")); return; }
    isVerifyingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const result = await authSignIn("email-otp", {
        email: pendingEmail,
        code: otpCode,
        rememberMe: String(rememberMe),
        redirect: false,
      });
      if (result?.error) {
        const code = result.code ?? result.error;
        if (code === "TooManyAttempts") {
          throw new Error(t("codeTooManyAttempts"));
        }
        throw new Error(t("codeInvalidExpired"));
      }
      setOtpCode("");
      toast.success(t("signedInSuccessfully"));
      router.push(postAuthPath);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : t("emailVerificationFailed");
      setOtpCode("");
      setError(msg);
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
    } catch {
      toast.error(t("failedToResend"));
    } finally {
      setIsResending(false);
    }
  }

  async function handleAdminSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (isVerifyingRef.current) return;
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      const currentHost = window.location.hostname.toLowerCase();
      if (currentHost !== ADMIN_PORTAL_HOST) {
        const locale = window.location.pathname.split("/")[1] || "en";
        const cb = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
        window.location.href = `https://${ADMIN_PORTAL_HOST}/${locale}/sign-in?admin=1${cb}`;
        return;
      }
    }
    isVerifyingRef.current = true;
    setIsLoading(true);
    setError(null);
    const email = form.getValues("email").trim().toLowerCase();
    try {
      const result = await authSignIn("admin-password", {
        email,
        password,
        rememberMe: String(adminRememberMe),
        redirect: false,
      });
      if (result?.error) {
        const code = result.code ?? result.error;
        if (code === "TooManyLoginAttempts") {
          throw new Error(t("loginTooManyAttempts"));
        }
        throw new Error(code === "CredentialsSignin" ? t("invalidCredentials") : t("adminSignInFailed"));
      }
      toast.success(t("signedInAsAdmin"));
      router.push(postAuthPath);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : t("adminSignInFailed");
      setError(msg);
    } finally {
      setIsLoading(false);
      isVerifyingRef.current = false;
    }
  }

  function toggleAdminMode() {
    setAdminMode(!adminMode);
    setError(null);
    setMessage(null);
    setPassword("");
    setShowPassword(false);
  }

  function resetEmailStep() {
    setPendingEmail(null);
    setOtpCode("");
    setError(null);
    setMessage(null);
    setOtpExpiresAt(null);
    setOtpExpired(false);
    countdown.reset();
  }

  const isOtpLoading = isLoading || isResending;

  if (isLoading && pendingEmail === null && !searchParams.get("token")) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-14 rounded-2xl bg-muted" />
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-72 bg-muted" />
        <div className="space-y-3">
          <Skeleton className="h-11 w-full rounded-xl bg-muted" />
          <Skeleton className="h-12 w-full rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (pendingEmail) {
    return (
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10">
          <Mail className="h-7 w-7 text-brand-blue" />
        </div>
          <h1 className="text-2xl font-extrabold text-foreground">{t("checkInbox")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("otpSentMessage", { email: pendingEmail })}
          </p>

          {message && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
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
              <label className="mb-2 block text-sm font-semibold text-foreground">{t("verificationCode")}</label>
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={verifyOtp}
                disabled={isOtpLoading || otpExpired}
                error={error}
              />
            </div>

            <div className="flex items-start space-x-2.5 pt-1">
              <Checkbox
                id="otp-remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="otp-remember"
                  className="text-xs font-semibold text-foreground cursor-pointer select-none block"
                >
                  {t("keepMeSignedIn")}
                </label>
                <p className="text-[11px] text-muted-foreground select-none">
                  {t("keepMeSignedInHint")}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isOtpLoading || otpCode.length < 6 || otpExpired}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand hover:bg-brand-dark/90 disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("verifying")}</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> {t("verifyAndSignIn")}</>
              )}
            </Button>

            <div className="flex items-center justify-between">
              <button type="button" onClick={resetEmailStep} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                {t("useDifferentEmail")}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown.isActive || isResending}
                className="text-xs font-semibold text-brand-blue hover:text-foreground disabled:text-muted-foreground"
              >
                {isResending ? t("resending") : countdown.isActive ? t("resendIn", { seconds: countdown.remaining }) : t("resendCode")}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-3">
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
            {otpExpired
              ? t("codeExpired")
              : otpRemaining !== null
                ? t("codeExpiresIn", { minutes: Math.floor(otpRemaining / 60) })
                : t("codeExpiresIn", { minutes: 10 })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {adminMode ? (
        <>
          <div className="mb-6 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Lock className="h-7 w-7 text-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{t("adminSignIn")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("adminDescription")}
          </p>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAdminSignIn} className="mt-7 space-y-4">
            <Field>
              <FieldLabel htmlFor="admin-email" className="text-sm font-semibold text-foreground">
                {t("adminEmail")}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="support@myjudicial.com"
                    disabled={isLoading}
                    className="h-11 rounded-xl border-border pr-10 text-sm text-foreground focus-visible:ring-brand-blue/20"
                    {...form.register("email")}
                  />
                  <Mail className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </FieldContent>
              <FieldError className="text-xs text-brand-alert">
                {form.formState.errors.email?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-password" className="text-sm font-semibold text-foreground">
                {t("password")}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("enterPassword")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-border pr-10 text-sm text-foreground focus-visible:ring-brand-blue/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FieldContent>
            </Field>

            <div className="flex items-center space-x-2 py-1">
              <Checkbox
                id="admin-remember"
                checked={adminRememberMe}
                onCheckedChange={(checked) => setAdminRememberMe(Boolean(checked))}
              />
              <label
                htmlFor="admin-remember"
                className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none"
              >
                {t("rememberMe")}
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !form.getValues("email") || !password}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand hover:bg-brand-dark/90 disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("completingSignIn")}</>
              ) : (
                <><Lock className="h-4 w-4" /> {t("signInAsAdmin")}</>
              )}
            </Button>
          </form>

          {searchParams.get("admin") === "1" && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleAdminMode}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                &larr; {t("backToRegular")}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold text-foreground">{t("welcomeBack")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("signInToAccess")}
          </p>

          {message && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
              {message}
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email form */}
          <form onSubmit={form.handleSubmit(requestOtp)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="email" className="text-sm font-semibold text-foreground">
                {t("emailAddress")}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isLoading}
                    className="h-11 rounded-xl border-border pr-10 text-sm text-foreground focus-visible:ring-brand-blue/20"
                    {...form.register("email")}
                  />
                  <Mail className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </FieldContent>
              <FieldError className="text-xs text-brand-alert">
                {form.formState.errors.email?.message}
              </FieldError>
            </Field>

            <div className="flex items-start space-x-2.5 pt-1 pb-1">
              <Checkbox
                id="email-remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="email-remember"
                  className="text-xs font-semibold text-foreground cursor-pointer select-none block"
                >
                  {t("keepMeSignedIn")}
                </label>
                <p className="text-[11px] text-muted-foreground select-none">
                  {t("keepMeSignedInHint")}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand hover:bg-brand-dark/90"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("sending")}</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> {t("sendVerificationCode")}</>
              )}
            </Button>
          </form>

          {/* Security row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Lock size={10} /> {tCommon("sslSecure")}</span>
            <span className="flex items-center gap-1"><Shield size={10} /> {tCommon("noSpam")}</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={10} /> {tCommon("freeToJoin")}</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">{t("dontHaveAccount")}</span>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-border bg-card shadow-sm text-foreground hover:bg-muted"
            >
              {t("signUp")}
            </Link>
          </div>

          {searchParams.get("admin") === "1" && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={toggleAdminMode}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("adminSignIn")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
