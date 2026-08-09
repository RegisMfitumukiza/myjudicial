import { useQuery } from "@tanstack/react-query";
import { getExpertsIdProfile, getExpertsExpertIdReviewsSummary } from "@/api/generated";
import type { ExpertProfile } from "@/api/generated";

export type ExpertEducation = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  yearCompleted: number;
};

export type ExpertCertification = {
  id: string;
  certificateName: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
};

export type ExpertProfileData = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  location: string;
  price: number;
  startingRateRwf: number;
  yearsExperience: number;
  languages: string[];
  bio: string;
  verified: boolean;
  avatarUrl: string;
  barNumber: string | null;
  phone: string | null;
  firmName: string | null;
  officeAddress: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  education: ExpertEducation[];
  certifications: ExpertCertification[];
};

function humanizeSpecialty(specialty: string): string {
  return specialty
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toExpertProfileData(raw: ExpertProfile, rating: number, reviewCount: number): ExpertProfileData {
  const fee = raw.baseConsultationFee !== null ? Number(raw.baseConsultationFee) : 0;
  const user = (raw as any).user;
  return {
    id: raw.id,
    name: raw.displayName,
    specialty: humanizeSpecialty(raw.primarySpecialty),
    rating,
    reviewCount,
    location: [raw.city, raw.country].filter(Boolean).join(", ") || raw.officeAddress || "",
    price: fee,
    startingRateRwf: fee,
    yearsExperience: raw.yearsExperience ?? 0,
    languages: raw.languages ?? [],
    bio: raw.bio ?? "",
    verified: raw.status === "VERIFIED",
    avatarUrl: (raw as any).profileImageUrl ?? "",
    barNumber: (raw as any).barNumber ?? null,
    phone: user?.phone ?? null,
    firmName: (raw as any).firmName ?? null,
    officeAddress: (raw as any).officeAddress ?? null,
    city: (raw as any).city ?? null,
    latitude: (raw as any).latitude != null ? Number((raw as any).latitude) : null,
    longitude: (raw as any).longitude != null ? Number((raw as any).longitude) : null,
    education: ((raw as any).education ?? []).map((e: any) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy ?? null,
      yearCompleted: e.yearCompleted,
    })),
    certifications: ((raw as any).certifications ?? []).map((c: any) => ({
      id: c.id,
      certificateName: c.certificateName,
      issuer: c.issuer,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate ?? null,
    })),
  };
}

export function useExpertProfile(id: string) {
  return useQuery({
    queryKey: ["expert-profile", id],
    queryFn: async () => {
      const [profileResponse, reviewsResponse] = await Promise.all([
        getExpertsIdProfile(id),
        getExpertsExpertIdReviewsSummary(id),
      ]);
      const raw = profileResponse.status === 200 ? profileResponse.data.data : null;
      if (!raw) throw new Error("Failed to fetch expert profile");
      const summary = reviewsResponse.status === 200 ? reviewsResponse.data.data : null;
      return toExpertProfileData(raw, summary?.averageRating ?? 0, summary?.totalReviews ?? 0);
    },
    enabled: !!id,
  });
}
