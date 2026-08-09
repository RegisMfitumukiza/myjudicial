"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { deleteExpertsServicesId } from "@/api/generated";

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      await deleteExpertsServicesId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "services"] });
    },
  });
}
