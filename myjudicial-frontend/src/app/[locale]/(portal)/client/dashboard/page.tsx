import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAuth } from "@/server/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host")?.split(",")[0] ?? headerList.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const adminHost = (process.env.ADMIN_PORTAL_HOST ?? process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com").toLowerCase().replace(/^https?:\/\//, "");
  if (host === adminHost || host.startsWith("admin.")) {
    redirect(`/${locale}/admin/dashboard`);
  }

  const session = await requireAuth(locale);
  const normRole = session.user.role ? String(session.user.role).trim().toUpperCase() : "";

  if (normRole === "EXPERT") redirect(`/${locale}/expert/dashboard`);
  if (normRole === "ADMIN")  redirect(`/${locale}/admin/dashboard`);

  redirect(`/${locale}/client/dashboard/home`);
}
