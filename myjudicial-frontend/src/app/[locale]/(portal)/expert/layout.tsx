import type { Metadata } from 'next';
import { UserRole } from "@/features/auth/types";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExpertLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole([UserRole.EXPERT], locale);
  return <>{children}</>;
}
