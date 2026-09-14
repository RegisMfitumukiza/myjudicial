import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAuth(locale);

  if (session.user.role === "EXPERT") redirect(`/${locale}/expert/dashboard`);
  if (session.user.role === "ADMIN")  redirect(`/${locale}/admin/dashboard`);

  redirect(`/${locale}/client/dashboard/home`);
}
