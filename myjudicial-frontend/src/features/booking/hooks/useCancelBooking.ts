"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postBookingsIdCancel } from "@/api/generated";
import type { CancelBookingDto, Booking } from "@/api/generated";

// postBookingsIdCancel already routes through the Orval customFetch mutator
// (src/lib/api/client.ts), which attaches the Supabase bearer token automatically.
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const dto: CancelBookingDto = { reason };
      const response = await postBookingsIdCancel(bookingId, dto);

      if (response.status >= 400) {
        const errData = response.data as { message?: string };
        throw new Error(errData.message ?? "Failed to cancel booking");
      }

      return (response.data as { data: Booking }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}
