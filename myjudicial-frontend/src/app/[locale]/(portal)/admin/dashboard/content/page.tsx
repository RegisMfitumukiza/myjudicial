import { redirect } from "next/navigation";

export default async function AdminContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/dashboard/settings?tab=legal`);
}
