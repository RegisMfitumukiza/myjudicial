"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { patchExpertsAvailabilityPresence } from "@/api/generated";
import type { PresenceStatus } from "./useAvailability";

export function useUpdatePresence() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async (presenceStatus: PresenceStatus) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await patchExpertsAvailabilityPresence({ presenceStatus });
      return response.status === 200 ? response.data.data : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "availability"] });
    },
  });
}
