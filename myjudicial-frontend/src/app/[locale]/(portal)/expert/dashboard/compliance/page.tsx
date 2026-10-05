import { redirect } from "next/navigation";

export default async function ExpertCompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/expert/dashboard/verification`);
}
