import { requireAuth } from "@/server/auth/guards";
import { BarChart3, Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/shared/components/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAuth();
  const t = await getTranslations("expertDashboard_analytics");
  const tc = await getTranslations("expertDashboard");

  return (
    <div className="p-6 lg:p-8">
      <EmptyState
        icon={BarChart3}
        title={t("title")}
        description="Detailed analytics including revenue trends, client demographics, and performance metrics will be available once sufficient booking history is accumulated."
        className="py-24"
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
            <Construction size={14} aria-hidden="true" />
            {tc("comingSoon")}
          </span>
        }
      />
    </div>
  );
}
