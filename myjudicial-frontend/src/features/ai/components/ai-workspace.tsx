"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Send, ArrowRight, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import { useCaseAnalysis } from "../hooks/use-case-analysis";
import { useRecommendation } from "../hooks/use-recommendation";
import { useTranscription } from "../hooks/use-transcription";
import { AiStepIndicator } from "./ai-step-indicator";
import { AiVoiceRecorder } from "./ai-voice-recorder";
import { AiAnalysisCard } from "./ai-analysis-card";
import { AiRecommendationCard } from "./ai-recommendation-card";
import type { AiMessage, AiStep, CaseAnalysis, ExpertRecommendation } from "../types";

export function AiWorkspace() {
  const t = useTranslations("ai");
  const tAiChat = useTranslations("public.aiChat");
  const tSpecialties = useTranslations("specialties");
  const router = useRouter();

  const [step, setStep] = useState<AiStep>("describe");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<ExpertRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useCaseAnalysis();
  const recommendMutation = useRecommendation();
  const transcribeMutation = useTranscription();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((msg: AiMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || analyzeMutation.isPending) return;

    const userMessage: AiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput("");
    setError(null);

    try {
      const result = await analyzeMutation.mutateAsync({ text });
      setAnalysis(result.analysis);

      const analysisMessage: AiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: tAiChat("triageResponse", {
          specialty: getLocalizedSpecialty(result.analysis.specialty, tSpecialties),
          urgency: result.analysis.urgency_level.toLowerCase(),
        }),
        timestamp: new Date(),
        type: "analysis",
        analysis: result.analysis,
      };
      addMessage(analysisMessage);
      setStep("refine");

      const recResult = await recommendMutation.mutateAsync({
        text,
        limit: 5,
      });

      if (!recResult.success || !recResult.recommendations || recResult.recommendations.length === 0) {
        const noExpertsMsg = t("recommendations.noExperts");
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: noExpertsMsg,
          timestamp: new Date(),
        });
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: t("recommendations.tryBroader"),
          timestamp: new Date(),
        });
        setStep("match");
        return;
      }

      setRecommendations(recResult.recommendations);

      const recMessage: AiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: t("recommendations.expertsFound", { count: recResult.recommendations.length }),
        timestamp: new Date(),
        type: "recommendation",
        recommendations: recResult.recommendations,
      };
      addMessage(recMessage);
      setStep("match");
    } catch (err) {
      console.error("AI analysis error:", err);
      let userMessage = t("errors.analysisFailed");
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("502") || msg.includes("unavailable") || msg.includes("Failed to fetch")) {
          userMessage = t("errors.serviceUnavailable") || "The AI service is temporarily unavailable. Please try again later.";
        } else if (msg.includes("429") || msg.includes("rate limit")) {
          userMessage = t("errors.tooManyRequests") || "Too many requests. Please wait a moment and try again.";
        } else if (msg.includes("400") || msg.includes("validation")) {
          userMessage = t("errors.invalidInput") || "Please provide a more detailed description of your legal issue.";
        }
      }
      setError(userMessage);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: userMessage,
        timestamp: new Date(),
      });
    }
  }, [
    input,
    analyzeMutation,
    recommendMutation,
    addMessage,
    t,
    tAiChat,
    tSpecialties,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const handleVoiceRecording = useCallback(
    async (blob: Blob) => {
      setError(null);
      setRecording(false);
      setRecordDuration(0);
      try {
        const result = await transcribeMutation.mutateAsync({ audioBlob: blob });
        const data = result as unknown as Record<string, unknown>;
        const transcribedText = (data?.text as string) ?? (data as { transcription?: { text?: string } })?.transcription?.text ?? (data as { translated_text?: string })?.translated_text ?? "";
        if (transcribedText) {
          setInput((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("401") || msg.includes("Authentication") || msg.includes("expired")) {
          setError(t("voice.signInRequired") || "Please sign in to use voice features.");
        } else {
          setError(t("voice.error"));
        }
      }
    },
    [transcribeMutation, t]
  );

  const handleViewAllResults = useCallback(() => {
    if (!analysis) return;
    const params = new URLSearchParams();
    params.set("specialty", analysis.specialty);
    params.set("view", "list");
    router.push(`/search?${params.toString()}`);
  }, [analysis, router]);

  const hasStarted = messages.length > 0;
  const isProcessing = analyzeMutation.isPending || recommendMutation.isPending || transcribeMutation.isPending;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-6">
        <AiStepIndicator currentStep={step} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {!hasStarted && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark/10 dark:bg-white/10">
              <Bot className="h-8 w-8 text-brand-dark dark:text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t("empty.title")}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("empty.description")}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%] space-y-3",
                msg.role === "user"
                  ? "rounded-2xl rounded-br-md bg-brand-dark px-4 py-2.5 text-on-brand"
                  : "space-y-3"
              )}
            >
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                  {msg.analysis && <AiAnalysisCard analysis={msg.analysis} />}
                  {msg.recommendations && (
                    <div className="space-y-3">
                      {msg.recommendations.map((rec, i) => (
                        <AiRecommendationCard
                          key={rec.expert.id}
                          recommendation={rec}
                          rank={i + 1}
                          isTop={i === 0}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-brand-dark dark:text-white" />
              <span className="text-sm text-muted-foreground">
                {analyzeMutation.isPending
                  ? t("input.placeholder")
                  : recommendMutation.isPending
                    ? t("recommendations.subtitle")
                    : t("voice.processing")}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {step === "match" && recommendations.length > 0 && (
          <button
            type="button"
            onClick={handleViewAllResults}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-dark bg-brand-dark/5 px-4 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/10 dark:border-white dark:text-white dark:hover:bg-white/10"
          >
            {t("redirect.button")}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recording ? t("voice.recording") || "Listening..." : t("input.placeholder")}
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              disabled={isProcessing || recording}
            />
          </div>

          <AiVoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            disabled={isProcessing}
            isTranscribing={transcribeMutation.isPending}
            isRecording={recording}
            onRecordingStateChange={setRecording}
            duration={recordDuration}
            onDurationChange={setRecordDuration}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing || recording}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              input.trim() && !isProcessing && !recording
                ? "bg-brand-dark text-on-brand hover:bg-brand-dark/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {recording && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span>{Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, "0")}</span>
            <span className="text-muted-foreground/60">|</span>
            <span>{t("voice.stopHint") || "Click mic to stop"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
