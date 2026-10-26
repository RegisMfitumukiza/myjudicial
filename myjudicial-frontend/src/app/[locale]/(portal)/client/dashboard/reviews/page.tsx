"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { Star, ArrowLeft, Calendar, Sparkles, ArrowRight, Search } from "lucide-react";
import { useGetReviewsMyReviews, useGetBookings } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";

export default function MyReviewsPage() {
  const t = useTranslations("clientDashboard.reviews");
  const locale = useLocale();

  const [selectedRating, setSelectedRating] = useState<number | "ALL">("ALL");

  const { data, isLoading, isError } = useGetReviewsMyReviews({ page: "1", limit: "50" });
  const { data: bookingsData } = useGetBookings({ page: 1, limit: 30 });

  const reviews = useMemo(() => {
    return data?.status === 200 ? (data.data.data ?? []) : [];
  }, [data]);

  const bookings = useMemo(() => {
    return bookingsData?.status === 200 ? (bookingsData.data.data ?? []) : [];
  }, [bookingsData]);

  // Identify completed bookings that still need client review
  const unreviewedBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === "COMPLETED" &&
        !(b as unknown as { hasReview?: boolean }).hasReview &&
        !(b as unknown as { review?: unknown }).review
    );
  }, [bookings]);

  const filteredReviews = useMemo(() => {
    if (selectedRating === "ALL") return reviews;
    return reviews.filter((r) => r.rating === selectedRating);
  }, [reviews, selectedRating]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <Link
        href="/client/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
      >
        <ArrowLeft size={14} />
        {t("backToDashboard")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[22px] font-bold text-brand-dark dark:text-gray-100 break-words">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/70 px-3.5 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-200 self-start sm:self-auto shrink-0">
            <Star size={14} className="fill-amber-500 text-amber-500" />
            <span>
              {averageRating} / 5.0 • {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
      </div>

      {/* Pending Review Prompt Banner (if client has completed consultations awaiting review) */}
      {unreviewedBookings.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 sm:p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-dark dark:text-white">
                  {t("pendingReviewBanner", { count: unreviewedBookings.length })}
                </p>
                <p className="text-xs text-brand-dark/60 dark:text-white/60 mt-0.5">
                  {unreviewedBookings[0].service?.name || "Consultation"} with{" "}
                  {unreviewedBookings[0].expert?.displayName || "Legal Advocate"}
                </p>
              </div>
            </div>
            <Link
              href={`/client/dashboard/consultations/${unreviewedBookings[0].id}/review`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 dark:bg-white dark:text-black shrink-0 transition-opacity"
            >
              <span>{t("leaveReviewBtn")}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Rating Filter Tabs */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <button
            onClick={() => setSelectedRating("ALL")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              selectedRating === "ALL"
                ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm"
                : "border border-brand-border/20 text-brand-dark/70 hover:bg-brand-dark/[0.04] dark:border-white/10 dark:text-white/70"
            }`}
          >
            {t("filterAll")} ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r) => r.rating === stars).length;
            if (count === 0 && selectedRating !== stars) return null;
            return (
              <button
                key={stars}
                onClick={() => setSelectedRating(stars)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  selectedRating === stars
                    ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm"
                    : "border border-brand-border/20 text-brand-dark/70 hover:bg-brand-dark/[0.04] dark:border-white/10 dark:text-white/70"
                }`}
              >
                <span>{stars}</span>
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Reviews Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-brand-border/20 bg-white dark:border-white/10 dark:bg-black"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t("failedToLoad")}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/20 bg-white p-10 text-center dark:border-white/10 dark:bg-black">
          <Star size={36} className="mx-auto mb-3 text-brand-dark/20 dark:text-white/20" />
          <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
            {t("noReviews")}
          </p>
          <p className="mt-1 text-xs text-brand-dark/50 dark:text-white/50 max-w-sm mx-auto">
            {t("noReviewsDesc")}
          </p>
          <div className="mt-5">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 dark:bg-white dark:text-black"
            >
              <Search size={13} />
              <span>{t("browseLawyersBtn")}</span>
            </Link>
          </div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/20 bg-white p-8 text-center dark:border-white/10 dark:bg-black">
          <p className="text-sm text-brand-dark/50 dark:text-white/50">
            {t("noReviewsForRating", { rating: selectedRating })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/client/dashboard/consultations/${review.booking.id}`}
                    className="text-[15px] font-bold text-brand-dark hover:underline dark:text-gray-100"
                  >
                    {review.expert.displayName}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-brand-dark/50 dark:text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(review.booking.scheduledStart).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>{(review.booking as unknown as { service?: { name?: string } }).service?.name || "Consultation"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={
                        i < review.rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-gray-200 dark:text-gray-700"
                      }
                    />
                  ))}
                  <span className="ml-1 text-xs font-bold text-brand-dark dark:text-white">
                    {review.rating}.0
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="mt-3.5 text-xs sm:text-[13px] leading-relaxed text-brand-dark/70 dark:text-white/70 border-t border-brand-border/10 dark:border-white/10 pt-3">
                  &ldquo;{review.comment}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
