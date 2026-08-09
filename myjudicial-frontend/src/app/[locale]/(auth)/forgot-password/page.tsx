import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("expertDashboard_forgot-password-form");
  return (
    <AuthShell>
      <div className="space-y-6">
        <section className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-brand-dark">{t("accountRecovery")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("emailVerificationPrimary")}
          </p>
        </section>
        <ForgotPasswordForm />
      </div>
    </AuthShell>
  );
}
