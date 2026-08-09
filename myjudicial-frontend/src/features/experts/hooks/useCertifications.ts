"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsCertifications, postExpertsCertifications, patchExpertsCertificationsId, deleteExpertsCertificationsId } from "@/api/generated";

export interface ExpertCertification {
  id: string;
  expertId: string;
  certificateName: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  createdAt: string;
}

export interface CreateCertificationDto {
  certificateName: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
}

export function useCertifications() {
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ["experts", "certifications"],
    queryFn: async () => {
      const response = await getExpertsCertifications();
      return response.status === 200 ? response.data.data : null;
    },
    enabled: !!accessToken,
  });
}

export function useCreateCertification() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async (dto: CreateCertificationDto) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await postExpertsCertifications(dto);
      return response.status === 201 ? response.data.data : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "certifications"] });
    },
  });
}

export function useUpdateCertification() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateCertificationDto>;
    }) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await patchExpertsCertificationsId(id, dto);
      return response.status === 200 ? response.data.data : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "certifications"] });
    },
  });
}

export function useDeleteCertification() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      await deleteExpertsCertificationsId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts", "certifications"] });
    },
  });
}
