import { redirect } from "next/navigation";

export default async function LegacyAvailabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/expert/dashboard/availability`);
}
