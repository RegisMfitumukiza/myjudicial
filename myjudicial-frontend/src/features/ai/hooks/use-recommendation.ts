import { useMutation } from "@tanstack/react-query";
import { getRecommendations } from "@/lib/api/ai";
import type { RecommendationResponse } from "../types";

type RecommendInput = {
  text: string;
  language?: string;
  budget_max?: number;
  specialty?: string;
  limit?: number;
};

export function useRecommendation() {
  return useMutation<RecommendationResponse, Error, RecommendInput>({
    mutationFn: (input) => getRecommendations(input.text, input),
  });
}
