"use client";

import { useState, useMemo } from "react";
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

export function ForgotPasswordForm() {
  const t = useTranslations("expertDashboard_forgot-password-form");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => z.object({
    email: z.string().email(t("emailInvalid") || "Please enter a valid email address."),
  }), [t]);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

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
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10">
            <CheckCircle2 className="h-7 w-7 text-brand-blue" />
          </span>
        </div>
        <h1 className="mb-2 text-[22px] font-bold text-brand-dark">{t("checkEmail")}</h1>
        <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
          {t("emailSentMsg1")}{" "}
          <span className="font-semibold text-brand-dark">{form.getValues("email")}</span>
          {t("emailSentMsg2")}
        </p>

        {devToken && (
          <div className="mb-5 rounded-lg border border-brand-border bg-muted p-4 text-left">
            <p className="mb-1 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              {t("devModeReset")}
            </p>
            <Link
              href={`/reset-password/${devToken}`}
              className="break-all text-sm font-medium text-brand-blue underline hover:text-brand-dark"
            >
              {`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/reset-password/${devToken}`}
            </Link>
          </div>
        )}

        <Button
          asChild
          className="h-11 w-full rounded-lg bg-brand-dark text-sm font-semibold text-on-brand hover:bg-brand-dark/90"
        >
          <Link href="/sign-in">{t("backToSignIn")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 space-y-1.5">
        <h1 className="text-[22px] font-bold text-brand-dark">{t("accountRecovery")}</h1>
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
          <FieldLabel htmlFor="email" className="text-sm font-medium text-brand-dark">
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
                className="h-11 rounded-lg border-brand-border pl-9 text-sm focus-visible:ring-brand-blue/20"
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
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-dark text-sm font-semibold text-on-brand hover:bg-brand-dark/90"
        >
          {isLoading ? t("sendingLink") : t("sendResetLink")}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("rememberEmail")}{" "}
        <Link href="/sign-in" className="font-semibold text-brand-blue hover:underline">
          {t("signInHere")}
        </Link>
      </p>
    </div>
  );
}
