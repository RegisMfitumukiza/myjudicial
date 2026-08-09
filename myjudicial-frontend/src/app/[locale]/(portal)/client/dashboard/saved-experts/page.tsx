"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { Loader2, Bookmark, ArrowLeft, Star, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSavedExperts,
  removeSavedExpert,
  type SavedExpert,
} from "@/lib/api/saved-experts";

const SPECIALTY_LABELS: Record<string, string> = {
  FAMILY_LAW: "Family Law",
  COMMERCIAL_LAW: "Commercial Law",
  EMPLOYMENT_LAW: "Employment Law",
  LAND_LAW: "Land Law",
  CRIMINAL_LAW: "Criminal Law",
  TAX_LAW: "Tax Law",
  IMMIGRATION_LAW: "Immigration Law",
  CORPORATE_LAW: "Corporate Law",
  CONTRACT_LAW: "Contract Law",
  INTELLECTUAL_PROPERTY: "Intellectual Property",
  OTHER: "Other",
};

export default function SavedExpertsPage() {
  const [experts, setExperts] = useState<SavedExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadExperts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(false);
      const data = await getSavedExperts();
      setExperts(data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperts();
  }, [loadExperts]);

  async function handleRemove(expertId: string) {
    setRemovingId(expertId);
    try {
      await removeSavedExpert(expertId);
      setExperts((prev) => prev.filter((e) => e.expertId !== expertId));
      toast.success("Expert removed from saved list");
    } catch {
      toast.error("Failed to remove expert");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-[900px] space-y-6 p-6 lg:p-8">
      <Link
        href="/client/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
      >
        <ArrowLeft size={14} />
        Dashboard
      </Link>

      <div>
        <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100">Saved Experts</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Experts you have bookmarked for quick access</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          Failed to load saved experts. Please try again.
        </div>
      ) : experts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <Bookmark size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-brand-dark dark:text-gray-100">No saved experts yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Browse experts and save them for quick access later.
          </p>
          <Link
            href="/experts"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-brand-dark"
          >
            Find Lawyers
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {experts.map((item) => {
            const e = item.expert;
            const isRemoving = removingId === item.expertId;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-dark/8 text-[13px] font-bold text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
                    {e.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/lawyers/${e.id}`}
                      className="text-[15px] font-bold text-brand-dark hover:underline dark:text-gray-100"
                    >
                      {e.displayName}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{SPECIALTY_LABELS[e.primarySpecialty] ?? e.primarySpecialty}</span>
                      {e.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {e.city}
                        </span>
                      )}
                      {e.averageRating && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="fill-amber-500 text-amber-500" />
                          {Number(e.averageRating).toFixed(1)}
                          <span className="text-gray-400">({e.reviewCount})</span>
                        </span>
                      )}
                      {e.baseConsultationFee && (
                        <span className="font-semibold text-brand-dark dark:text-white">
                          RWF {Number(e.baseConsultationFee).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.expertId)}
                  disabled={isRemoving}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 disabled:opacity-50"
                  title="Remove from saved"
                >
                  {isRemoving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
