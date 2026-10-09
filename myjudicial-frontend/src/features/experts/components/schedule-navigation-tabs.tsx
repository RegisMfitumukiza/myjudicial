"use client";

import { usePathname, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Clock, SlidersHorizontal, CalendarDays, ExternalLink } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useExpertProfile } from "@/features/experts/hooks/useExpertProfile";
import { cn } from "@/lib/utils";

export function ScheduleNavigationTabs({ className }: { className?: string }) {
  const t = useTranslations("expertDashboard_scheduleHub");
  const pathname = usePathname();
  const { data: profile } = useExpertProfile();

  const tabs = [
    {
      href: "/expert/dashboard/availability",
      label: t("weeklyHours"),
      icon: Clock,
      exact: true,
    },
    {
      href: "/expert/dashboard/schedule-settings",
      label: t("bookingRules"),
      icon: SlidersHorizontal,
      exact: true,
    },
    {
      href: "/expert/dashboard/availability-overrides",
      label: t("dateOverrides"),
      icon: CalendarDays,
      exact: true,
    },
  ];

  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4", className)}>
      {/* Segmented Pill Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/60 w-fit max-w-full overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                isActive
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Preview Public Calendar Button */}
      {profile?.id && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl border-border/80 text-xs font-medium hover:bg-accent hover:text-accent-foreground shadow-xs gap-1.5 h-8.5"
          >
            <a
              href={`/lawyers/${profile.id}/book`}
              target="_blank"
              rel="noopener noreferrer"
              title={t("previewPublicCalendar")}
            >
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              <span>{t("previewPublicCalendar")}</span>
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
