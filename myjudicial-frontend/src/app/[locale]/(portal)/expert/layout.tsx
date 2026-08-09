import { UserRole } from "@/features/auth/types";
import { requireRole } from "@/server/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole([UserRole.EXPERT]);
  return <>{children}</>;
}
