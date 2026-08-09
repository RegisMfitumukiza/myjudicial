"use client";

import { useMutation } from "@tanstack/react-query";
import { postBookingsIdJoin } from "@/api/generated";

// postBookingsIdJoin already routes through the Orval customFetch mutator
// (src/lib/api/client.ts), which attaches the Supabase bearer token automatically.
export function useJoinConsultation() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await postBookingsIdJoin(bookingId);

      if (response.status >= 400) {
        const errData = response.data as { message?: string };
        throw new Error(errData.message ?? "Failed to join consultation");
      }

      return (response.data as { data: { token: string } }).data;
    },
  });
}
