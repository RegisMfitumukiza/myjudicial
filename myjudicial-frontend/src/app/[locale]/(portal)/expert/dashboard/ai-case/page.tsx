"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Brain, Sparkles } from "lucide-react";
import { useCaseAnalysis } from "@/features/ai/hooks/use-case-analysis";
import { useTranscription } from "@/features/ai/hooks/use-transcription";
import { AiAnalysisCard } from "@/features/ai/components/ai-analysis-card";
import { AiAnalysisForm } from "@/features/ai/components/ai-analysis-form";
import { AiVoiceRecorder } from "@/features/ai/components/ai-voice-recorder";
import type { CaseAnalysis } from "@/features/ai/types";

export default function AiCasePage() {
  const t = useTranslations("expertDashboard");
  const tAi = useTranslations("ai");

  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useCaseAnalysis();
  const transcribeMutation = useTranscription();

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
    setError(null);
  }, []);

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <AiAnalysisForm
        title={t("aiCaseTitle")}
        description={t("aiCaseDesc")}
        icon={Brain}
        panelIcon={Sparkles}
        panelTitle={t("aiEnterText")}
        placeholder={t("aiInputPlaceholder")}
        submitLabel={t("aiCaseTitle")}
        clearLabel={t("aiClear")}
        processingLabel={t("aiAnalyzing")}
        processingHint="Processing with AI model..."
        idleHint="Enter a case description on the left and click analyze"
        resultLabel={t("aiAnalysisComplete")}
        onSubmit={handleSubmit}
        isPending={analyzeMutation.isPending || transcribeMutation.isPending}
        error={error}
        onClear={handleClear}
        recorder={({ appendText, disabled }) => (
          <AiVoiceRecorder
            onRecordingComplete={(blob) => handleVoiceRecording(blob, appendText)}
            disabled={disabled}
            isTranscribing={transcribeMutation.isPending}
          />
        )}
      >
        {analysis && !analyzeMutation.isPending && <AiAnalysisCard analysis={analysis} />}
      </AiAnalysisForm>
    </div>
  );
}
