"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsEducation, postExpertsEducation, patchExpertsEducationId, deleteExpertsEducationId } from "@/api/generated";

export interface ExpertEducation {
  id: string;
  expertId: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  yearCompleted: number;
  createdAt: string;
}

export interface CreateEducationDto {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  yearCompleted: number;
}

export function useEducation() {
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ["experts", "education"],
    queryFn: async () => {
      const response = await getExpertsEducation();
      return response.status === 200 ? response.data.data : null;
    },
    enabled: !!accessToken,
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async (dto: CreateEducationDto) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await postExpertsEducation(dto);
      return response.status === 201 ? response.data.data : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "education"] });
    },
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateEducationDto>;
    }) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await patchExpertsEducationId(id, dto);
      return response.status === 200 ? response.data.data : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "education"] });
    },
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      await deleteExpertsEducationId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "education"] });
    },
  });
}
