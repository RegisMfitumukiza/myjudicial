import { Link } from "@/i18n/routing";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { RegulatoryAlert } from "@/features/experts/dashboard-types";
import { useTranslations } from "next-intl";

interface RegulatoryAlertsProps {
  alerts: RegulatoryAlert[];
}

const SEVERITY_STYLES: Record<RegulatoryAlert["severity"], { border: string; bg: string; icon: string; title: string }> = {
  critical: {
    border: "border-red-200 dark:border-red-900/50",
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: "text-red-500",
    title: "text-red-600 dark:text-red-400",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-900/50",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "text-amber-500",
    title: "text-amber-600 dark:text-amber-400",
  },
};

export function RegulatoryAlerts({ alerts }: RegulatoryAlertsProps) {
  const t = useTranslations("expertDashboard");
  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-alert/10">
          <ShieldAlert size={14} className="text-brand-alert" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("title")}</p>
      </div>
      <div className="mt-4 space-y-2.5">
        {alerts.length === 0 && (
          <p className="py-2 text-center text-xs text-gray-400 dark:text-gray-500">
            {t("noIssues")}
          </p>
        )}
        {alerts.map((alert) => {
          const styles = SEVERITY_STYLES[alert.severity];
          return (
            <div key={alert.id} className={`rounded-lg border p-3 transition-colors hover:shadow-sm ${styles.border} ${styles.bg}`}>
              <div className="mb-1 flex items-center gap-1.5">
                <AlertCircle size={12} className={styles.icon} />
                <p className={`text-xs font-bold ${styles.title}`}>{alert.title}</p>
              </div>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{alert.message}</p>
              {alert.href && (
                <Link
                  href={alert.href}
                  className={`mt-2 inline-block text-xs font-semibold underline ${styles.title}`}
                >
                  {t("takeAction")}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
