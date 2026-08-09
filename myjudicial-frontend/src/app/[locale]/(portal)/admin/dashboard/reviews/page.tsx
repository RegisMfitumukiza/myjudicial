"use client";

import { useState } from "react";
import {
  Star,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Filter,
  Eye,
  EyeOff,
  MessageSquare,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

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

const getStatusBadge = (status: string) => {
  const configs: Record<string, { color: string; label: string }> = {
    APPROVED: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
    PENDING: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Pending" },
    HIDDEN: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Hidden" },
  };

  const config = configs[status] ?? { color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: status };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
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
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (reviewsError) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load reviews</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {reviewsError instanceof Error ? reviewsError.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reviews Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Moderate and manage platform reviews</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <MessageSquare size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalReviews.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/10 text-amber-600">
              <Star size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.averageRating.toFixed(1)}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
              <AlertTriangle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingReports.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Pending Reports</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-4 shadow-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus)}
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">Expert</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/10">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No reviews found.</p>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/10 text-xs text-green-600">
                          {(review.expertName ?? "E").charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{review.expertName ?? "Expert"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-xs text-brand-blue">
                          {(review.clientName ?? "C").charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{review.clientName ?? "Client"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}
                          />
                        ))}
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">{review.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-gray-100">{formatDate(review.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(review.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {review.status !== "APPROVED" && (
                          <button
                            onClick={() => moderateMutation.mutate({ id: review.id, action: "APPROVE" })}
                            disabled={moderateMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            <Eye size={14} />
                            Approve
                          </button>
                        )}
                        {review.status !== "HIDDEN" && (
                          <button
                            onClick={() => moderateMutation.mutate({ id: review.id, action: "HIDE" })}
                            disabled={moderateMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <EyeOff size={14} />
                            Hide
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
