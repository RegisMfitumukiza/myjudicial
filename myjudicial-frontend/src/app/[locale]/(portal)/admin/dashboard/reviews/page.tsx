"use client";

import { useState } from "react";
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";

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
  LoadingSpinner,
  ErrorState,
} from "@/shared/components/dashboard";

type ReviewStatus = "ALL" | "APPROVED" | "PENDING" | "HIDDEN";

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReports: number;
}

interface Review {
  id: string;
  expertName: string;
  clientName: string;
  expertAvatarUrl?: string | null;
  clientAvatarUrl?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  status: string;
}

const STATUS_TONE: Record<string, "success" | "pending" | "destructive" | "neutral"> = {
  APPROVED: "success",
  PENDING: "pending",
  HIDDEN: "destructive",
};

export default function ReviewsPage() {
  const t = useTranslations("admin.reviews");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("ALL");

  const STATUS_LABEL: Record<string, string> = {
    APPROVED: t("approved"),
    PENDING: t("pending"),
    HIDDEN: t("hidden"),
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

  const { data: stats, isLoading: statsLoading } = useQuery<ReviewStats>({
    queryKey: ["admin-reviews-stats"],
    queryFn: () => apiFetch("/admin/reviews/stats"),
  });

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
    mutationFn: ({ id, action }: { id: string; action: "APPROVE" | "HIDE" }) =>
      apiFetch(`/admin/reviews/${id}/moderate`, { method: "PATCH", body: { action } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-stats"] });
    },
  });

  const reviews: Review[] = reviewsResponse?.data ?? [];
  const rawPagination = (reviewsResponse as any)?.pagination ?? (reviewsResponse as any)?.meta;
  const pagination = rawPagination
    ? {
        page: rawPagination.page ?? page,
        totalPages: rawPagination.totalPages ?? rawPagination.pages ?? 1,
        total: rawPagination.total ?? reviews.length,
      }
    : undefined;

  if (statsLoading || reviewsLoading) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <LoadingSpinner label={t("loading")} />
      </div>
    );
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
            value={stats.totalReviews.toLocaleString()}
            icon={MessageSquare}
          />
          <StatCard
            label={t("averageRating")}
            value={stats.averageRating.toFixed(1)}
            icon={Star}
          />
          <StatCard
            label={t("pendingReports")}
            value={stats.pendingReports.toLocaleString()}
            icon={AlertTriangle}
          />
        </div>
      )}

      <Card>
        <CardContent>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ReviewStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("allStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allStatus")}</SelectItem>
              <SelectItem value="APPROVED">{t("approved")}</SelectItem>
              <SelectItem value="PENDING">{t("pending")}</SelectItem>
              <SelectItem value="HIDDEN">{t("hidden")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                        <div className="flex items-center gap-2">
                          <ExpertAvatar
                            src={review.expertAvatarUrl}
                            name={review.expertName ?? "Expert"}
                            size="xs"
                            className="h-8 w-8 text-xs shrink-0"
                          />
                          <p className="font-medium text-foreground">{review.expertName ?? "Expert"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            src={review.clientAvatarUrl}
                            name={review.clientName ?? "Client"}
                            size="xs"
                            className="h-8 w-8 text-xs shrink-0"
                          />
                          <p className="font-medium text-foreground">{review.clientName ?? "Client"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                            />
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">{review.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{formatDate(review.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge tone={STATUS_TONE[review.status] ?? "neutral"}>
                          {STATUS_LABEL[review.status] ?? review.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {review.status !== "APPROVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moderateMutation.mutate({ id: review.id, action: "APPROVE" })}
                              disabled={moderateMutation.isPending}
                            >
                              <Eye size={14} />
                              {t("approve")}
                            </Button>
                          )}
                          {review.status !== "HIDDEN" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => moderateMutation.mutate({ id: review.id, action: "HIDE" })}
                              disabled={moderateMutation.isPending}
                            >
                              <EyeOff size={14} />
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
        </CardContent>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 sm:px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages} ({pagination.total})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
