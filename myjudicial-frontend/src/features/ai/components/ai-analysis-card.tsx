"use client";

import { useTranslations } from "next-intl";
import { Shield, Wallet, MapPin, FileText, Lightbulb, Scale, Upload, CheckCircle2, Tag } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import type { CaseAnalysis } from "../types";

export function AiAnalysisCard({ analysis }: { analysis: CaseAnalysis }) {
  const t = useTranslations("ai");
  const tSpecialties = useTranslations("specialties");

  const urgencyStyles: Record<string, { bg: string; text: string; dot: string }> = {
    LOW: {
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    MEDIUM: {
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    HIGH: {
      bg: "bg-orange-500/10 border-orange-500/20",
      text: "text-orange-700 dark:text-orange-400",
      dot: "bg-orange-500",
    },
    CRITICAL: {
      bg: "bg-red-500/10 border-red-500/20",
      text: "text-red-700 dark:text-red-400",
      dot: "bg-red-500 animate-pulse",
    },
  };

  const urgencyStyle = urgencyStyles[analysis.urgency_level] ?? urgencyStyles.MEDIUM;
  const hasBudget = analysis.budget_range.min > 0 || analysis.budget_range.max > 0;
  const confidencePercent = Math.round(analysis.confidence_score * 100);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">{t("analysis.title")}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated preliminary triage & match assessment</p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-foreground/80 shrink-0">
          <Shield className="h-3 w-3 text-brand-dark dark:text-white" />
          <span>{confidencePercent}% {t("analysis.confidence")}</span>
        </div>
      </div>

      {/* Hero Metric Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-brand-dark/20 bg-brand-dark/[0.06] px-3 py-1.5 text-xs font-bold text-brand-dark dark:border-white/20 dark:bg-white/[0.08] dark:text-white">
          <Scale className="h-3.5 w-3.5" />
          <span>{getLocalizedSpecialty(analysis.specialty, tSpecialties)}</span>
        </div>

        {/* Urgency Pill */}
        <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${urgencyStyle.bg} ${urgencyStyle.text}`}>
          <span className={`h-2 w-2 rounded-full ${urgencyStyle.dot}`} />
          <span>{t(`urgency.${analysis.urgency_level}`)} {t("analysis.urgency")}</span>
        </div>

        {/* Jurisdiction Pill */}
        {analysis.jurisdiction && (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{analysis.jurisdiction}</span>
          </div>
        )}

        {/* Budget Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground/80">
          <Wallet className="h-3 w-3 text-muted-foreground" />
          <span>
            {hasBudget
              ? `${analysis.budget_range.min.toLocaleString()} - ${analysis.budget_range.max.toLocaleString()} RWF`
              : t("analysis.noBudgetData")}
          </span>
        </div>
      </div>

      {/* AI Assessment / Reasoning */}
      {analysis.reasoning && (
        <div className="rounded-xl border border-brand-dark/15 bg-brand-dark/[0.03] p-3.5 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-brand-dark dark:text-white" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("analysis.reasoning")}
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed font-normal">{analysis.reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Structured Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Recommended Documents Checklist */}
        {analysis.suggested_documents.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-brand-dark dark:text-white" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  {t("analysis.suggestedDocs")}
                </p>
              </div>
              <Link
                href="/client/dashboard/documents"
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-dark hover:underline dark:text-white transition-colors"
              >
                <Upload size={11} />
                <span>{t("upload")}</span>
              </Link>
            </div>

            <div className="space-y-2">
              {analysis.suggested_documents.map((doc, i) => {
                const docName = typeof doc === "string" ? doc : doc.document;
                const docReason = typeof doc === "string" ? null : doc.reason;
                return (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-background p-2 border border-border/50 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-dark/70 dark:text-white/70" />
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground text-xs leading-snug block">{docName}</span>
                      {docReason && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{docReason}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legal Issues & Entities Column */}
        <div className="space-y-3">
          {/* Potential Legal Issues */}
          {analysis.possible_legal_issues && analysis.possible_legal_issues.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-brand-dark dark:text-white" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  {t("analysis.legalIssues")}
                </p>
              </div>
              <div className="space-y-1.5">
                {analysis.possible_legal_issues.map((issue) => (
                  <div key={issue} className="flex items-start gap-2 text-xs text-foreground/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-dark dark:bg-white mt-1.5 shrink-0" />
                    <span className="leading-snug">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Entities */}
          {analysis.key_entities.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("analysis.keyEntities")}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.key_entities.map((entity) => (
                  <span
                    key={entity}
                    className="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/80 shadow-2xs"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
