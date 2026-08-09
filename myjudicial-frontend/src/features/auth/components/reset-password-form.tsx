"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch } from "@/lib/api/client";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(12, "Password must be at least 12 characters long.")
    .regex(/[A-Z]/, "Include an uppercase letter.")
    .regex(/[a-z]/, "Include a lowercase letter.")
    .regex(/[0-9]/, "Include a number."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("expertDashboard_reset-password-form");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
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
    <Card className="border-brand-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold text-brand-dark">{t("newPasswordHeading")}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("newPasswordDescription")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="password" title={t("newPasswordLabel")} className="text-brand-dark">{t("newPasswordLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                className="border-brand-border focus-visible:ring-brand-blue/20"
                {...form.register("password")}
              />
            </FieldContent>
            <FieldError className="text-brand-alert">{form.formState.errors.password?.message}</FieldError>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("passwordRequirements")}
            </p>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword" title={t("confirmPasswordLabel")} className="text-brand-dark">{t("confirmPasswordLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="confirmPassword"
                type="password"
                disabled={isLoading}
                className="border-brand-border focus-visible:ring-brand-blue/20"
                {...form.register("confirmPassword")}
              />
            </FieldContent>
            <FieldError className="text-brand-alert">{form.formState.errors.confirmPassword?.message}</FieldError>
          </Field>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full bg-brand-dark text-on-brand hover:bg-brand-dark/90" type="submit" disabled={isLoading}>
            {isLoading ? t("resetting") : t("resetPasswordBtn")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
