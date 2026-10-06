"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Send, ArrowRight, Bot, User, Loader2, Zap, SearchX, RotateCcw, AlertCircle } from "lucide-react";
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

const DRAFT_STORAGE_KEY = "mj_ai_case_draft";
const SESSION_STORAGE_KEY = "mj_ai_triage_session";

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
  const [lastSubmittedText, setLastSubmittedText] = useState<string | null>(null);

  const analyzeMutation = useCaseAnalysis();
  const recommendMutation = useRecommendation();
  const transcribeMutation = useTranscription();
  const isProcessing = analyzeMutation.isPending || recommendMutation.isPending || transcribeMutation.isPending;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // 1. Restore unsubmitted draft if available
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          setInput(savedDraft);
        }
      } catch {
        // Storage access denied/unavailable
      }

      // 2. Restore active triage session if available
      try {
        const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            setMessages(
              parsed.messages.map((m: any) => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              }))
            );
            if (parsed.step) setStep(parsed.step);
            if (parsed.analysis) setAnalysis(parsed.analysis);
            if (parsed.recommendations) setRecommendations(parsed.recommendations);
            if (parsed.lastSubmittedText) setLastSubmittedText(parsed.lastSubmittedText);
          }
        }
      } catch {
        // Session parse error
      }
      return;
    }

    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Persist active triage session to sessionStorage whenever state changes
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            step,
            messages,
            analysis,
            recommendations,
            lastSubmittedText,
          })
        );
      } catch {
        // Storage quota / privacy error
      }
    }
  }, [messages, step, analysis, recommendations, lastSubmittedText]);

  const addMessage = useCallback((msg: AiMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 2000);
    setInput(val);
    try {
      if (val.trim()) {
        localStorage.setItem(DRAFT_STORAGE_KEY, val);
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const executeSubmission = useCallback(
    async (textToSubmit: string) => {
      const text = textToSubmit.trim();
      if (!text || analyzeMutation.isPending) return;

      setLastSubmittedText(text);
      setError(null);

      // Add user message if not already the last message in history
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "user" && last.content === text) {
          return prev;
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            timestamp: new Date(),
          },
        ];
      });

      setInput("");
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }

      try {
        const result = await analyzeMutation.mutateAsync({ text });
        setAnalysis(result.analysis);

        const isGreetingOrUnknown =
          result.analysis.is_greeting ||
          result.analysis.specialty === "UNKNOWN" ||
          result.analysis.confidence_score === 0;

        if (isGreetingOrUnknown) {
          const greetingContent = result.analysis.greeting_message || tAiChat("needMoreDetails");
          addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: greetingContent,
            timestamp: new Date(),
            type: "text",
          });
          return;
        }

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
          addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            timestamp: new Date(),
            type: "no-experts",
            analysis: result.analysis,
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
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          userMessage = t("errors.networkError") || "Connection lost. Please check your internet connection.";
        } else if (err instanceof Error) {
          const msg = err.message;
          if (msg.includes("502") || msg.includes("unavailable") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
            userMessage = t("errors.serviceUnavailable") || "The AI service is temporarily unavailable. Please try again later.";
          } else if (msg.includes("429") || msg.includes("rate limit")) {
            userMessage = t("errors.tooManyRequests") || "Too many requests. Please wait a moment and try again.";
          } else if (msg.includes("400") || msg.includes("422") || msg.includes("validation") || msg.includes("invalid")) {
            userMessage = t("errors.invalidInput") || "Please provide a more detailed description of your legal issue.";
          }
        }
        setError(userMessage);
      }
    },
    [
      analyzeMutation,
      recommendMutation,
      addMessage,
      t,
      tAiChat,
      tSpecialties,
    ]
  );

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    await executeSubmission(input.trim());
  }, [input, isProcessing, executeSubmission]);

  const handleRetry = useCallback(() => {
    if (lastSubmittedText) {
      executeSubmission(lastSubmittedText);
    }
  }, [lastSubmittedText, executeSubmission]);

  const handleStartNewCase = useCallback(() => {
    setStep("describe");
    setMessages([]);
    setAnalysis(null);
    setRecommendations([]);
    setError(null);
    setLastSubmittedText(null);
    setInput("");
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    inputRef.current?.focus();
  }, []);

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
          setInput((prev) => {
            const next = prev ? `${prev} ${transcribedText}` : transcribedText;
            try {
              localStorage.setItem(DRAFT_STORAGE_KEY, next);
            } catch {
              // ignore
            }
            return next;
          });
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-3 min-[360px]:px-4 py-6 sm:py-8 sm:px-6">
      <div className="mb-5 sm:mb-6 space-y-1.5 sm:space-y-2 text-center">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl break-words">{t("title")}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground break-words">{t("subtitle")}</p>
      </div>

      <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
        <AiStepIndicator currentStep={step} />
        {hasStarted && (
          <div className="absolute right-0">
            <button
              type="button"
              onClick={handleStartNewCase}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-dark/40 hover:bg-muted hover:text-foreground shrink-0 shadow-2xs"
              title={t("newCase")}
            >
              <RotateCcw className="h-3 w-3 text-brand-dark dark:text-white" />
              <span className="hidden min-[400px]:inline">{t("newCase")}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {!hasStarted && (
          <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-2">
            <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-brand-dark/10 dark:bg-white/10">
              <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-brand-dark dark:text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground break-words">{t("empty.title")}</h2>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground break-words">{t("empty.description")}</p>
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
              {[
                t("quickPrompt1"),
                t("quickPrompt2"),
                t("quickPrompt3"),
                t("quickPrompt4")
              ].map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    try {
                      localStorage.setItem(DRAFT_STORAGE_KEY, prompt);
                    } catch {
                      // ignore
                    }
                    inputRef.current?.focus();
                  }}
                  className="group flex items-start gap-2.5 rounded-xl border border-border bg-card/60 p-3 text-left text-xs text-muted-foreground transition-all hover:border-brand-dark/40 hover:bg-card hover:text-foreground hover:shadow-xs"
                >
                  <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-dark transition-transform group-hover:scale-110" />
                  <span className="leading-snug font-medium text-foreground/85 group-hover:text-foreground">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2 sm:gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            )}

            <div
              className={cn(
                "min-w-0 space-y-3",
                msg.role === "user"
                  ? "max-w-[88%] sm:max-w-[80%] rounded-2xl rounded-br-md bg-brand-dark px-3.5 py-2 min-[360px]:px-4 min-[360px]:py-2.5 text-on-brand"
                  : "max-w-full sm:max-w-[90%]"
              )}
            >
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <>
                  {msg.content && <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>}
                  {msg.analysis && msg.type !== "no-experts" && <AiAnalysisCard analysis={msg.analysis} />}
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
                  {msg.type === "no-experts" && msg.analysis && (
                    <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-5 text-center">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <SearchX className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="mb-4 text-sm font-medium text-foreground">
                        No exactly matched experts found
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set("specialty", msg.analysis!.specialty);
                          router.push(`/search?${params.toString()}`);
                        }}
                        className="rounded-lg bg-brand-dark px-4 py-2 text-xs font-semibold text-on-brand transition-colors hover:bg-brand-dark/90"
                      >
                        Browse all lawyers
                      </button>
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
              <span className="text-sm text-muted-foreground flex items-center">
                {analyzeMutation.isPending ? (
                  <>🔍 Analyzing your case<span className="animate-pulse tracking-widest ml-1">...</span></>
                ) : recommendMutation.isPending ? (
                  <>🤝 Finding best matched experts<span className="animate-pulse tracking-widest ml-1">...</span></>
                ) : (
                  t("voice.processing")
                )}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-start sm:items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5 sm:mt-0" />
              <span>{error}</span>
            </div>
            {lastSubmittedText && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white shadow-xs transition hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 shrink-0 self-end sm:self-auto disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                {t("retry")}
              </button>
            )}
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

      <div className="mt-4 space-y-3 border-t border-border pt-3 sm:pt-4">
        <div className="flex items-end gap-1.5 sm:gap-2">
          <div className="relative flex-1 min-w-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={recording ? t("voice.recording") || "Listening..." : t("input.placeholder")}
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 min-[360px]:px-4 py-2.5 sm:py-3 pb-7 sm:pb-7 text-xs min-[360px]:text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              style={{ minHeight: "42px", maxHeight: "120px" }}
              disabled={isProcessing || recording}
            />
            {input.length > 0 && (
              <div className={cn(
                "absolute bottom-1.5 right-3 text-[10px]",
                input.length > 1900 ? "text-red-500" : "text-muted-foreground"
              )}>
                {input.length}/2000
              </div>
            )}
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
              "flex h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              input.trim() && !isProcessing && !recording
                ? "bg-brand-dark text-on-brand hover:bg-brand-dark/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-3.5 w-3.5 min-[360px]:h-4 min-[360px]:w-4" />
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
