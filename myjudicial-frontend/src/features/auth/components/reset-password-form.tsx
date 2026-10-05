"use client";

import { useState, useMemo } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch } from "@/lib/api/client";

const baseResetPasswordSchema = z.object({
  password: z.string().min(12),
  confirmPassword: z.string().min(1),
});

type ResetPasswordValues = z.infer<typeof baseResetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("expertDashboard_reset-password-form");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => z.object({
    password: z
      .string()
      .min(12, t("minChars") || "Password must be at least 12 characters long.")
      .regex(/[A-Z]/, t("uppercaseReq") || "Include an uppercase letter.")
      .regex(/[a-z]/, t("lowercaseReq") || "Include a lowercase letter.")
      .regex(/[0-9]/, t("numberReq") || "Include a number."),
    confirmPassword: z.string().min(1, t("confirmPasswordReq") || "Please confirm your password."),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsMismatch") || "Passwords do not match.",
    path: ["confirmPassword"],
  }), [t]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setIsLoading(true);
    setError(null);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: {
          token,
          password: values.password,
        },
      });

      toast.success(t("successToast"));
      router.push("/sign-in?reset=true");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errorMsg");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{t("newPasswordHeading")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("newPasswordDescription")}
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="password" title={t("newPasswordLabel")} className="text-foreground">{t("newPasswordLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                className="border-border text-foreground focus-visible:ring-foreground/20"
                {...form.register("password")}
              />
            </FieldContent>
            <FieldError className="text-brand-alert">{form.formState.errors.password?.message}</FieldError>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("passwordRequirements")}
            </p>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword" title={t("confirmPasswordLabel")} className="text-foreground">{t("confirmPasswordLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="confirmPassword"
                type="password"
                disabled={isLoading}
                className="border-border text-foreground focus-visible:ring-foreground/20"
                {...form.register("confirmPassword")}
              />
            </FieldContent>
            <FieldError className="text-brand-alert">{form.formState.errors.confirmPassword?.message}</FieldError>
          </Field>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <Button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand shadow-sm hover:opacity-90 transition-opacity" type="submit" disabled={isLoading}>
            {isLoading ? t("resetting") : t("resetPasswordBtn")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="font-semibold text-brand-dark dark:text-white hover:underline transition-colors">
              {t("backToSignIn")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
