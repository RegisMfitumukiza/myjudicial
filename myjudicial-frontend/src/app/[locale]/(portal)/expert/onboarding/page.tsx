import { UserRole } from "@/features/auth/types";
import { ExpertOnboardingWizard } from "@/features/experts/components/expert-onboarding-wizard";
import { requireRole } from "@/server/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExpertOnboardingPage() {
  const session = await requireRole([UserRole.EXPERT]);

  return <ExpertOnboardingWizard fullName={session.user.fullName} />;
}

