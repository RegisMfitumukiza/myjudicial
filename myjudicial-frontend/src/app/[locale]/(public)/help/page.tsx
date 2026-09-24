import { redirect } from "@/i18n/routing";

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/faqs", locale });
}
