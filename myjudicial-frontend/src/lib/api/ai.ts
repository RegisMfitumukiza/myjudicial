import { apiFetch } from "./client";
import type {
  CaseAnalysisResponse,
  TranscriptionResponse,
  TranslationResponse,
  RecommendationResponse,
} from "@/features/ai/types";

const AI_PREFIX = "/ai";

function detectLanguage(): string {
  try {
    const stored = localStorage.getItem("mj_lang");
    if (stored && ["en", "fr", "rw"].includes(stored)) return stored;
  } catch {}
  try {
    const browserLang = navigator.language.slice(0, 2);
    if (["en", "fr"].includes(browserLang)) return browserLang;
  } catch {}
  return "en";
}

export async function analyzeCase(text: string, language?: string): Promise<CaseAnalysisResponse> {
  const response = await apiFetch<{ data: CaseAnalysisResponse }>(`${AI_PREFIX}/analyze`, {
    method: "POST",
    body: { text, language: language ?? detectLanguage() },
  });
  return response.data as CaseAnalysisResponse;
}

export async function transcribeAudio(
  audioBlob: Blob,
  language = "auto"
): Promise<TranslationResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("language", language);

  const response = await apiFetch<{ data: TranscriptionResponse }>(
    `${AI_PREFIX}/transcribe`,
    {
      method: "POST",
      body: formData as unknown as BodyInit,
    }
  );
  return response.data as unknown as TranslationResponse;
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResponse> {
  const response = await apiFetch<{ data: TranslationResponse }>(`${AI_PREFIX}/translate`, {
    method: "POST",
    body: { text, source_language: sourceLanguage, target_language: targetLanguage },
  });
  return response.data as TranslationResponse;
}

export async function getRecommendations(
  text: string,
  options?: {
    language?: string;
    budget_max?: number;
    specialty?: string;
    limit?: number;
  }
): Promise<RecommendationResponse> {
  const response = await apiFetch<{ data: RecommendationResponse }>(`${AI_PREFIX}/recommend`, {
    method: "POST",
    body: {
      text,
      language: options?.language ?? detectLanguage(),
      budget_max: options?.budget_max,
      specialty: options?.specialty,
      limit: options?.limit ?? 5,
    },
  });
  return response.data as RecommendationResponse;
}
