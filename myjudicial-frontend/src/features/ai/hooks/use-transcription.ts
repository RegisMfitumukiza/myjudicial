import { useMutation } from "@tanstack/react-query";
import { transcribeAudio } from "@/lib/api/ai";
import type { TranslationResponse } from "../types";

export function useTranscription() {
  return useMutation<TranslationResponse, Error, { audioBlob: Blob; language?: string }>({
    mutationFn: ({ audioBlob, language }) => transcribeAudio(audioBlob, language),
  });
}
