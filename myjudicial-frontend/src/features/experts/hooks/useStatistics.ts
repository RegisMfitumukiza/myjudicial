"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsStatistics } from "@/api/generated";

export interface ExpertStatistics {
  completedConsultations: number;
  activeConsultations?: number;
  pendingBookings?: number;
  averageRating: number | null;
  reviewCount: number;
}

export function useStatistics() {
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as
    | string
    | undefined;

  return useQuery({
    queryKey: ["experts", "statistics"],
    queryFn: async () => {
      const response = await getExpertsStatistics();
      return response.status === 200 ? response.data.data : null;
    },
    enabled: !!accessToken,
  });
}
