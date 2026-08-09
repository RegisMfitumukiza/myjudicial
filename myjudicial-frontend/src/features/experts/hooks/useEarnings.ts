"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsEarnings } from "@/api/generated";

interface Transaction {
  bookingId: string;
  serviceName: string;
  amount: number;
  currency: string;
  completedAt: string | null;
}

export interface ExpertEarnings {
  currency: string;
  grossRevenue: number;
  platformFees: number;
  netRevenue: number;
  pendingEscrowBalance: number;
  completedPayouts: number;
  recentTransactions: Transaction[];
}

export function useEarnings() {
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as
    | string
    | undefined;

  return useQuery({
    queryKey: ["experts", "earnings"],
    queryFn: async () => {
      const response = await getExpertsEarnings();
      return response.status === 200 ? response.data.data : null;
    },
    enabled: !!accessToken,
  });
}
