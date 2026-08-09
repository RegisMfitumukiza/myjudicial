"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

interface RescheduleResponse {
  success: boolean;
  data: { booking: { id: string; scheduledStart: string; scheduledEnd: string } };
  message: string;
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      scheduledStart,
      scheduledEnd,
      reason,
    }: {
      bookingId: string;
      scheduledStart: string;
      scheduledEnd: string;
      reason?: string;
    }) => {
      const response = await apiFetch<RescheduleResponse>(
        `/bookings/${bookingId}/reschedule`,
        {
          method: "POST",
          body: { scheduledStart, scheduledEnd, reason },
        }
      );

      if (!response.success) {
        throw new Error(response.message ?? "Failed to reschedule booking");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      toast.success("Booking rescheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(`Reschedule failed: ${error.message}`);
    },
  });
}
