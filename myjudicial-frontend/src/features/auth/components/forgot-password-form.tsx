"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";

const baseForgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordValues = z.infer<typeof baseForgotPasswordSchema>;

const FORGOT_PASSWORD_DRAFT_KEY = "mj_forgot_password_draft";

interface ForgotPasswordDraft {
  email?: string;
  success?: boolean;
  devToken?: string | null;
}

export function ForgotPasswordForm() {
  const t = useTranslations("expertDashboard_forgot-password-form");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isHydratedRef = useRef(false);

  const schema = useMemo(() => z.object({
    email: z.string().email(t("emailInvalid") || "Please enter a valid email address."),
  }), [t]);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const watchedEmail = form.watch("email");

  // 1. Restore draft on initial mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FORGOT_PASSWORD_DRAFT_KEY);
      if (raw) {
        const draft: ForgotPasswordDraft = JSON.parse(raw);
        if (draft && typeof draft === "object") {
          if (typeof draft.email === "string" && draft.email) {
            form.setValue("email", draft.email);
          }
          if (draft.success) {
            setSuccess(true);
            if (draft.devToken) setDevToken(draft.devToken);
          }
        }
      }
    } catch {
      // Storage access blocked or invalid JSON
    } finally {
      isHydratedRef.current = true;
    }
  }, [form]);

  // 2. Persist draft on change
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      const currentEmail = form.getValues("email");
      if (!currentEmail && !success) {
        sessionStorage.removeItem(FORGOT_PASSWORD_DRAFT_KEY);
        return;
      }
      sessionStorage.setItem(
        FORGOT_PASSWORD_DRAFT_KEY,
        JSON.stringify({
          email: currentEmail,
          success,
          devToken,
        })
      );
    } catch {
      // Ignore
    }
  }, [watchedEmail, success, devToken, form]);

  async function onSubmit(values: ForgotPasswordValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: values,
      }) as { data?: { devPasswordResetToken?: string } };
      if ((res as any).data?.devPasswordResetToken) {
        setDevToken((res as any).data.devPasswordResetToken);
      }
      setSuccess(true);
      toast.success(t("successToast"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errorMsg");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <div className="mb-5 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-foreground">
            <CheckCircle2 className="h-7 w-7 text-foreground" />
          </span>
        </div>
        <h1 className="mb-2 text-[22px] font-bold text-foreground">{t("checkEmail")}</h1>
        <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
          {t("emailSentMsg1")}{" "}
          <span className="font-semibold text-foreground">{form.getValues("email")}</span>
          {t("emailSentMsg2")}
        </p>

        {devToken && (
          <div className="mb-5 rounded-lg border border-border bg-muted p-4 text-left">
            <p className="mb-1 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              {t("devModeReset")}
            </p>
            <Link
              href={`/reset-password/${devToken}`}
              className="break-all text-sm font-medium text-brand-dark dark:text-white underline hover:opacity-80"
            >
              {`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/reset-password/${devToken}`}
            </Link>
          </div>
        )}

        <Button
          asChild
          className="h-12 w-full rounded-xl bg-brand-dark text-sm font-bold text-on-brand shadow-sm hover:opacity-90 transition-opacity"
        >
          <Link
            href="/sign-in"
            onClick={() => {
              try {
                sessionStorage.removeItem(FORGOT_PASSWORD_DRAFT_KEY);
              } catch {}
            }}
          >
            {t("backToSignIn")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 space-y-1.5">
        <h1 className="text-[22px] font-bold text-foreground">{t("accountRecovery")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("emailVerificationPrimary")}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Field>
          <FieldLabel htmlFor="email" className="text-sm font-medium text-foreground">
            {t("emailAddress")}
          </FieldLabel>
          <FieldContent>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                disabled={isLoading}
                className="h-11 rounded-lg border-border pl-9 text-sm text-foreground focus-visible:ring-foreground/20"
                {...form.register("email")}
              />
            </div>
          </FieldContent>
          <FieldError className="text-brand-alert text-xs">
            {form.formState.errors.email?.message}
          </FieldError>
        </Field>

        <Button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand shadow-sm hover:opacity-90 transition-opacity"
        >
          {isLoading ? t("sendingLink") : t("sendResetLink")}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("rememberEmail")}{" "}
        <Link href="/sign-in" className="font-semibold text-brand-dark dark:text-white hover:underline transition-colors">
          {t("signInHere")}
        </Link>
      </p>
    </div>
  );
}
