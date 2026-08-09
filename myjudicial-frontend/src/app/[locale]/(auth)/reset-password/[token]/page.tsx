import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  return (
    <AuthShell>
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
