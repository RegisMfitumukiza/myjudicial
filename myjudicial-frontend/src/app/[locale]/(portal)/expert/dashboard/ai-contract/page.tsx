"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileSearch, FileText } from "lucide-react";
import { useCaseAnalysis } from "@/features/ai/hooks/use-case-analysis";
import { AiAnalysisCard } from "@/features/ai/components/ai-analysis-card";
import { AiAnalysisForm } from "@/features/ai/components/ai-analysis-form";
import type { CaseAnalysis } from "@/features/ai/types";

export default function AiContractPage() {
  const t = useTranslations("expertDashboard");
  const tAi = useTranslations("ai");

  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useCaseAnalysis();

  const handleSubmit = useCallback(
    async (text: string) => {
      setError(null);
      setAnalysis(null);

      try {
        const result = await analyzeMutation.mutateAsync({ text });
        setAnalysis(result.analysis);
      } catch (err) {
        let msg = tAi("errors.analysisFailed");
        if (err instanceof Error) {
          const m = err.message;
          if (m.includes("502") || m.includes("unavailable") || m.includes("Failed to fetch")) {
            msg = tAi("errors.serviceUnavailable");
          } else if (m.includes("429")) {
            msg = tAi("errors.tooManyRequests");
          } else if (m.includes("400")) {
            msg = tAi("errors.invalidInput");
          }
        }
        setError(msg);
      }
    },
    [analyzeMutation, tAi]
  );

  const handleClear = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <AiAnalysisForm
        title={t("aiContractTitle")}
        description={t("aiContractDesc")}
        icon={FileSearch}
        panelIcon={FileText}
        panelTitle={t("aiDocumentReview")}
        placeholder={t("aiPasteOrType")}
        submitLabel={t("aiContractTitle")}
        clearLabel={t("aiClear")}
        processingLabel={t("aiAnalyzing")}
        processingHint="Reviewing document with AI model..."
        idleHint="Paste a contract or legal document on the left to review"
        resultLabel={t("aiAnalysisComplete")}
        rows={12}
        onSubmit={handleSubmit}
        isPending={analyzeMutation.isPending}
        error={error}
        onClear={handleClear}
        extraResult={
          analysis && !analyzeMutation.isPending ? (
            <>
              {/* Key Entities as extracted clauses */}
              {analysis.key_entities.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">{t("aiKeyClauses")}</h3>
                  <div className="space-y-2">
                    {analysis.key_entities.map((entity) => (
                      <div key={entity} className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" aria-hidden="true" />
                        <span className="text-xs text-foreground">{entity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment from legal issues */}
              {analysis.possible_legal_issues && analysis.possible_legal_issues.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">{t("aiRiskAssessment")}</h3>
                  <div className="space-y-2">
                    {analysis.possible_legal_issues.map((issue) => (
                      <div key={issue} className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                        <span className="text-xs text-warning">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null
        }
      >
        {analysis && !analyzeMutation.isPending && <AiAnalysisCard analysis={analysis} />}
      </AiAnalysisForm>
    </div>
  );
}
