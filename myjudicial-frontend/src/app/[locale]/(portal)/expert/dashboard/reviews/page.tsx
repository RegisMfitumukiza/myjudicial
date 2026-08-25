"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, ChevronDown, TrendingUp, MessageSquare, Calendar, Filter, Reply, Send, Trash2, Pencil, X, Check, Loader2 } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useGetExpertsProfileMe,
  useGetExpertsExpertIdReviewsSummary,
  useGetExpertsExpertIdReviews,
  useGetExpertsExpertIdReviewsDistribution,
} from "@/api/generated";
import { postReviewReply, patchReviewReply, deleteReviewReply } from "@/lib/api/reviews";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  PageHeader,
  SkeletonCard,
  ErrorState,
} from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";

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
          className={star <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}
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
    onError: (err: unknown) => toast.error(getErrorMessage(err, t("replyFailed"))),
  });

  const editReplyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) => patchReviewReply(reviewId, reply),
    onSuccess: () => {
      toast.success(t("replyUpdated"));
      setEditingReply(null);
      setEditText("");
      refreshReviews();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, t("replyUpdateFailed"))),
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReviewReply(reviewId),
    onSuccess: () => {
      toast.success(t("replyDeleted"));
      refreshReviews();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, t("replyDeleteFailed"))),
  });

  if (profileLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard className="lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (profileNotFound) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("monitorSubtitle")} className="mb-6" />
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <EmptyBlock title={t("noProfileTitle")} description={t("noProfileDesc")} icon={<MessageSquare />} />
        </div>
      </div>
    );
  }

  if (!profileLoading && !profileNotFound && !!expertId && (summaryQ.isError || distributionQ.isError || reviewsQ.isError)) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("monitorSubtitle")} className="mb-6" />
        <ErrorState
          onRetry={() => {
            summaryQ.refetch();
            distributionQ.refetch();
            reviewsQ.refetch();
          }}
        />
      </div>
    );
  }

  const maxDistribution = distribution
    ? Math.max(distribution["1"], distribution["2"], distribution["3"], distribution["4"], distribution["5"], 1)
    : 1;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("monitorSubtitle")}
        actions={
          summary ? (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {summary.averageRating ? summary.averageRating.toFixed(1) : "-"}
                </div>
                <div className="text-xs text-muted-foreground">{t("avgRating")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{summary.totalReviews}</div>
                <div className="text-xs text-muted-foreground">{t("totalReviews")}</div>
              </div>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {summaryQ.isLoading || !summary ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-2">
                <Star className="mx-auto mb-2 h-8 w-8 fill-primary text-primary" />
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {summary.averageRating ? summary.averageRating.toFixed(1) : "-"}
                </p>
                {summary.averageRating && (
                  <div className="mt-1 flex justify-center">
                    <StarRating rating={Math.round(summary.averageRating)} size={16} />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t("overallRating")}</p>
              <p className="text-xs text-muted-foreground/80">
                {t("basedOnReviews", { count: summary.totalReviews, s: summary.totalReviews !== 1 ? "s" : "" })}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums text-foreground">+12%</p>
              <p className="text-xs text-muted-foreground">{t("vsLastMonth")}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-muted-foreground">{t("ratingImprovement")}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {(reviews as any[]).filter((r: any) => {
                  const daysSince = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince <= 7;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">{t("thisWeek")}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-muted-foreground">{t("newReviewsTitle")}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {distributionQ.isLoading || !distribution ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <h4 className="mb-4 font-semibold text-foreground">{t("ratingBreakdown")}</h4>
              <div className="space-y-2">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = distribution[String(star) as keyof typeof distribution];
                  const pct = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right text-muted-foreground">{star}</span>
                      <Star size={11} className="fill-primary text-primary" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{t("clientReviews")}</h3>
              <p className="text-sm text-muted-foreground">
                {pagination ? t("reviewCount", { count: pagination.total, s: pagination.total !== 1 ? "s" : "" }) : ""}
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                aria-expanded={showSort}
                aria-haspopup="listbox"
                className="flex w-full items-center justify-between gap-1.5 whitespace-nowrap rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none transition-colors select-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Filter size={14} className="text-muted-foreground" />
                {t(SORT_OPTIONS.find((o) => o.value === sort)?.labelKey ?? "sortDefault")}
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setShowSort(false); }}
                        role="option"
                        aria-selected={sort === opt.value}
                        className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted ${
                          sort === opt.value ? "text-primary" : "text-muted-foreground"
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
            <SkeletonListInline />
          ) : reviews.length === 0 ? (
            <EmptyBlock title={t("noReviewsTitle")} description={t("noReviewsDesc")} icon={<MessageSquare />} />
          ) : (
            <div className="space-y-4">
              {(reviews as any[]).map((review: any) => (
                <div key={review.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {review.citizen.firstName[0]}{review.citizen.lastName?.[0] || ""}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {review.citizen.firstName} {review.citizen.lastName}
                          </p>
                          <span className="text-xs text-muted-foreground">-</span>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeDate(review.createdAt, t)}
                          </p>
                        </div>

                        {review.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {review.comment}
                          </p>
                        )}

                        {review.expertReply && editingReply !== review.id ? (
                          <div className="mt-3 rounded-lg border border-border bg-muted p-3">
                            <div className="flex items-center gap-2">
                              <Reply size={12} className="text-primary" />
                              <span className="text-xs font-medium text-primary">{t("yourReply")}</span>
                              {review.expertReply.editedAt && (
                                <span className="text-xs text-muted-foreground">{t("edited")}</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{review.expertReply.reply}</p>
                            <div className="mt-2 flex gap-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => { setEditingReply(review.id); setEditText(review.expertReply.reply); }}
                              >
                                <Pencil /> {t("editReply")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm(t("confirmDeleteReply"))) {
                                    deleteReplyMutation.mutate(review.id);
                                  }
                                }}
                              >
                                <Trash2 /> {t("deleteReply")}
                              </Button>
                            </div>
                          </div>
                        ) : editingReply === review.id ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="xs"
                                onClick={() => editReplyMutation.mutate({ reviewId: review.id, reply: editText })}
                                disabled={!editText.trim() || editReplyMutation.isPending}
                              >
                                {editReplyMutation.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                                {t("saveReply")}
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => { setEditingReply(null); setEditText(""); }}
                              >
                                <X /> {t("cancel")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          !review.expertReply && replyingTo !== review.id && (
                            <Button
                              variant="link"
                              size="xs"
                              className="mt-2 h-auto px-0"
                              onClick={() => { setReplyingTo(review.id); setReplyText(""); }}
                            >
                              <Reply /> {t("replyToReview")}
                            </Button>
                          )
                        )}

                        {replyingTo === review.id && !review.expertReply && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t("replyPlaceholder")}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="xs"
                                onClick={() => replyMutation.mutate({ reviewId: review.id, reply: replyText })}
                                disabled={!replyText.trim() || replyMutation.isPending}
                              >
                                {replyMutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
                                {t("postReply")}
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => { setReplyingTo(null); setReplyText(""); }}
                              >
                                <X /> {t("cancel")}
                              </Button>
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
                  <div className="text-xs text-muted-foreground">
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

function EmptyBlock({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <h4 className="mb-2 text-base font-semibold text-foreground">{title}</h4>
      {description && (
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function SkeletonListInline() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
