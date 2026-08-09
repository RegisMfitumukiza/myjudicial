import { apiFetchEnvelope } from "@/lib/api/client";

export interface SavedExpert {
  id: string;
  expertId: string;
  savedAt: string;
  expert: {
    id: string;
    displayName: string;
    bio: string | null;
    primarySpecialty: string;
    specialties: string[];
    baseConsultationFee: number | null;
    currency: string;
    averageRating: number | null;
    reviewCount: number;
    city: string | null;
    country: string;
    profileImageObjectKey: string | null;
    yearsExperience: number | null;
  };
}

export async function getSavedExperts(): Promise<SavedExpert[]> {
  const res: any = await apiFetchEnvelope("/saved-experts");
  return res.data?.data ?? [];
}

export async function saveExpert(expertId: string): Promise<{ id: string; expertId: string }> {
  const res: any = await apiFetchEnvelope("/saved-experts", {
    method: "POST",
    body: JSON.stringify({ expertId }),
    headers: { "Content-Type": "application/json" },
  });
  return res.data?.data ?? { id: "", expertId };
}

export async function removeSavedExpert(expertId: string): Promise<void> {
  await apiFetchEnvelope(`/saved-experts/${expertId}`, { method: "DELETE" });
}

export async function checkSavedExpert(expertId: string): Promise<boolean> {
  const res: any = await apiFetchEnvelope(`/saved-experts/check/${expertId}`);
  return res.data?.data?.saved ?? false;
}
