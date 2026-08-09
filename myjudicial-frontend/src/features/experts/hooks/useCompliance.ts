"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsCompliance } from "@/api/generated";
import type { ExpertStatus } from "../types";

interface LastVerification {
  id: string;
  status: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ComplianceStatus {
  status: ExpertStatus;
  credentialsExpiry: string | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
  statusMessage: string;
  lastVerification: LastVerification | null;
}

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
