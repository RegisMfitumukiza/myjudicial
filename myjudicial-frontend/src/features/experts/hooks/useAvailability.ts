"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsAvailability } from "@/api/generated";

export type PresenceStatus = "ONLINE" | "OFFLINE" | "BUSY" | "ON_LEAVE";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface ExpertAvailability {
  id: string;
  expertId: string;
  presenceStatus: PresenceStatus;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export function useAvailability() {
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ["experts", "availability"],
    queryFn: async () => {
      const response = await getExpertsAvailability();
      return response.status === 200 ? response.data.data : null;
    },
    enabled: !!accessToken,
  });
}
