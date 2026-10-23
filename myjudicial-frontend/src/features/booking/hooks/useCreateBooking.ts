"use client";

import { useMutation } from "@tanstack/react-query";
import { postBookings } from "@/api/generated";
import type { CreateBookingDto, CreateBookingResponseData } from "@/api/generated";

// postBookings already routes through the Orval customFetch mutator (src/api/mutator.ts),
// which delegates to apiFetch and attaches the Supabase bearer token automatically.
export function useCreateBooking() {
  return useMutation({
    mutationFn: async (dto: CreateBookingDto) => {
      const response = await postBookings(dto);

      if (response.status >= 400) {
        const errData = response.data as {
          message?: string;
          errors?: string[];
          error?: string;
        };
        const errorDetail =
          errData.errors && errData.errors.length > 0
            ? errData.errors.join(". ")
            : errData.message || errData.error || "Failed to create booking";
        throw new Error(errorDetail);
      }

      return (response.data as { data: CreateBookingResponseData }).data;
    },
  });
}
