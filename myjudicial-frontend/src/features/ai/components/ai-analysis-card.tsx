"use client";

import { useTranslations } from "next-intl";
import { Shield, Clock, Wallet, MapPin, FileText, Lightbulb, Scale, Upload } from "lucide-react";
import Link from "next/link";
import type { CaseAnalysis } from "../types";

export function AiAnalysisCard({ analysis }: { analysis: CaseAnalysis }) {
  const t = useTranslations("ai");

  const specialtyLabels: Record<string, string> = {
    FAMILY_LAW: "Family Law",
    COMMERCIAL_LAW: "Commercial Law",
    EMPLOYMENT_LAW: "Employment Law",
    LAND_LAW: "Land Law",
    CRIMINAL_LAW: "Criminal Law",
    TAX_LAW: "Tax Law",
    IMMIGRATION_LAW: "Immigration Law",
    CORPORATE_LAW: "Corporate Law",
    CONTRACT_LAW: "Contract Law",
    INTELLECTUAL_PROPERTY: "Intellectual Property",
    OTHER: "Other",
  };

  const urgencyColors: Record<string, string> = {
    LOW: "text-emerald-600 dark:text-emerald-400",
    MEDIUM: "text-amber-600 dark:text-amber-400",
    HIGH: "text-orange-600 dark:text-orange-400",
    CRITICAL: "text-red-600 dark:text-red-400",
  };

  const hasBudget = analysis.budget_range.min > 0 || analysis.budget_range.max > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/10">
          <Shield className="h-4 w-4 text-brand-dark" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{t("analysis.title")}</h3>
      </div>

      {/* Reasoning */}
      {analysis.reasoning && (
        <div className="rounded-lg bg-brand-dark/5 px-3 py-2">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-dark" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                {t("analysis.reasoning")}
              </p>
              <p className="text-xs text-foreground leading-relaxed">{analysis.reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Core Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("analysis.specialty")}
          </p>
          <p className="text-sm font-medium text-foreground">
            {specialtyLabels[analysis.specialty] ?? analysis.specialty}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("analysis.urgency")}
          </p>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <p className={`text-sm font-medium ${urgencyColors[analysis.urgency_level] ?? "text-foreground"}`}>
              {t(`urgency.${analysis.urgency_level}`)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("analysis.jurisdiction")}
          </p>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {analysis.jurisdiction}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("analysis.budget")}
          </p>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3 w-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {hasBudget
                ? `${analysis.budget_range.min.toLocaleString()} - ${analysis.budget_range.max.toLocaleString()} RWF`
                : "--"}
            </p>
          </div>
          {hasBudget ? (
            <p className="text-[10px] text-muted-foreground">{t("analysis.budgetFromData")}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">{t("analysis.noBudgetData")}</p>
          )}
        </div>
      </div>

      {/* Legal Issues */}
      {analysis.possible_legal_issues && analysis.possible_legal_issues.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("analysis.legalIssues")}
          </p>
          <div className="space-y-1">
            {analysis.possible_legal_issues.map((issue) => (
              <div key={issue} className="flex items-center gap-1.5 text-xs text-foreground">
                <Scale className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Entities */}
      {analysis.key_entities.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("analysis.keyEntities")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.key_entities.map((entity) => (
              <span
                key={entity}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Documents */}
      {analysis.suggested_documents.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("analysis.suggestedDocs")}
            </p>
            <Link
              href="/client/dashboard/documents"
              className="flex items-center gap-1 text-[11px] font-semibold text-brand-dark hover:underline dark:text-white"
            >
              <Upload size={10} />
              Upload
            </Link>
          </div>
          <div className="space-y-1.5">
            {analysis.suggested_documents.map((doc, i) => {
              const docName = typeof doc === "string" ? doc : doc.document;
              const docReason = typeof doc === "string" ? null : doc.reason;
              return (
                <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3 mt-0.5 shrink-0 text-brand-dark/60" />
                  <div>
                    <span className="font-medium text-foreground">{docName}</span>
                    {docReason && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{docReason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-brand-dark transition-all"
            style={{ width: `${Math.round(analysis.confidence_score * 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          {t("analysis.confidence")}: {Math.round(analysis.confidence_score * 100)}%
        </span>
      </div>
    </div>
  );
}
