"use client";

import { useState } from "react";
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { ExpertAvatar, UserAvatar } from "@/shared/components/expert-avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  TableSkeleton,
  ErrorState,
} from "@/shared/components/dashboard";

type ReviewStatus = "ALL" | "PUBLISHED" | "PENDING" | "FLAGGED" | "HIDDEN";

interface ReviewStats {
  totalReviews: number;
  averageRating: number | null;
  pendingReports: number;
  byStatus?: {
    published: number;
    pending: number;
    hidden: number;
    flagged: number;
    removed: number;
  };
}

interface Review {
  id: string;
  expertName: string;
  clientName: string;
  expertAvatarUrl?: string | null;
  clientAvatarUrl?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
  status: string;
  isFlagged?: boolean;
}

const STATUS_TONE: Record<string, "success" | "pending" | "destructive" | "neutral"> = {
  PUBLISHED: "success",
  APPROVED: "success",
  PENDING: "pending",
  FLAGGED: "destructive",
  HIDDEN: "neutral",
  REMOVED: "destructive",
};

export default function ReviewsPage() {
  const t = useTranslations("admin.reviews");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("ALL");

  const STATUS_LABEL: Record<string, string> = {
    PUBLISHED: t("published"),
    APPROVED: t("published"),
    PENDING: t("pending"),
    FLAGGED: t("flagged"),
    HIDDEN: t("hidden"),
    REMOVED: t("removed"),
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const { data: statsData, isLoading: statsLoading } = useQuery<{ data?: ReviewStats } & ReviewStats>({
    queryKey: ["admin-reviews-stats"],
    queryFn: () => apiFetch("/admin/reviews/stats"),
  });

  const stats: ReviewStats | undefined = (statsData as any)?.data ?? statsData;

  const { data: reviewsResponse, isLoading: reviewsLoading, error: reviewsError } = useQuery({
    queryKey: ["admin-reviews", statusFilter, page],
    queryFn: () =>
      apiFetch<{
        data: Review[];
        pagination?: { page: number; totalPages?: number; pages?: number; total: number };
        meta?: { page: number; totalPages?: number; pages?: number; total: number };
      }>(
        `/admin/reviews?${statusFilter !== "ALL" ? `status=${statusFilter}&` : ""}page=${page}&limit=20`
      ),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "PUBLISHED" | "HIDDEN" }) =>
      apiFetch(`/admin/reviews/${id}/moderate`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      toast.success(t("moderateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-stats"] });
    },
    onError: () => {
      toast.error(t("moderateFailed"));
    },
  });

  const reviews: Review[] = Array.isArray(reviewsResponse?.data)
    ? reviewsResponse.data
    : Array.isArray(reviewsResponse)
      ? (reviewsResponse as Review[])
      : [];
  const rawPagination = (reviewsResponse as any)?.pagination ?? (reviewsResponse as any)?.meta;
  const pagination = rawPagination
    ? {
        page: rawPagination.page ?? page,
        totalPages: rawPagination.totalPages ?? rawPagination.pages ?? 1,
        total: rawPagination.total ?? reviews.length,
      }
    : undefined;

  if ((statsLoading && !statsData) || (reviewsLoading && !reviewsResponse)) {
    return <TableSkeleton statsCount={4} columns={5} rows={5} />;
  }

  if (reviewsError) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <PageHeader
          title={t("title")}
          description={t("subtitle")}
        />
        <ErrorState
          title={t("failedToLoad")}
          message={
            reviewsError instanceof Error
              ? reviewsError.message
              : t("unknownError")
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {stats && (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            label={t("totalReviews")}
            value={(stats.totalReviews ?? 0).toLocaleString(locale)}
            icon={MessageSquare}
          />
          <StatCard
            label={t("averageRating")}
            value={stats.averageRating != null && !isNaN(Number(stats.averageRating)) ? Number(stats.averageRating).toFixed(1) : "—"}
            icon={Star}
          />
          <StatCard
            label={t("pendingReports")}
            value={(stats.pendingReports ?? 0).toLocaleString(locale)}
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-muted-foreground shrink-0" />
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as ReviewStatus);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder={t("allStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                  <SelectItem value="PUBLISHED">{t("published")}</SelectItem>
                  <SelectItem value="PENDING">{t("pending")}</SelectItem>
                  <SelectItem value="FLAGGED">{t("flagged")}</SelectItem>
                  <SelectItem value="HIDDEN">{t("hidden")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {pagination ? `${reviews.length} / ${pagination.total} ${t("title").toLowerCase()}` : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {/* Desktop & Tablet Table (>= md: 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">{t("expert")}</th>
                  <th className="px-6 py-4">{t("client")}</th>
                  <th className="px-6 py-4">{t("rating")}</th>
                  <th className="px-6 py-4">{t("date")}</th>
                  <th className="px-6 py-4">{t("status")}</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={MessageSquare}
                        title={t("noReviews")}
                      />
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <ExpertAvatar
                            src={review.expertAvatarUrl}
                            name={review.expertName ?? "Expert"}
                            size="xs"
                            className="h-8 w-8 text-xs shrink-0"
                          />
                          <p className="font-semibold text-foreground text-sm">{review.expertName ?? "Expert"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            src={review.clientAvatarUrl}
                            name={review.clientName ?? "Client"}
                            size="xs"
                            className="h-8 w-8 text-xs shrink-0"
                          />
                          <p className="font-medium text-foreground text-sm">{review.clientName ?? "Client"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= Number(review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-foreground">{review.rating}.0</span>
                        </div>
                        {review.comment && (
                          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground line-clamp-2" title={review.comment}>
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-foreground text-xs">{formatDate(review.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge tone={STATUS_TONE[review.status] ?? "neutral"}>
                          {STATUS_LABEL[review.status] ?? review.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {review.status !== "PUBLISHED" && review.status !== "APPROVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              onClick={() => moderateMutation.mutate({ id: review.id, status: "PUBLISHED" })}
                              disabled={moderateMutation.isPending}
                            >
                              <Eye size={13} />
                              {t("approve")}
                            </Button>
                          )}
                          {review.status !== "HIDDEN" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => moderateMutation.mutate({ id: review.id, status: "HIDDEN" })}
                              disabled={moderateMutation.isPending}
                            >
                              <EyeOff size={13} />
                              {t("hide")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack (< md: 768px) */}
          <div className="block md:hidden divide-y divide-border">
            {reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={t("noReviews")}
              />
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <ExpertAvatar
                        src={review.expertAvatarUrl}
                        name={review.expertName ?? "Expert"}
                        size="xs"
                        className="h-9 w-9 text-xs shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.expertName ?? "Expert"}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <User size={12} className="shrink-0" />
                          <span>{review.clientName ?? "Client"}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge tone={STATUS_TONE[review.status] ?? "neutral"}>
                      {STATUS_LABEL[review.status] ?? review.status}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= Number(review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                        />
                      ))}
                      <span className="ml-1 font-bold text-foreground">{review.rating}.0</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>

                  {review.comment && (
                    <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed italic border border-border/50">
                      &ldquo;{review.comment}&rdquo;
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {review.status !== "PUBLISHED" && review.status !== "APPROVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                        onClick={() => moderateMutation.mutate({ id: review.id, status: "PUBLISHED" })}
                        disabled={moderateMutation.isPending}
                      >
                        <Eye size={13} />
                        {t("approve")}
                      </Button>
                    )}
                    {review.status !== "HIDDEN" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-9 text-xs gap-1.5"
                        onClick={() => moderateMutation.mutate({ id: review.id, status: "HIDDEN" })}
                        disabled={moderateMutation.isPending}
                      >
                        <EyeOff size={13} />
                        {t("hide")}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 sm:px-6 py-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages} ({(pagination.total ?? 0).toLocaleString(locale)} {t("title").toLowerCase()})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1 text-xs"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1 text-xs"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
