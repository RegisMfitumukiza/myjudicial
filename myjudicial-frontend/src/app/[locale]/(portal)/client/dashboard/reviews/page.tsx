"use client";

import { Link } from "@/i18n/routing";
import { Loader2, Star, MessageSquare, ArrowLeft, Calendar } from "lucide-react";
import { useGetReviewsMyReviews } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";

export default function MyReviewsPage() {
  const t = useTranslations("clientDashboard.reviews");
  const locale = useLocale();
  const { data, isLoading, isError } = useGetReviewsMyReviews({ page: "1", limit: "50" });

  const reviews = data?.status === 200 ? (data.data.data ?? []) : [];

  return (
    <main className="mx-auto max-w-[900px] space-y-6 p-6 lg:p-8">
      <Link
        href="/client/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
      >
        <ArrowLeft size={14} />
        {t("backToDashboard")}
      </Link>

      <div>
        <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t("failedToLoad")}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <Star size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-brand-dark dark:text-gray-100">{t("noReviews")}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {t("noReviewsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/client/dashboard/consultations/${review.booking.id}`}
                    className="text-[15px] font-bold text-brand-dark hover:underline dark:text-gray-100"
                  >
                    {review.expert.displayName}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(review.booking.scheduledStart).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < review.rating ? "fill-amber-500 text-amber-500" : "text-gray-200 dark:text-gray-700"}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
