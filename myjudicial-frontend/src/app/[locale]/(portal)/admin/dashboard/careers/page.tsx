import { redirect } from "next/navigation";

export default async function AdminCareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/dashboard/content?tab=careers`);
}
