import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const t = useTranslations("errors.notFound");

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-canvas px-6 py-12 text-brand-dark">
      <section className="w-full max-w-md space-y-5 text-center">
        <p className="text-sm font-semibold uppercase text-brand-blue">{t("badge")}</p>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm leading-6 text-slate-600">
          {t("description")}
        </p>
        <Button asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </section>
    </main>
  );
}