"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

interface RetryPaymentResponse {
  success: boolean;
  data: {
    booking: { id: string; status: string; paymentStatus: string };
    payment: { paymentLink: string | null; txRef: string; amount: number; currency: string };
  };
  message: string;
}

export function useRetryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      paymentMNO,
      paymentPhoneNumber,
    }: {
      bookingId: string;
      paymentMNO?: string;
      paymentPhoneNumber?: string;
    }) => {
      const response = await apiFetch<RetryPaymentResponse>(
        `/bookings/${bookingId}/retry-payment`,
        {
          method: "POST",
          body: { paymentMNO, paymentPhoneNumber },
        }
      );

      if (!response.success) {
        throw new Error(response.message ?? "Failed to retry payment");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      toast.success("Payment retry initiated. Check your phone for the payment prompt.");
    },
    onError: (error: Error) => {
      toast.error(`Payment retry failed: ${error.message}`);
    },
  });
}
