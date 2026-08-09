"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type PaymentMode = "BOOKING_FIRST" | "PAYMENT_REQUIRED";

interface PublicSettingsResponse {
  success: boolean;
  data: {
    paymentMode: PaymentMode;
  };
}

interface UsePaymentModeResult {
  paymentMode: PaymentMode;
  isBookingFirst: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Booking-first is the platform default; falling back to it keeps the payment
// collection UI hidden if the public settings call fails.
const DEFAULT_PAYMENT_MODE: PaymentMode = "BOOKING_FIRST";

export function usePaymentMode(): UsePaymentModeResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", "paymentMode"],
    queryFn: async () => {
      const response = await apiFetch<PublicSettingsResponse>("/settings");
      if (!response.success) throw new Error("Failed to load platform settings");
      return response.data;
    },
    staleTime: 60_000,
    retry: 1,
  });

  const paymentMode = data?.paymentMode ?? DEFAULT_PAYMENT_MODE;

  return {
    paymentMode,
    isBookingFirst: paymentMode === "BOOKING_FIRST",
    isLoading,
    error: error as Error | null,
  };
}
