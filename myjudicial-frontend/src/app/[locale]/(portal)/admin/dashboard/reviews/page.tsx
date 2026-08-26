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
import { format } from "date-fns";

import { Button } from "@/shared/components/ui/button";
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

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  HIDDEN: "Hidden",
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("ALL");

  const { data: stats, isLoading: statsLoading } = useQuery<ReviewStats>({
    queryKey: ["admin-reviews-stats"],
    queryFn: () => apiFetch("/admin/reviews/stats"),
  });

  const { data: reviewsResponse, isLoading: reviewsLoading, error: reviewsError } = useQuery({
    queryKey: ["admin-reviews", statusFilter],
    queryFn: () =>
      apiFetch<{ data: Review[]; pagination: { page: number; pages: number; total: number } }>(
        `/admin/reviews?${statusFilter !== "ALL" ? `status=${statusFilter}&` : ""}limit=50`
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

  if (statsLoading || reviewsLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading reviews..." />
      </div>
    );
  }

  if (reviewsError) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader
          title="Reviews Management"
          description="Moderate and manage platform reviews"
        />
        <ErrorState
          title="Failed to load reviews"
          message={
            reviewsError instanceof Error
              ? reviewsError.message
              : "Unknown error occurred"
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Reviews Management"
        description="Moderate and manage platform reviews"
      />

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Reviews"
            value={stats.totalReviews.toLocaleString()}
            icon={MessageSquare}
          />
          <StatCard
            label="Average Rating"
            value={stats.averageRating.toFixed(1)}
            icon={Star}
          />
          <StatCard
            label="Pending Reports"
            value={stats.pendingReports.toLocaleString()}
            icon={AlertTriangle}
          />
        </div>
      )}

      <Card>
        <CardContent>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="HIDDEN">Hidden</SelectItem>
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
                  <th className="px-6 py-4">Expert</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={MessageSquare}
                        title="No reviews found"
                        description="There are no reviews matching your current filter."
                      />
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                            {(review.expertName ?? "E").charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-foreground">{review.expertName ?? "Expert"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                            {(review.clientName ?? "C").charAt(0).toUpperCase()}
                          </div>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {review.status !== "APPROVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moderateMutation.mutate({ id: review.id, action: "APPROVE" })}
                              disabled={moderateMutation.isPending}
                            >
                              <Eye size={14} />
                              Approve
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
                              Hide
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
      </Card>
    </div>
  );
}
