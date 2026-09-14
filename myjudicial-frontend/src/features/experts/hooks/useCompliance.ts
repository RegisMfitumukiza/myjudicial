"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsCompliance, type ComplianceStatus } from "@/api/generated";

export type { ComplianceStatus };

export function useCompliance() {
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as
    | string
    | undefined;

  return useQuery({
    queryKey: ["experts", "compliance"],
    queryFn: async () => {
      const response = await getExpertsCompliance();
      return response.status === 200 ? response.data.data : null;
    },
    enabled: !!accessToken,
  });
}
