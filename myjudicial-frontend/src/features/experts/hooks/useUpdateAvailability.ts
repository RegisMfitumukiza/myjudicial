"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { patchExpertsAvailability } from "@/api/generated";
import type { ExpertAvailability, DayOfWeek, PresenceStatus } from "./useAvailability";

interface ScheduleSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface UpsertAvailabilityDto {
  presenceStatus?: PresenceStatus;
  schedule?: ScheduleSlot[];
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async (dto: UpsertAvailabilityDto) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await patchExpertsAvailability(dto);
      return response.status === 200 ? response.data.data : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "availability"] });
    },
  });
}
