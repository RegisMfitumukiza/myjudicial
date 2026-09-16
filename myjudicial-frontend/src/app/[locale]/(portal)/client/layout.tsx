import { UserRole } from "@/features/auth/types";
import { requireRole } from "@/server/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole([UserRole.CITIZEN], locale);
  return <>{children}</>;
}
