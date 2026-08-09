import { useQuery } from "@tanstack/react-query";
import { getExpertsExpertIdServices } from "@/api/generated";
import type { LegalService } from "@/api/generated";

export type ExpertService = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  deliveryMode: string;
  durationMin: number;
  flatFee: number;
  currency: string;
};

export function useExpertServices(expertId: string) {
  return useQuery({
    queryKey: ["expert-services", expertId],
    queryFn: async () => {
      const response = await getExpertsExpertIdServices(expertId);
      const raw: LegalService[] | undefined = response.status === 200 ? response.data.data : undefined;
      if (!raw) throw new Error("Failed to fetch expert services");
      return raw.map((s): ExpertService => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        deliveryMode: s.deliveryMode,
        durationMin: s.durationMin,
        flatFee: s.flatFee,
        currency: s.currency,
      }));
    },
    enabled: !!expertId,
  });
}
