"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, usePathname } from "@/i18n/routing";
import {
  Bot,
  ArrowRight,
  X,
  Send,
  Loader2,
  Maximize2,
  Scale,
  Sparkles,
  MapPin,
  Star,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCaseAnalysis } from "@/features/ai/hooks/use-case-analysis";
import { useRecommendation } from "@/features/ai/hooks/use-recommendation";
import type { CaseAnalysis, ExpertRecommendation } from "@/features/ai/types";

type AiStatus = "online" | "offline";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  analysis?: CaseAnalysis;
  recommendations?: ExpertRecommendation[];
}

const HEALTH_POLL_INTERVAL_MS = 30_000;
const INDUSTRIAL_BLUE = "#24558d";

const QUICK_PROMPTS = [
  "Land boundary & title dispute",
  "Unfair employment dismissal",
  "Commercial contract breach",
  "Divorce & custody questions",
];

async function checkAiHealth(): Promise<AiStatus> {
  try {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
    const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1").replace(/\/+$/, "");
    const res = await fetch(`${base}${prefix}/ai/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "offline";
    const data = await res.json();
    return data?.success === true ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>("offline");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const pathname = usePathname();
  const t = useTranslations("public");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = useCaseAnalysis();
  const recommendMutation = useRecommendation();

  const poll = useCallback(async () => {
    const status = await checkAiHealth();
    setAiStatus(status);
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, HEALTH_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  // Support global custom events to open AI drawer
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-ai-chat", handler);
    return () => window.removeEventListener("open-ai-chat", handler);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isProcessing]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend ?? input).trim();
      if (!query || isProcessing) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsProcessing(true);

      try {
        const [analysisRes, recRes] = await Promise.allSettled([
          analyzeMutation.mutateAsync({ text: query }),
          recommendMutation.mutateAsync({ text: query, limit: 2 }),
        ]);

        const analysis =
          analysisRes.status === "fulfilled" ? analysisRes.value.analysis : undefined;
        const recommendations =
          recRes.status === "fulfilled" && recRes.value.success
            ? recRes.value.recommendations
            : [];

        let assistantContent =
          "I have analyzed your situation under Rwandan law. Here is the recommended legal specialization and verified lawyers who can help:";

        if (analysis) {
          const specialtyFormatted = analysis.specialty.replace(/_/g, " ").toLowerCase();
          assistantContent = `Based on your description, this case falls under **${specialtyFormatted}** with **${analysis.urgency_level.toLowerCase()} urgency**.`;
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantContent,
          analysis,
          recommendations,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I encountered an issue analyzing your request. You can also explore our full legal intake workspace directly.",
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [input, isProcessing, analyzeMutation, recommendMutation]
  );

  // Never show on the full /ai page
  if (dismissed || pathname === "/ai" || pathname?.startsWith("/ai")) return null;

  const isOnline = aiStatus === "online";
  const lastUserQuery = [...messages].reverse().find((m) => m.role === "user")?.content;
  const fullWorkspaceHref = lastUserQuery
    ? `/ai?q=${encodeURIComponent(lastUserQuery)}`
    : "/ai";

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* ── Interactive Inline Chat Drawer ─────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 flex h-[480px] sm:h-[540px] w-[calc(100vw-2rem)] max-w-[360px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-black/10 dark:border-[#2a303a] dark:bg-[#13171e]"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ backgroundColor: INDUSTRIAL_BLUE }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/15">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">
                    {t("aiChat.title")}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOnline ? "bg-emerald-400" : "bg-slate-400"
                      }`}
                    />
                    <span className="text-[10px] font-medium text-white/75">
                      {isOnline ? t("aiChat.online") : t("aiChat.offline")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link
                  href={fullWorkspaceHref}
                  title="Expand to Full Workspace"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <Maximize2 size={13} />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-[13px] scrollbar-thin">
              {/* Welcome Message */}
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                  <Bot size={13} />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-border/50 bg-muted/60 p-3 text-foreground">
                  <p className="leading-relaxed">
                    Hello! I&apos;m your <strong>MyJudicial AI Legal Assistant</strong>.
                    Describe any legal matter in Rwanda to receive instant case
                    triage and verified expert recommendations.
                  </p>
                </div>
              </div>

              {/* Quick Prompts (only when fresh) */}
              {messages.length === 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Common topics:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-brand-dark/40 hover:bg-muted/40"
                      >
                        <span>{prompt}</span>
                        <ChevronRight size={12} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Log */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                      <Bot size={13} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-brand-dark text-on-brand shadow-sm"
                        : "rounded-tl-sm border border-border/50 bg-muted/60 text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                    {/* Analysis Badges */}
                    {msg.analysis && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/40 pt-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand-dark/10 px-2 py-0.5 font-medium text-brand-dark dark:bg-white/10 dark:text-white">
                          <Scale size={11} />
                          {msg.analysis.specialty.replace(/_/g, " ")}
                        </span>
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                          Urgency: {msg.analysis.urgency_level}
                        </span>
                      </div>
                    )}

                    {/* Expert Recommendations */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-border/40 pt-2.5">
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Recommended Experts:
                        </p>
                        {msg.recommendations.slice(0, 2).map((rec) => (
                          <div
                            key={rec.expert.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-2 shadow-xs transition hover:border-brand-dark/30"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-foreground">
                                {rec.expert.full_name}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                {rec.expert.rating && (
                                  <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                    <Star size={9} fill="currentColor" />
                                    {rec.expert.rating.toFixed(1)}
                                  </span>
                                )}
                                {rec.expert.location && (
                                  <span className="flex items-center gap-0.5 truncate">
                                    <MapPin size={9} />
                                    {rec.expert.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Link
                              href={`/lawyers/${rec.expert.id}`}
                              className="shrink-0 rounded-lg bg-brand-dark px-2.5 py-1 text-[11px] font-semibold text-on-brand shadow-xs transition hover:opacity-90"
                            >
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex items-start gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                    <Bot size={13} />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border/50 bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                    <Loader2 size={13} className="animate-spin text-brand-dark dark:text-white" />
                    <span>Analyzing case &amp; finding lawyers...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer Workspace Link */}
            {messages.length > 0 && (
              <div className="border-t border-border/50 bg-muted/20 px-3 py-1.5 text-right">
                <Link
                  href={fullWorkspaceHref}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark hover:underline dark:text-white"
                >
                  <span>Open in Full Case Workspace</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            )}

            {/* Input Bar */}
            <div className="border-t border-border bg-card p-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  disabled={isProcessing}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your legal issue..."
                  className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-dark focus:bg-card dark:focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-on-brand shadow-xs transition hover:opacity-90 disabled:opacity-40"
                  aria-label="Send message"
                >
                  {isProcessing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Action Button (FAB) ────────────────────────────────── */}
      {!isOpen && (
        <div
          className="flex flex-col items-end gap-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Hover Preview Card */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="relative w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/[0.06] dark:!border-[#2a303a] dark:!bg-[#1a1e26] dark:ring-white/5"
              >
                {/* Dismiss */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissed(true);
                  }}
                  className="absolute right-2 top-2 z-10 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss AI assistant"
                >
                  <X size={14} />
                </button>

                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ backgroundColor: INDUSTRIAL_BLUE }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/10">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold tracking-[-0.01em] text-white">
                      {t("aiChat.title")}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isOnline ? "bg-emerald-400" : "bg-slate-400"
                        }`}
                      />
                      <span className="text-[11px] font-medium tracking-wide text-white/70">
                        {isOnline ? t("aiChat.online") : t("aiChat.offline")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-4 py-4">
                  <p className="text-[13px] font-[450] leading-[1.6] text-slate-900 dark:text-[#e8ecef]">
                    {t("aiChat.previewMessage")}
                  </p>
                  <p className="mt-2 text-[11px] italic leading-relaxed text-slate-500 dark:text-[#8a9099]">
                    {t("aiChat.previewExample")}
                  </p>
                </div>

                {/* Open Chat Trigger */}
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-[#232830] dark:bg-[#1f242e]/60">
                  <button
                    onClick={() => {
                      setIsOpen(true);
                      setHovered(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-[1.08] active:scale-[0.98]"
                    style={{ backgroundColor: INDUSTRIAL_BLUE }}
                  >
                    <Sparkles size={14} />
                    <span>Chat with AI</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Circle Button */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <button
              onClick={() => setIsOpen(true)}
              aria-label={t("aiChat.title")}
              className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-lg shadow-black/20 ring-1 ring-black/10 transition-shadow hover:shadow-xl hover:shadow-black/25"
              style={{ backgroundColor: INDUSTRIAL_BLUE }}
            >
              <Bot size={22} className="text-white sm:hidden" />
              <Bot size={24} className="text-white hidden sm:block" />
              <span
                className={`absolute right-0.5 top-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white ${
                  isOnline ? "bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-slate-400"
                }`}
              />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
