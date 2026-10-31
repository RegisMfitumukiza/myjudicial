"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Info,
  Layers,
  Link2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { ContentQualityReport, QualityCategory, QualityIssue } from "./content-quality";

interface PreflightAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ContentQualityReport;
  onPublishAnyway?: () => void;
  isPublishingMode?: boolean;
  publishing?: boolean;
}

export function PreflightAuditDialog({
  open,
  onOpenChange,
  report,
  onPublishAnyway,
  isPublishingMode = false,
  publishing = false,
}: PreflightAuditDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | QualityCategory>("all");

  const filteredIssues = useMemo(() => {
    if (selectedCategory === "all") return report.issues;
    return report.issues.filter((issue) => issue.category === selectedCategory);
  }, [report.issues, selectedCategory]);

  const hasBlockingErrors = report.criticalCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Content Preflight Quality Audit
            </DialogTitle>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                report.status === "passed"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  : report.status === "warning"
                  ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                  : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              Health Score: {report.score}/100
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Automated verification of SEO metadata, image validity, link integrity, structural
            completeness, and translation parity.
          </DialogDescription>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                Critical Issues
              </p>
              <p
                className={`text-lg font-bold ${
                  report.criticalCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                }`}
              >
                {report.criticalCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Warnings</p>
              <p
                className={`text-lg font-bold ${
                  report.warningCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                }`}
              >
                {report.warningCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                Total Checks
              </p>
              <p className="text-lg font-bold text-foreground">
                {report.issues.length === 0 ? "Clean" : report.issues.length}
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-5 py-2 border-b border-border bg-muted/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <Button
            type="button"
            variant={selectedCategory === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="h-7 text-xs px-2.5"
          >
            All ({report.issues.length})
          </Button>
          <Button
            type="button"
            variant={selectedCategory === "seo" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("seo")}
            className="h-7 text-xs px-2.5"
          >
            SEO ({report.categoryBreakdown.seo.count})
          </Button>
          <Button
            type="button"
            variant={selectedCategory === "images" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("images")}
            className="h-7 text-xs px-2.5"
          >
            Images ({report.categoryBreakdown.images.count})
          </Button>
          <Button
            type="button"
            variant={selectedCategory === "links" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("links")}
            className="h-7 text-xs px-2.5"
          >
            Links ({report.categoryBreakdown.links.count})
          </Button>
          <Button
            type="button"
            variant={selectedCategory === "translations" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("translations")}
            className="h-7 text-xs px-2.5"
          >
            Translation ({report.categoryBreakdown.translations.count})
          </Button>
          <Button
            type="button"
            variant={selectedCategory === "validity" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("validity")}
            className="h-7 text-xs px-2.5"
          >
            Structure ({report.categoryBreakdown.validity.count})
          </Button>
        </div>

        {/* Issues List Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-sm text-foreground">No Issues Detected</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Content in this category meets all platform quality and accessibility standards.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isError = issue.severity === "error";
              const isWarning = issue.severity === "warning";

              return (
                <div
                  key={issue.id}
                  className={`rounded-xl border p-3.5 space-y-2 ${
                    isError
                      ? "border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"
                      : isWarning
                      ? "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {isError ? (
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-xs text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{issue.message}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                        isError
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200"
                      }`}
                    >
                      {issue.category}
                    </span>
                  </div>

                  {issue.fixSuggestion && (
                    <div className="rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-[11px] text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-primary shrink-0" />
                      <span>
                        <strong>Recommendation:</strong> {issue.fixSuggestion}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground text-center sm:text-left">
            {hasBlockingErrors
              ? "Resolve all critical blocking errors before publishing."
              : report.warningCount > 0
              ? "Warnings can be bypassed if changes are deliberate."
              : "Content passes all quality checks."}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              {isPublishingMode ? "Return to Editor" : "Close"}
            </Button>

            {isPublishingMode && onPublishAnyway && (
              <Button
                variant={hasBlockingErrors ? "outline" : "default"}
                size="sm"
                disabled={hasBlockingErrors || publishing}
                onClick={onPublishAnyway}
                className="text-xs font-semibold"
              >
                {publishing && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {hasBlockingErrors ? "Publish Blocked" : "Publish"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
