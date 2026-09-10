import { useState, useEffect } from "react";
import type { LandingExpert } from "@/lib/api/landing";

const RECENTLY_VIEWED_KEY = "mj_recently_viewed";
const MAX_RECENT = 10;
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type StoredExpert = {
  id: string;
  name: string;
  specialty: string | null;
  avatarUrl: string | null;
  rating: number | null;
  city: string | null;
  timestamp: number;
};

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<LandingExpert[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!raw) return;
      const items: StoredExpert[] = JSON.parse(raw);
      const now = Date.now();
      const valid = items.filter((e) => now - e.timestamp < EXPIRY_MS);
      if (valid.length !== items.length) {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(valid));
      }
      setRecent(
        valid.map((e) => ({
          id: e.id,
          name: e.name,
          specialty: e.specialty,
          avatarUrl: e.avatarUrl,
          rating: e.rating,
          city: e.city,
          reviewCount: 0,
          flatFee: null,
          currency: "RWF",
          specialties: e.specialty ? [e.specialty] : [],
        }))
      );
    } catch {
      // corrupted localStorage — clear silently
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    }
  }, []);

  return recent;
}

export function trackExpertView(expert: LandingExpert) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const items: StoredExpert[] = raw ? JSON.parse(raw) : [];
    const deduped = items.filter((e) => e.id !== expert.id);
    deduped.unshift({
      id: expert.id,
      name: expert.name,
      specialty: expert.specialty,
      avatarUrl: expert.avatarUrl,
      rating: expert.rating,
      city: expert.city,
      timestamp: Date.now(),
    });
    localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify(deduped.slice(0, MAX_RECENT))
    );
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
