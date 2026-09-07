"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { Bot, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

type AiStatus = "online" | "offline";

const HEALTH_POLL_INTERVAL_MS = 30_000;
const INDUSTRIAL_BLUE = "#24558d";

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
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>("offline");
  const t = useTranslations("public");

  const poll = useCallback(async () => {
    const status = await checkAiHealth();
    setAiStatus(status);
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, HEALTH_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    const handler = () => {
      window.location.href = "/ai";
    };
    window.addEventListener("open-ai-chat", handler);
    return () => window.removeEventListener("open-ai-chat", handler);
  }, []);

  if (dismissed) return null;

  const isOnline = aiStatus === "online";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview card — industrial: tight radius, hard border, no theme-following header */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="relative w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/[0.06] dark:!border-[#2a303a] dark:!bg-[#1a1e26] dark:ring-white/5"
          >
            {/* Dismiss — always on industrial blue header */}
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

            {/* Header — HARD-ANCHORED industrial blue, never flips with theme.
                Previous bug: bg-brand-dark (→ 248,250,252 in dark) + dark:bg-white
                with dark:text-brand-dark (also 248,250,252) = white-on-white. */}
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
                  {/* Real green for Online (not the remapped emerald→slate), gray for Offline */}
                  <span
                    className={isOnline ? "h-1.5 w-1.5 animate-pulse rounded-full shadow-[0_0_0_3px_rgba(34,197,94,0.25)]" : "h-1.5 w-1.5 rounded-full"}
                    style={{ backgroundColor: isOnline ? "#22c55e" : "#9aa0a6" }}
                  />
                  <span className="text-[11px] font-medium tracking-wide text-white/70">
                    {isOnline ? t("aiChat.online") : t("aiChat.offline")}
                  </span>
                </div>
              </div>
            </div>

            {/* Body — respects card theme (white / dark charcoal) */}
            <div className="px-4 py-4">
              <p className="text-[13px] font-[450] leading-[1.6] text-slate-900 dark:text-[#e8ecef]">
                {t("aiChat.previewMessage")}
              </p>
              <p className="mt-2 text-[11px] italic leading-relaxed text-slate-500 dark:text-[#8a9099]">
                {t("aiChat.previewExample")}
              </p>
            </div>

            {/* CTA — industrial: always brand blue, never flips to white in dark */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-[#232830] dark:bg-[#1f242e]/60">
              <Link
                href="/ai"
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-[1.08] active:scale-[0.98]"
                style={{ backgroundColor: INDUSTRIAL_BLUE }}
              >
                {t("aiChat.tryAi")}
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — industrial: constant brand blue, status dot with adaptive border */}
      <motion.div
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Link
          href="/ai"
          aria-label={t("aiChat.title")}
          className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/20 ring-1 ring-black/10 transition-shadow hover:shadow-xl hover:shadow-black/25"
          style={{ backgroundColor: INDUSTRIAL_BLUE }}
        >
          <Bot size={24} className="text-white" />
          {/* System status dot — mirrors header indicator; border adapts to canvas */}
          <span
            className={`absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 ${isOnline ? "shadow-[0_0_6px_rgba(34,197,94,0.6)]" : ""}`}
            style={{
              backgroundColor: isOnline ? "#22c55e" : "#9aa0a6",
              borderColor: "white",
            }}
          />
        </Link>
      </motion.div>
    </div>
  );
}
