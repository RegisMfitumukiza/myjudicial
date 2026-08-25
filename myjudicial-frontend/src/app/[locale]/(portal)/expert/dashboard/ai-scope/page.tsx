"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Target, Users } from "lucide-react";
import { useCaseAnalysis } from "@/features/ai/hooks/use-case-analysis";
import { useRecommendation } from "@/features/ai/hooks/use-recommendation";
import { useTranscription } from "@/features/ai/hooks/use-transcription";
import { AiAnalysisCard } from "@/features/ai/components/ai-analysis-card";
import { AiRecommendationCard } from "@/features/ai/components/ai-recommendation-card";
import { AiAnalysisForm } from "@/features/ai/components/ai-analysis-form";
import { AiVoiceRecorder } from "@/features/ai/components/ai-voice-recorder";
import type { CaseAnalysis, ExpertRecommendation } from "@/features/ai/types";

export default function AiScopePage() {
  const t = useTranslations("expertDashboard");
  const tAi = useTranslations("ai");

  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<ExpertRecommendation[]>([]);
  const [phase, setPhase] = useState<"idle" | "analyzing" | "finding" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useCaseAnalysis();
  const recommendMutation = useRecommendation();
  const transcribeMutation = useTranscription();

  const handleSubmit = useCallback(
    async (text: string) => {
      if (phase === "analyzing" || phase === "finding") return;
      setError(null);
      setAnalysis(null);
      setRecommendations([]);
      setPhase("analyzing");

      try {
        const result = await analyzeMutation.mutateAsync({ text });
        setAnalysis(result.analysis);
        setPhase("finding");

        const recResult = await recommendMutation.mutateAsync({ text, limit: 5 });
        if (recResult.success && recResult.recommendations?.length > 0) {
          setRecommendations(recResult.recommendations);
        }
        setPhase("done");
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
        setPhase("idle");
      }
    },
    [analyzeMutation, recommendMutation, tAi, phase]
  );

  const handleVoiceRecording = useCallback(
    async (blob: Blob, appendText: (text: string) => void) => {
      setError(null);
      try {
        const result = await transcribeMutation.mutateAsync({ audioBlob: blob });
        const data = result as unknown as Record<string, unknown>;
        const text = (data?.text as string) ?? (data as { transcription?: { text?: string } })?.transcription?.text ?? "";
        if (text) appendText(text);
      } catch {
        setError(tAi("voice.error"));
      }
    },
    [transcribeMutation, tAi]
  );

  const handleClear = useCallback(() => {
    setAnalysis(null);
    setRecommendations([]);
    setPhase("idle");
    setError(null);
  }, []);

  const isProcessing = phase === "analyzing" || phase === "finding";

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <AiAnalysisForm
        title={t("aiScopeTitle")}
        description={t("aiScopeDesc")}
        icon={Target}
        panelIcon={Target}
        panelTitle={t("aiEnterText")}
        placeholder={t("aiScopePlaceholder")}
        submitLabel={t("aiScopeTitle")}
        clearLabel={t("aiClear")}
        processingLabel={
          phase === "analyzing" ? t("aiAnalyzing") : t("aiFindingExperts")
        }
        processingHint={
          phase === "analyzing"
            ? "Classifying the legal case..."
            : "Matching with available experts..."
        }
        idleHint="Describe the case to get an analysis and matching expert recommendations"
        resultLabel={t("aiAnalysisComplete")}
        onSubmit={handleSubmit}
        isPending={isProcessing}
        error={error}
        onClear={handleClear}
        recorder={({ appendText, disabled }) => (
          <AiVoiceRecorder
            onRecordingComplete={(blob) => handleVoiceRecording(blob, appendText)}
            disabled={disabled}
            isTranscribing={transcribeMutation.isPending}
          />
        )}
        extraResult={
          phase === "done" && (
            <>
              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">{t("aiExpertsFound")}</p>
                    <span className="text-xs text-muted-foreground">{recommendations.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("aiReferralHint")}</p>
                  <div className="space-y-3">
                    {recommendations.map((rec, i) => (
                      <AiRecommendationCard key={rec.expert.id} recommendation={rec} rank={i + 1} isTop={i === 0} />
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length === 0 && phase === "done" && (
                <div className="rounded-xl border border-border bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("aiNoExperts")}</p>
                </div>
              )}
            </>
          )
        }
      >
        {phase === "done" && analysis && <AiAnalysisCard analysis={analysis} />}
      </AiAnalysisForm>
    </div>
  );
}
