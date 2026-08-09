"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookings } from "@/api/generated";
import type { GetBookingsParams, BookingListResponse, ErrorResponse } from "@/api/generated";
import type { Booking } from "@/api/generated";

type UseBookingsResult = {
  bookings: Booking[];
  pagination: { page: number; limit: number; total: number; totalPages: number } | undefined;
  isLoading: boolean;
  error: Error | null;
};

// getBookings already routes through the Orval customFetch mutator
// (src/lib/api/client.ts), which attaches the Supabase bearer token automatically.
export function useBookings(params?: GetBookingsParams): UseBookingsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", params],
    queryFn: async () => {
      const response = await getBookings(params);
      if (response.status >= 400) {
        const errData = response.data as ErrorResponse;
        throw new Error(errData.message ?? "Failed to fetch bookings");
      }
      const body = response.data as BookingListResponse;
      return body;
    },
  });

  return {
    bookings: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error: error as Error | null,
  };
}
