import { useState, useEffect, useCallback } from "react";
import type { LandingExpert } from "@/lib/api/landing";

const SAVED_KEY = "mj_saved_experts";

export function useSavedExperts() {
  const [saved, setSaved] = useState<LandingExpert[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return;
      const items = JSON.parse(raw) as LandingExpert[];
      setSaved(items);
    } catch {
      localStorage.removeItem(SAVED_KEY);
    }
  }, []);

  const isSaved = useCallback(
    (id: string) => saved.some((e) => e.id === id),
    [saved]
  );

  const toggleSave = useCallback((expert: LandingExpert) => {
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
