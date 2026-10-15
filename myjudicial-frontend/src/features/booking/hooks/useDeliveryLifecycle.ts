"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Hook for an Expert to mark a consultation as delivered (phone call, in-person, chat, or video).
 */
export function useMarkConsultationDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, deliverySummary }: { bookingId: string; deliverySummary?: string }) => {
      const response = await apiFetch<ApiResponse>(`/bookings/${bookingId}/mark-delivered`, {
        method: "POST",
        body: JSON.stringify({ deliverySummary }),
      });

      if (!response.success) {
        throw new Error(response.message ?? "Failed to mark consultation delivered");
      }

      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

/**
 * Hook for a Citizen to confirm that a consultation was completed (triggers escrow release).
 */
export function useConfirmConsultationCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiFetch<ApiResponse>(`/bookings/${bookingId}/confirm-completion`, {
        method: "POST",
      });

      if (!response.success) {
        throw new Error(response.message ?? "Failed to confirm consultation completion");
      }

      return response.data;
    },
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

/**
 * Hook for a Citizen to report an issue with the consultation (pauses auto-release timer).
 */
export function useReportConsultationIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const response = await apiFetch<ApiResponse>(`/bookings/${bookingId}/report-issue`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.success) {
        throw new Error(response.message ?? "Failed to report issue");
      }

      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
