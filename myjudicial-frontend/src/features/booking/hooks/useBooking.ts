"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingsId } from "@/api/generated";
import type { GetBookingsId200, ErrorResponse } from "@/api/generated";
import type { Booking } from "@/api/generated";

type UseBookingResult = {
  booking: Booking | null;
  isLoading: boolean;
  error: Error | null;
};

export type UseBookingOptions = {
  refetchInterval?: number | false;
  enabled?: boolean;
};

// getBookingsId already routes through the Orval customFetch mutator
// (src/lib/api/client.ts), which attaches the Supabase bearer token automatically.
export function useBooking(id: string | undefined, options?: UseBookingOptions): UseBookingResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      if (!id) throw new Error("Booking ID is required");
      const response = await getBookingsId(id);
      if (response.status >= 400) {
        const errData = response.data as ErrorResponse;
        throw new Error(errData.message ?? "Failed to fetch booking");
      }
      const body = response.data as GetBookingsId200;
      return body.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
    refetchInterval: options?.refetchInterval,
  });

  return {
    booking: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
