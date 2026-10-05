import { redirect } from "@/i18n/routing";

export default async function ExpertBookRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect({ href: `/lawyers/${id}/book`, locale });
}
