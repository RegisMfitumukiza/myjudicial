"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { getGetBookingsQueryKey } from "@/api/generated";

interface AcceptBookingResponse {
  success: boolean;
  data: Record<string, unknown>;
  message: string;
}

export function useAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiFetch<AcceptBookingResponse>(
        `/bookings/${bookingId}/accept`,
        { method: "POST" }
      );

      if (!response.success) {
        throw new Error(response.message ?? "Failed to accept booking");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey({ status: "PENDING", limit: 50 }) });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}
