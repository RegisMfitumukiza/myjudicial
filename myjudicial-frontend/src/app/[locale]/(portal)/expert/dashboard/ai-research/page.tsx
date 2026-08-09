"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Search, Send, Loader2, RotateCcw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCaseAnalysis } from "@/features/ai/hooks/use-case-analysis";
import { useTranscription } from "@/features/ai/hooks/use-transcription";
import { AiAnalysisCard } from "@/features/ai/components/ai-analysis-card";
import { AiVoiceRecorder } from "@/features/ai/components/ai-voice-recorder";
import type { CaseAnalysis } from "@/features/ai/types";

export default function AiResearchPage() {
  const t = useTranslations("expertDashboard");
  const tAi = useTranslations("ai");

  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useCaseAnalysis();
  const transcribeMutation = useTranscription();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || analyzeMutation.isPending) return;
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
  }, [input, analyzeMutation, tAi]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleVoiceRecording = useCallback(
    async (blob: Blob) => {
      setError(null);
      try {
        const result = await transcribeMutation.mutateAsync({ audioBlob: blob });
        const data = result as unknown as Record<string, unknown>;
        const text = (data?.text as string) ?? (data as { transcription?: { text?: string } })?.transcription?.text ?? "";
        if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
      } catch {
        setError(tAi("voice.error"));
      }
    },
    [transcribeMutation, tAi]
  );

  const handleClear = useCallback(() => {
    setInput("");
    setAnalysis(null);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const isProcessing = analyzeMutation.isPending || transcribeMutation.isPending;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10">
            <Search className="h-5 w-5 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark dark:text-white">{t("aiResearchTitle")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("aiResearchDesc")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-brand-dark" />
              <h3 className="text-sm font-semibold text-brand-dark dark:text-white">{t("aiResearchTitle")}</h3>
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("aiResearchPlaceholder")}
              rows={8}
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-brand-dark placeholder:text-gray-400 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              disabled={isProcessing}
            />

            <div className="mt-3 flex items-center gap-2">
              <AiVoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                disabled={isProcessing}
                isTranscribing={transcribeMutation.isPending}
              />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || isProcessing}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  input.trim() && !isProcessing
                    ? "bg-brand-dark text-white hover:bg-brand-dark/90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("aiAnalyzing")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("aiResearchTitle")}
                  </>
                )}
              </button>

              {(input || analysis) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  title={t("aiClear")}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          {analyzeMutation.isPending && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border bg-white py-16 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-brand-dark mb-3" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("aiAnalyzing")}</p>
              <p className="mt-1 text-xs text-gray-400">Researching legal domain and issues...</p>
            </div>
          )}

          {!analyzeMutation.isPending && !analysis && !error && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center dark:border-gray-700 dark:bg-gray-900/50">
              <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("aiResearchTitle")}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Describe your legal question to identify the domain and key issues
              </p>
            </div>
          )}

          {analysis && !analyzeMutation.isPending && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm font-semibold text-brand-dark dark:text-white">{t("aiAnalysisComplete")}</p>
              </div>
              <AiAnalysisCard analysis={analysis} />

              {/* Suggested approach from reasoning */}
              {analysis.reasoning && (
                <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="text-sm font-semibold text-brand-dark dark:text-white mb-2">Research Summary</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{analysis.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
