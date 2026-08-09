import { useMutation } from "@tanstack/react-query";
import { analyzeCase } from "@/lib/api/ai";
import type { CaseAnalysisResponse } from "../types";

export function useCaseAnalysis() {
  return useMutation<CaseAnalysisResponse, Error, { text: string; language?: string }>({
    mutationFn: ({ text, language }) => analyzeCase(text, language),
  });
}
