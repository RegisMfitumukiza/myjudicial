import { redirect } from "@/i18n/routing";

export default async function ExpertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Legacy route — redirect to lawyer discovery search page
  redirect({ href: "/search", locale });
}
