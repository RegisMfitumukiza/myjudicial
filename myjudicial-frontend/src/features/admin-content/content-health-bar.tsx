"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  Globe,
  Image as ImageIcon,
  Layers,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { ContentLocale } from "@/lib/api/content-pages";
import type { ContentQualityReport, QualityCategory } from "./content-quality";

interface ContentHealthBarProps {
  report: ContentQualityReport;
  locale: ContentLocale;
  onInspect: () => void;
}

export function ContentHealthBar({ report, locale, onInspect }: ContentHealthBarProps) {
  const { score, status, criticalCount, warningCount, categoryBreakdown } = report;

  const totalIssues = criticalCount + warningCount;

  const statusBadge = useMemo(() => {
    if (status === "passed") {
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        icon: <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        label: "Ready to Publish",
      };
    }
    if (status === "warning") {
      return {
        bg: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />,
        label: `${warningCount} Warning${warningCount > 1 ? "s" : ""}`,
      };
    }
    return {
      bg: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />,
      label: `${criticalCount} Blocking Issue${criticalCount > 1 ? "s" : ""}`,
    };
  }, [status, criticalCount, warningCount]);

  const categories: Array<{ id: QualityCategory; label: string; icon: React.ReactNode }> = [
    { id: "seo", label: "SEO", icon: <Globe className="h-3 w-3" /> },
    { id: "images", label: "Images", icon: <ImageIcon className="h-3 w-3" /> },
    { id: "links", label: "Links", icon: <Link2 className="h-3 w-3" /> },
    ...(locale !== "en"
      ? [{ id: "translations" as QualityCategory, label: "Localization", icon: <Globe className="h-3 w-3" /> }]
      : []),
    { id: "validity", label: "Structure", icon: <Layers className="h-3 w-3" /> },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-3 sm:px-4 backdrop-blur-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadge.bg}`}
        >
          {statusBadge.icon}
          <span>Health: {score}/100</span>
          <span className="text-[11px] opacity-80">· {statusBadge.label}</span>
        </div>

        {/* Category status indicators */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          {categories.map((cat) => {
            const catData = categoryBreakdown[cat.id];
            const isError = catData.status === "error";
            const isWarning = catData.status === "warning";

            return (
              <span
                key={cat.id}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                  isError
                    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                    : isWarning
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                    : "border-border/70 bg-muted/40 text-muted-foreground"
                }`}
              >
                {cat.icon}
                {cat.label}
                {catData.count > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1 text-[10px] font-bold ${
                      isError ? "bg-rose-200 text-rose-900" : "bg-amber-200 text-amber-900"
                    }`}
                  >
                    {catData.count}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onInspect}
        className="h-8 text-xs font-semibold shrink-0 gap-1.5"
      >
        <FileSearch className="h-3.5 w-3.5 text-primary" />
        <span>Preflight Audit</span>
        {totalIssues > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              criticalCount > 0
                ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            }`}
          >
            {totalIssues}
          </span>
        )}
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );
}
