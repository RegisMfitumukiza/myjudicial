import { useMutation } from "@tanstack/react-query";
import { translateText } from "@/lib/api/ai";
import type { TranslationResponse } from "../types";

export function useTranslation() {
  return useMutation<
    TranslationResponse,
    Error,
    { text: string; sourceLanguage: string; targetLanguage: string }
  >({
    mutationFn: ({ text, sourceLanguage, targetLanguage }) =>
      translateText(text, sourceLanguage, targetLanguage),
  });
}
