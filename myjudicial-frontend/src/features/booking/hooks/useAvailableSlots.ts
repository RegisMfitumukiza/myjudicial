"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingsExpertIdSlots } from "@/api/generated";
import type { AvailableSlotsResponse, AvailableSlot, GetBookingsExpertIdSlotsParams } from "@/api/generated";

type UseAvailableSlotsResult = {
  slots: AvailableSlot[];
  totalSlots: number;
  isLoading: boolean;
  error: Error | null;
};

export function useAvailableSlots(
  expertId: string | undefined,
  date: string | undefined,
  serviceId?: string | undefined
): UseAvailableSlotsResult {
  type SlotResult = AvailableSlotsResponse["data"];
  const { data, isLoading, error } = useQuery({
    queryKey: ["available-slots", expertId, date, serviceId],
    queryFn: async () => {
      if (!expertId || !date) throw new Error("Expert ID and date are required");
      const params: GetBookingsExpertIdSlotsParams = { date };
      if (serviceId) params.serviceId = serviceId;
      const response = await getBookingsExpertIdSlots(expertId, params);
      if (response.status >= 400) {
        const errData = response.data as { message?: string };
        throw new Error(errData.message ?? "Failed to fetch available slots");
      }
      return response.data as AvailableSlotsResponse;
    },
    enabled: !!expertId && !!date,
  });

  return {
    slots: data?.data?.slots ?? [],
    totalSlots: data?.data?.totalSlots ?? 0,
    isLoading,
    error: error as Error | null,
  };
}
