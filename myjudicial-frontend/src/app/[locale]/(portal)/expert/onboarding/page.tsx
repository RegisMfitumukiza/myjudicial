import { UserRole } from "@/features/auth/types";
import { ExpertOnboardingWizard } from "@/features/experts/components/expert-onboarding-wizard";
import { requireRole } from "@/server/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExpertOnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole([UserRole.EXPERT], locale);

  return <ExpertOnboardingWizard fullName={session.user.fullName} />;
}

