import { requireAuth } from "@/server/auth/guards";
import { BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAuth();
  const t = await getTranslations("expertDashboard_analytics");

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 py-24 text-center">
        <BarChart3 size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {t("comingSoon") ?? "Analytics Coming Soon"}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {t("analyticsPlaceholder") ?? "Detailed analytics including revenue trends, client demographics, and performance metrics will be available once sufficient booking history is accumulated."}
        </p>
      </div>
    </div>
  );
}
