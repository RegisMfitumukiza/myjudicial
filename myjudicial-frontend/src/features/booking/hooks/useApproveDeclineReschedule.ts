"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

interface ApproveDeclineResponse {
  success: boolean;
  data: { booking: { id: string; status: string } };
  message: string;
}

export function useApproveReschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await apiFetch<ApproveDeclineResponse>(
        `/bookings/${bookingId}/approve-reschedule`,
        { method: "POST" }
      );
      if (!response.success) throw new Error(response.message ?? "Failed to approve reschedule");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      toast.success("Reschedule approved");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

export function useDeclineReschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const response = await apiFetch<ApproveDeclineResponse>(
        `/bookings/${bookingId}/decline-reschedule`,
        { method: "POST", body: { reason } }
      );
      if (!response.success) throw new Error(response.message ?? "Failed to decline reschedule");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      toast.success("Reschedule declined");
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline: ${error.message}`);
    },
  });
}
