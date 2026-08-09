"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, Loader2, ChevronDown, TrendingUp, MessageSquare, Calendar, Filter, Reply, Send, Trash2, Pencil, X, Check } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useGetExpertsProfileMe,
  useGetExpertsExpertIdReviewsSummary,
  useGetExpertsExpertIdReviews,
  useGetExpertsExpertIdReviewsDistribution,
} from "@/api/generated";
import { postReviewReply, patchReviewReply, deleteReviewReply } from "@/lib/api/reviews";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { value: "newest", labelKey: "sortNewest" },
  { value: "oldest", labelKey: "sortOldest" },
  { value: "highest", labelKey: "sortHighest" },
  { value: "lowest", labelKey: "sortLowest" },
] as const;

type SortOption = typeof SORT_OPTIONS[number]["value"];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDate(iso: string, t: any): string {
  const date = new Date(iso);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("yesterday");
  if (diffDays < 7) return t("daysAgo", { days: diffDays });
  if (diffDays < 30) return t("weeksAgo", { weeks: Math.floor(diffDays / 7) });
  return formatDate(iso);
}

export default function ReviewsPage() {
  const t = useTranslations("expertDashboard_reviews");
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: profileData, isLoading: profileLoading } = useGetExpertsProfileMe();
  const expertId = profileData?.status === 200 ? profileData.data.data.id : null;
  const profileNotFound = profileData?.status === 404;

  const summaryQ = useGetExpertsExpertIdReviewsSummary(expertId ?? "", { query: { enabled: !!expertId } });
  const distributionQ = useGetExpertsExpertIdReviewsDistribution(expertId ?? "", { query: { enabled: !!expertId } });
  const reviewsQ = useGetExpertsExpertIdReviews(expertId ?? "", { sort, limit: "20" }, { query: { enabled: !!expertId } });

  const summary = summaryQ.data?.status === 200 ? summaryQ.data.data.data : null;
  const distribution = distributionQ.data?.status === 200 ? distributionQ.data.data.data : null;
  const reviews = reviewsQ.data?.status === 200 ? reviewsQ.data.data.data : [];
  const pagination = reviewsQ.data?.status === 200 ? reviewsQ.data.data.pagination : null;

  const isLoading = profileLoading || summaryQ.isLoading || reviewsQ.isLoading || distributionQ.isLoading;

  const refreshReviews = () => {
    queryClient.invalidateQueries({ queryKey: ["getExpertsExpertIdReviews", expertId] });
  };

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) => postReviewReply(reviewId, reply),
    onSuccess: () => {
      toast.success(t("replyPosted"));
      setReplyingTo(null);
      setReplyText("");
      refreshReviews();
    },
    onError: (err: any) => toast.error(err.message || t("replyFailed")),
  });

  const editReplyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) => patchReviewReply(reviewId, reply),
    onSuccess: () => {
      toast.success(t("replyUpdated"));
      setEditingReply(null);
      setEditText("");
      refreshReviews();
    },
    onError: (err: any) => toast.error(err.message || t("replyUpdateFailed")),
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReviewReply(reviewId),
    onSuccess: () => {
      toast.success(t("replyDeleted"));
      refreshReviews();
    },
    onError: (err: any) => toast.error(err.message || t("replyDeleteFailed")),
  });

  if (profileLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (profileNotFound) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("monitorSubtitle")}</p>
        </div>
        <div className="rounded-xl border border-brand-border/20 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{t("noProfileTitle")}</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("noProfileDesc")}
          </p>
        </div>
      </div>
    );
  }

  const maxDistribution = distribution
    ? Math.max(distribution["1"], distribution["2"], distribution["3"], distribution["4"], distribution["5"], 1)
    : 1;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("monitorSubtitle")}</p>
        </div>
        
        {summary && (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-dark dark:text-gray-100">
                {summary.averageRating ? summary.averageRating.toFixed(1) : "-"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("avgRating")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-dark dark:text-gray-100">{summary.totalReviews}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t("totalReviews")}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {summaryQ.isLoading || !summary ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-2">
                <Star className="mx-auto mb-2 h-8 w-8 fill-amber-400 text-amber-400" />
                <p className="text-3xl font-bold text-brand-dark dark:text-gray-100">
                  {summary.averageRating ? summary.averageRating.toFixed(1) : "-"}
                </p>
                {summary.averageRating && (
                  <div className="mt-1 flex justify-center">
                    <StarRating rating={Math.round(summary.averageRating)} size={16} />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("overallRating")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t("basedOnReviews", { count: summary.totalReviews, s: summary.totalReviews !== 1 ? "s" : "" })}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-brand-dark dark:text-gray-100">+12%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("vsLastMonth")}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">{t("ratingImprovement")}</p>
        </div>

        <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-brand-dark dark:text-gray-100">
                {(reviews as any[]).filter((r: any) => {
                  const daysSince = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince <= 7;
                }).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("thisWeek")}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">{t("newReviewsTitle")}</p>
        </div>

        <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {distributionQ.isLoading || !distribution ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <h4 className="mb-4 font-semibold text-brand-dark dark:text-gray-100">{t("ratingBreakdown")}</h4>
              <div className="space-y-2">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = distribution[String(star) as keyof typeof distribution];
                  const pct = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right text-gray-500 dark:text-gray-400">{star}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-gray-500 dark:text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-brand-border/20 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-brand-border/20 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brand-dark dark:text-gray-100">{t("clientReviews")}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pagination ? t("reviewCount", { count: pagination.total, s: pagination.total !== 1 ? "s" : "" }) : ""}
              </p>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-2 rounded-lg border border-brand-border/30 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Filter size={14} />
                {t(SORT_OPTIONS.find((o) => o.value === sort)?.labelKey ?? "sortDefault")}
                <ChevronDown size={14} />
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-brand-border/20 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setShowSort(false); }}
                        className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          sort === opt.value ? "text-brand-blue" : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {reviewsQ.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{t("noReviewsTitle")}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("noReviewsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(reviews as any[]).map((review: any) => (
                <div key={review.id} className="rounded-lg border border-gray-100 p-5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue dark:bg-brand-blue/20">
                        {review.citizen.firstName[0]}{review.citizen.lastName?.[0] || ""}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-brand-dark dark:text-gray-100">
                            {review.citizen.firstName} {review.citizen.lastName}
                          </p>
                          <span className="text-xs text-gray-400">-</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeDate(review.createdAt, t)}
                          </p>
                        </div>
                        
                        {review.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {review.comment}
                          </p>
                        )}

                        {review.expertReply && editingReply !== review.id ? (
                          <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2">
                              <Reply size={12} className="text-brand-blue" />
                              <span className="text-xs font-medium text-brand-blue">{t("yourReply")}</span>
                              {review.expertReply.editedAt && (
                                <span className="text-xs text-gray-400">{t("edited")}</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{review.expertReply.reply}</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => { setEditingReply(review.id); setEditText(review.expertReply.reply); }}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-dark dark:text-gray-400 dark:hover:text-gray-100"
                              >
                                <Pencil size={10} /> {t("editReply")}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(t("confirmDeleteReply"))) {
                                    deleteReplyMutation.mutate(review.id);
                                  }
                                }}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={10} /> {t("deleteReply")}
                              </button>
                            </div>
                          </div>
                        ) : editingReply === review.id ? (
                          <div className="mt-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 p-2 text-sm text-gray-900 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => editReplyMutation.mutate({ reviewId: review.id, reply: editText })}
                                disabled={!editText.trim() || editReplyMutation.isPending}
                                className="flex items-center gap-1 rounded-lg bg-brand-dark px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark/90 disabled:opacity-50"
                              >
                                {editReplyMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                {t("saveReply")}
                              </button>
                              <button
                                onClick={() => { setEditingReply(null); setEditText(""); }}
                                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                              >
                                <X size={12} /> {t("cancel")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          !review.expertReply && replyingTo !== review.id && (
                            <button
                              onClick={() => { setReplyingTo(review.id); setReplyText(""); }}
                              className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-blue/80"
                            >
                              <Reply size={12} /> {t("replyToReview")}
                            </button>
                          )
                        )}

                        {replyingTo === review.id && !review.expertReply && (
                          <div className="mt-3">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t("replyPlaceholder")}
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 p-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => replyMutation.mutate({ reviewId: review.id, reply: replyText })}
                                disabled={!replyText.trim() || replyMutation.isPending}
                                className="flex items-center gap-1 rounded-lg bg-brand-dark px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark/90 disabled:opacity-50"
                              >
                                {replyMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                {t("postReply")}
                              </button>
                              <button
                                onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                              >
                                <X size={12} /> {t("cancel")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      <StarRating rating={review.rating} size={16} />
                    </div>
                  </div>
                </div>
              ))}

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pagination", { page: pagination.page, pages: pagination.pages })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
