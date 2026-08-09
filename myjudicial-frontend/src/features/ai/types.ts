export type LegalSpecialty =
  | "FAMILY_LAW"
  | "COMMERCIAL_LAW"
  | "EMPLOYMENT_LAW"
  | "LAND_LAW"
  | "CRIMINAL_LAW"
  | "TAX_LAW"
  | "IMMIGRATION_LAW"
  | "CORPORATE_LAW"
  | "CONTRACT_LAW"
  | "INTELLECTUAL_PROPERTY"
  | "OTHER";

export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SuggestedDocument = {
  document: string;
  reason: string;
};

export type CaseAnalysis = {
  specialty: LegalSpecialty;
  urgency_level: UrgencyLevel;
  jurisdiction: string;
  budget_range: {
    min: number;
    max: number;
    currency: string;
  };
  key_entities: string[];
  suggested_documents: (string | SuggestedDocument)[];
  confidence_score: number;
  reasoning?: string;
  possible_legal_issues?: string[];
};

export type CaseAnalysisResponse = {
  analysis: CaseAnalysis;
  model: string;
  processing_time: number;
};

export type TranscriptionResult = {
  text: string;
  language: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
};

export type TranscriptionResponse = {
  transcription: TranscriptionResult;
  processing_time: number;
};

export type TranslationResponse = {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  model: string;
  processing_time: number;
};

export type ExpertSummary = {
  id: string;
  user_id?: string;
  full_name: string;
  specialties?: string[];
  bio?: string;
  hourly_rate?: number;
  rating?: number;
  review_count: number;
  languages?: string[];
  years_of_experience?: number;
  location?: string;
  profile_image_url?: string | null;
};

export type ExpertRecommendation = {
  expert: ExpertSummary;
  score: number;
  rank: number;
  match_quality: "excellent" | "very_good" | "good" | "fair";
  explanation: {
    summary: string;
    match_quality: string;
    strengths: string[];
    considerations?: string[];
    fit_score: number;
  };
};

export type ExpertRecommendationFlat = {
  expert_id: string;
  full_name: string;
  hourly_rate: number;
  rating: number;
  review_count: number;
  years_of_experience: number;
  specialties: string[];
  city: string;
  similarity_score: number;
  final_score: number;
  match_quality: "excellent" | "very_good" | "good" | "fair";
  explanation: {
    strengths: string[];
    considerations: string[];
  };
  profile_image_url: string | null;
};

export type RecommendationResponse = {
  success: boolean;
  query: string;
  case_analysis: {
    specialty?: string;
    urgency_level?: string;
    budget_range?: Record<string, unknown>;
    key_entities?: string[];
  };
  recommendations: ExpertRecommendation[];
  total: number;
  filters_applied: {
    specialty?: string;
    max_budget?: number;
    min_score: number;
  };
  processing_time: number;
};

export type AiStep = "describe" | "refine" | "match";

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "analysis" | "recommendation";
  analysis?: CaseAnalysis;
  recommendations?: ExpertRecommendation[];
};

export type AiWorkspaceState = {
  step: AiStep;
  messages: AiMessage[];
  isAnalyzing: boolean;
  isTranscribing: boolean;
  isRecommending: boolean;
  error: string | null;
  uploadedFiles: File[];
};
