import { useState, useEffect, useCallback } from "react";
import type { ExpertSummary } from "@/lib/api/landing";

const SAVED_KEY = "mj_saved_experts";

export function useSavedExperts() {
  const [saved, setSaved] = useState<ExpertSummary[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return;
      const items = JSON.parse(raw) as ExpertSummary[];
      setSaved(items);
    } catch {
      localStorage.removeItem(SAVED_KEY);
    }
  }, []);

  const isSaved = useCallback(
    (id: string) => saved.some((e) => e.id === id),
    [saved]
  );

  const toggleSave = useCallback((expert: ExpertSummary) => {
    setSaved((prev) => {
      const exists = prev.some((e) => e.id === expert.id);
      const next = exists
        ? prev.filter((e) => e.id !== expert.id)
        : [...prev, expert];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        // silently ignore
      }
      return next;
    });
  }, []);

  return { saved, isSaved, toggleSave };
}
