"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { Bot, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export function FloatingAiChat() {
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslations("public");

  // Listen for external open event (from HowItWorks section)
  useEffect(() => {
    const handler = () => {
      // Navigate to triage page when triggered externally
      window.location.href = "/ai";
    };
    window.addEventListener("open-ai-chat", handler);
    return () => window.removeEventListener("open-ai-chat", handler);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview card */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="relative w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Dismiss button */}
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              className="absolute right-2 top-2 rounded-full p-1 text-white/70 dark:text-muted-foreground transition-colors hover:bg-white/10 hover:text-white dark:hover:bg-brand-dark/10 dark:hover:text-foreground"
              aria-label="Dismiss AI assistant"
            >
              <X size={14} />
            </button>

            {/* Card header */}
            <div className="flex items-center gap-3 bg-brand-dark px-4 py-3 dark:bg-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 dark:bg-brand-dark/10">
                <Bot size={16} className="text-white dark:text-brand-dark" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white dark:text-brand-dark">
                  {t("aiChat.title")}
                </p>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[11px] text-white/60 dark:text-muted-foreground">{t("aiChat.online")}</span>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="px-4 py-4">
              <p className="text-[13px] leading-relaxed text-foreground">
                {t("aiChat.previewMessage")}
              </p>
              <p className="mt-2 text-[11px] italic text-muted-foreground">
                {t("aiChat.previewExample")}
              </p>
            </div>

            {/* CTA */}
            <div className="border-t border-border px-4 py-3">
              <Link
                href="/ai"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 text-[13px] font-semibold text-on-brand transition-colors hover:bg-brand-dark/90 dark:bg-brand-dark dark:hover:bg-brand-dark/80"
              >
                {t("aiChat.tryAi")}
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Link
          href="/ai"
          aria-label={t("aiChat.title")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-dark shadow-lg shadow-brand-dark/30 transition-shadow hover:shadow-xl hover:shadow-brand-dark/40"
        >
          <Bot size={24} className="text-on-brand" />
        </Link>
      </motion.div>
    </div>
  );
}
