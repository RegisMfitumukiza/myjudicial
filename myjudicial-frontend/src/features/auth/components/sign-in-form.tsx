"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { signIn as authSignIn, signOut, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Mail, Shield, Lock, Loader2, Eye, EyeOff } from "lucide-react";
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
import { useTranslations, useLocale } from "next-intl";

const ADMIN_PORTAL_HOST = (process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com")
  .replace(/^https?:\/\//, "")
  .toLowerCase();

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim().toLowerCase(),
});

type SignInValues = z.infer<typeof signInSchema>;

const SIGNIN_DRAFT_KEY = "mj_signin_draft";

interface SigninDraft {
  email?: string;
  pendingEmail?: string | null;
  otpExpiresAt?: string | null;
  adminMode?: boolean;
}

interface SignInFormProps {
  defaultAdminMode?: boolean;
}

function getStoredTheme(): string {
  if (typeof window === "undefined") return "";
  try {
    const local = localStorage.getItem("theme");
    if (local && ["light", "dark", "system"].includes(local)) return local;
    const match = document.cookie.match(/(?:^|;\s*)mj_theme=([^;]+)/);
    if (match && match[1]) {
      const val = decodeURIComponent(match[1]);
      if (["light", "dark", "system"].includes(val)) return val;
    }
  } catch {}
  return "";
}

export function SignInForm({ defaultAdminMode = false }: SignInFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale() as 'en' | 'fr' | 'rw';
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
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpRemaining, setOtpRemaining] = useState<number | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);
  const [adminMode, setAdminMode] = useState(
    () => defaultAdminMode || searchParams.get("admin") === "1"
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [adminRememberMe, setAdminRememberMe] = useState(false);
  const isHydratedRef = useRef(false);

  const { data: session, status: sessionStatus } = useSession();

  // If already authenticated, redirect to callbackUrl or role dashboard immediately
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user && !(session as any)?.error) {
      if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") && !callbackUrl.startsWith("/\\")) {
        const hasLocale = new RegExp(`^/(en|fr|rw)(/|$)`).test(callbackUrl);
        router.replace(hasLocale ? callbackUrl : `/${locale}${callbackUrl}`);
      } else {
        const rawRole = (session.user as any)?.role;
        const normRole = rawRole ? String(rawRole).trim().toUpperCase() : undefined;
        const currentHost = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
        const isOnAdminPortal = defaultAdminMode || currentHost.startsWith("admin.") || currentHost === ADMIN_PORTAL_HOST;

        if (isOnAdminPortal) {
          if (normRole === "ADMIN" || !normRole) {
            router.replace("/admin/dashboard");
          } else {
            window.location.href = `https://www.myjudicial.com/${locale}/${normRole === "EXPERT" ? "expert" : "client"}/dashboard`;
          }
        } else {
          if (normRole === "ADMIN") {
            window.location.href = `https://${ADMIN_PORTAL_HOST}/${locale}/admin/dashboard`;
          } else if (normRole === "EXPERT") {
            router.replace("/expert/dashboard");
          } else {
            router.replace("/client/dashboard");
          }
        }
      }
    }
  }, [sessionStatus, session, callbackUrl, router, locale, defaultAdminMode]);

  // If user requests admin mode while on main host, immediately forward to admin portal
  // BEFORE they fill credentials so they never suffer double submission or theme reset.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentHost = window.location.hostname.toLowerCase();
    if (currentHost === ADMIN_PORTAL_HOST) {
      setAdminMode(true);
    } else if (process.env.NODE_ENV === "production" && searchParams.get("admin") === "1") {
      const currentLocale = locale || "en";
      const theme = getStoredTheme();
      const themeParam = theme ? `&theme=${encodeURIComponent(theme)}` : "";
      const cb = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
      window.location.href = `https://${ADMIN_PORTAL_HOST}/${currentLocale}/sign-in?admin=1${cb}${themeParam}`;
    }
  }, [searchParams, locale, callbackUrl]);

  const countdown = useCountdown(60);
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    setOtpRemaining(null);
    setOtpExpired(false);
    if (!otpExpiresAt) return;
    const expiresMs = new Date(otpExpiresAt).getTime();

    // Guard against client/server clock skew:
    // If client clock is set fast, diffSec might be <= 0 even though code was just generated.
    // Default to full 10-minute (600s) window in such cases.
    const diffSec = Math.floor((expiresMs - Date.now()) / 1000);
    const initialSec = diffSec > 0 ? diffSec : 600;
    setOtpRemaining(initialSec);

    const interval = setInterval(() => {
      setOtpRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setOtpExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
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
        try { sessionStorage.removeItem(SIGNIN_DRAFT_KEY); } catch {}
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

  const watchedEmail = form.watch("email");

  // 1. Restore draft on initial mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SIGNIN_DRAFT_KEY);
      if (raw) {
        const draft: SigninDraft = JSON.parse(raw);
        if (draft && typeof draft === "object") {
          if (typeof draft.email === "string" && draft.email) {
            form.setValue("email", draft.email);
          }
          if (typeof draft.adminMode === "boolean" && searchParams.get("admin") !== "1") {
            setAdminMode(draft.adminMode);
          }
          if (draft.pendingEmail) {
            const expiresMs = draft.otpExpiresAt ? new Date(draft.otpExpiresAt).getTime() : 0;
            if (!draft.otpExpiresAt || expiresMs > Date.now()) {
              setPendingEmail(draft.pendingEmail);
              if (draft.otpExpiresAt) setOtpExpiresAt(draft.otpExpiresAt);
            }
          }
        }
      }
    } catch {
      // Storage access blocked or invalid JSON
    } finally {
      isHydratedRef.current = true;
    }
  }, [form, searchParams]);

  // 2. Persist draft on field or stage changes
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      const currentEmail = form.getValues("email");
      if (!currentEmail && !pendingEmail) {
        sessionStorage.removeItem(SIGNIN_DRAFT_KEY);
        return;
      }
      sessionStorage.setItem(
        SIGNIN_DRAFT_KEY,
        JSON.stringify({
          email: currentEmail,
          pendingEmail,
          otpExpiresAt,
          adminMode,
        })
      );
    } catch {
      // Storage quota or restriction
    }
  }, [watchedEmail, pendingEmail, otpExpiresAt, adminMode, form]);

  async function requestOtp(values: SignInValues) {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    setUnregisteredEmail(null);
    const email = values.email.trim().toLowerCase();
    try {
      const response = await postAuthOtpSend({ email, language: locale });
      // Unwrap both the outer client envelope { data, status, headers } and the backend envelope { success, message, data }
      const resBody = (response as any)?.data ?? response;
      const resData = resBody?.data ?? resBody;

      const isRegistered = resData?.registered ?? resBody?.registered;
      const isAdmin = resData?.isAdmin ?? resBody?.isAdmin;
      const expiresAt = resData?.expiresAt ?? resBody?.expiresAt ?? null;
      const responseMsg = (resData?.message ?? resBody?.message ?? "") as string;

      // Account not found: gracefully guide user to sign up instead of trapping them in OTP
      if (isRegistered === false || responseMsg.toLowerCase().includes("no account found")) {
        setUnregisteredEmail(email);
        setError(null);
        toast.error(t("noAccountFound") || "No account found with this email. Please sign up to get started.");
        return;
      }

      // Admin account: direct to password-based admin login
      if (isAdmin) {
        setAdminMode(true);
        form.setValue("email", email);
        setError(t("adminDescription") || "Admin accounts sign in with email and password.");
        return;
      }

      setPendingEmail(email);
      setOtpCode("");
      setOtpExpiresAt(expiresAt);
      setOtpExpired(false);
      toast.success(t("codeSentCheckInbox"));
      countdown.start();
    } catch {
      setError(t("failedToSendCode"));
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp(codeParam?: string | unknown) {
    if (!pendingEmail) return;
    if (isVerifyingRef.current) return;
    const targetCode = (typeof codeParam === "string" && codeParam.trim().length === 6 ? codeParam.trim() : otpCode).trim();
    if (targetCode.length < 6) { setError(t("enterCompleteCode")); return; }
    isVerifyingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      // Purge any stale session cookie before new sign-in to prevent token contamination
      await signOut({ redirect: false }).catch(() => {});

      const result = await authSignIn("email-otp", {
        email: pendingEmail.trim().toLowerCase(),
        code: targetCode,
        rememberMe: String(rememberMe),
        redirect: false,
      });
      if (result?.error) {
        const code = result.code ?? result.error;
        if (code === "TooManyAttempts") {
          throw new Error(t("codeTooManyAttempts"));
        }
        if (code === "ServerError") {
          throw new Error(t("serverError") || "Server temporarily unavailable. Please try again.");
        }
        throw new Error(t("codeInvalidExpired"));
      }
      setOtpCode("");
      toast.success(t("signedInSuccessfully"));
      try { sessionStorage.removeItem(SIGNIN_DRAFT_KEY); } catch {}
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
      const res = await postAuthOtpSend({ email: pendingEmail, language: locale });
      const resBody = (res as any)?.data ?? res;
      const resData = resBody?.data ?? resBody;
      setOtpCode("");
      setError(null);
      setOtpExpiresAt(resData?.expiresAt ?? resBody?.expiresAt ?? null);
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
        const theme = getStoredTheme();
        const themeParam = theme ? `&theme=${encodeURIComponent(theme)}` : "";
        const cb = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
        window.location.href = `https://${ADMIN_PORTAL_HOST}/${locale}/sign-in?admin=1${cb}${themeParam}`;
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
      try { sessionStorage.removeItem(SIGNIN_DRAFT_KEY); } catch {}
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
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      const currentHost = window.location.hostname.toLowerCase();
      if (!adminMode && currentHost !== ADMIN_PORTAL_HOST) {
        const currentLocale = locale || "en";
        const theme = getStoredTheme();
        const themeParam = theme ? `&theme=${encodeURIComponent(theme)}` : "";
        const cb = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
        window.location.href = `https://${ADMIN_PORTAL_HOST}/${currentLocale}/sign-in?admin=1${cb}${themeParam}`;
        return;
      }
      if (adminMode && currentHost === ADMIN_PORTAL_HOST) {
        const currentLocale = locale || "en";
        const theme = getStoredTheme();
        const themeParam = theme ? `?theme=${encodeURIComponent(theme)}` : "";
        window.location.href = `https://www.myjudicial.com/${currentLocale}/sign-in${themeParam}`;
        return;
      }
    }
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
    setUnregisteredEmail(null);
    countdown.reset();
    try {
      sessionStorage.removeItem(SIGNIN_DRAFT_KEY);
    } catch {
      // ignore
    }
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
        {/* Back to sign in escape button */}
        <button
          type="button"
          onClick={resetEmailStep}
          className="group -ml-1 mb-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span>{t("backToRegular") || "Back to sign in"}</span>
        </button>

        {/* Centered mail icon matching admin auth page */}
        <div className="mb-6 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Mail className="h-7 w-7 text-foreground" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground">{t("checkInbox")}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("otpSentMessage", { email: pendingEmail })}
        </p>

        {message && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
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
              onComplete={(code) => verifyOtp(code)}
              disabled={isOtpLoading}
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
            disabled={isOtpLoading || otpCode.length < 6}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("verifying")}</>
            ) : (
              <><ArrowRight className="h-4 w-4" /> {t("verifyAndSignIn")}</>
            )}
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={resetEmailStep}
              className="font-medium text-foreground/80 hover:text-foreground underline underline-offset-4 transition-colors"
            >
              {t("useDifferentEmail")}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown.isActive || isResending}
              className="font-semibold text-brand-dark dark:text-white hover:underline disabled:opacity-40"
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

        {/* Helpful escape hatch: Not received? Sign up link pre-filled with email */}
        <div className="mt-6 pt-5 border-t border-border/60 text-center text-xs text-muted-foreground">
          <span>{t("dontHaveAccount")}{" "}</span>
          <Link
            href={`/sign-up?email=${encodeURIComponent(pendingEmail)}`}
            onClick={() => {
              try { sessionStorage.removeItem(SIGNIN_DRAFT_KEY); } catch {}
            }}
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            {t("createFreeAccount") || "Sign Up"}
          </Link>
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
                    className="h-11 rounded-xl border-border pr-10 text-sm text-foreground focus-visible:ring-foreground/20"
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
                    className="h-11 rounded-xl border-border pr-10 text-sm text-foreground focus-visible:ring-foreground/20"
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("completingSignIn")}</>
              ) : (
                <><Lock className="h-4 w-4" /> {t("signInAsAdmin")}</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleAdminMode}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              &larr; {t("backToRegular")}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold text-foreground">{t("welcomeBack")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("signInToAccess")}
          </p>

          {message && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              {message}
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Account Not Found Guided Action Banner */}
          {unregisteredEmail && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {t("noAccountFoundTitle") || "No account found"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("noAccountFoundDesc", { email: unregisteredEmail }) || (
                      <>
                        No registered account exists for <strong className="text-foreground">{unregisteredEmail}</strong>. If you are new to MyJudicial, please create an account to get started.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  asChild
                  size="sm"
                  className="bg-brand-dark text-on-brand font-semibold text-xs h-9 px-4 rounded-lg shadow-sm hover:opacity-90"
                >
                  <Link href={`/sign-up?email=${encodeURIComponent(unregisteredEmail)}`}>
                    {t("createFreeAccount") || "Create an account"} <ArrowRight size={13} className="ml-1" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 px-3 rounded-lg"
                  onClick={() => {
                    setUnregisteredEmail(null);
                    form.setFocus("email");
                  }}
                >
                  {t("checkSpelling") || "Check spelling"}
                </Button>
              </div>
            </div>
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
                    className="h-11 rounded-xl border-border pr-10 text-sm text-foreground focus-visible:ring-foreground/20"
                    {...form.register("email", {
                      onChange: () => {
                        if (unregisteredEmail) setUnregisteredEmail(null);
                      },
                    })}
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand shadow-sm hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("sending")}</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> {t("sendVerificationCode")}</>
              )}
            </Button>
          </form>

          {/* Security row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><Lock size={12} className="text-foreground" /> {tCommon("sslSecure")}</span>
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-foreground" /> {tCommon("noSpam")}</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-foreground" /> {tCommon("freeToJoin")}</span>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("dontHaveAccount")}{" "}
            <Link
              href={form.getValues("email") ? `/sign-up?email=${encodeURIComponent(form.getValues("email"))}` : "/sign-up"}
              className="font-semibold text-brand-dark dark:text-white hover:underline transition-colors"
            >
              {t("signUp")}
            </Link>
          </p>

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
