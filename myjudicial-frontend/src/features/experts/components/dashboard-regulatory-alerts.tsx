import { Link } from "@/i18n/routing";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { RegulatoryAlert } from "@/features/experts/dashboard-types";
import { useTranslations } from "next-intl";

interface RegulatoryAlertsProps {
  alerts: RegulatoryAlert[];
}

const SEVERITY_STYLES: Record<RegulatoryAlert["severity"], { border: string; bg: string; icon: string; title: string; action: string }> = {
  critical: {
    border: "border-destructive/30",
    bg: "bg-destructive/5",
    icon: "text-destructive",
    title: "text-destructive",
    action: "text-destructive",
  },
  warning: {
    border: "border-warning/30",
    bg: "bg-warning/10",
    icon: "text-warning",
    title: "text-warning",
    action: "text-primary",
  },
};

export function RegulatoryAlerts({ alerts }: RegulatoryAlertsProps) {
  const t = useTranslations("expertDashboard");
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm min-w-0">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
          <ShieldAlert size={14} className="text-warning" aria-hidden="true" />
        </div>
        <p className="text-base font-semibold tracking-tight text-foreground">{t("title")}</p>
      </div>
      <div className="mt-4 space-y-2.5">
        {alerts.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noIssues")}
          </p>
        )}
        {alerts.map((alert) => {
          const styles = SEVERITY_STYLES[alert.severity];
          return (
            <div key={alert.id} className={`rounded-lg border ${styles.border} ${styles.bg} p-3 transition-colors hover:shadow-sm`}>
              <div className="mb-1 flex items-center gap-1.5">
                <AlertCircle size={12} className={styles.icon} aria-hidden="true" />
                <p className={`text-xs font-semibold ${styles.title}`}>{alert.title}</p>
              </div>
              <p className="text-xs leading-relaxed text-foreground">{alert.message}</p>
              {alert.href && (
                <Link
                  href={alert.href}
                  className={`mt-2 inline-block text-xs font-medium underline-offset-2 hover:underline ${styles.action}`}
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
