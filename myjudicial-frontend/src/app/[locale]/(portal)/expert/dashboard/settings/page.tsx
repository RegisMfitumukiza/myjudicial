import { redirect } from "next/navigation";

export default async function ExpertSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/expert/dashboard/profile#preferences`);
}
