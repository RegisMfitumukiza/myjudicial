import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { Lawyer } from "../types";

export type ExpertSearchParams = {
  lat?: number;
  lng?: number;
  radius?: number;
  specialty?: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  minRating?: number;
  minYearsExperience?: number;
  availability?: string;
  availableToday?: boolean;
  instantConsult?: boolean;
};

type ApiExpert = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio: string;
  hourlyRate: number | null;
  currency?: string;
  yearsExperience: number;
  languages: string[];
  specialties: string[];
  rating: number | null;
  reviewCount: number;
  avatarObjectKey?: string | null;
  avatarUrl?: string | null;
  status: string;
  city?: string | null;
  latitude: number | null;
  longitude: number | null;
  distance?: number;
  verified: boolean;
  services?: Array<{ id: string; name: string; price: number }>;
  fullName?: string;
  yearsOfExperience?: number | null;
  baseConsultationFee?: number | null;
  availability?: string | null;
  distanceKm?: number;
  officeAddress?: string | null;
};

type ApiResponse = {
  data: ApiExpert[];
  pagination?: { page: number; limit: number; total: number; pages: number };
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

function humanizeSpecialty(specialty: string): string {
  return specialty
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapApiExpertToLawyer(expert: ApiExpert): Lawyer {
  const [firstSpecialty] = expert.specialties || ["Other"];
  const name = expert.fullName || [expert.firstName, expert.lastName].filter(Boolean).join(" ") || "Legal Expert";
  const rate = expert.baseConsultationFee ?? expert.hourlyRate ?? null;

  return {
    id: expert.id,
    name,
    specialtyLabel: firstSpecialty ? humanizeSpecialty(firstSpecialty) : "Legal Services",
    specialties: expert.specialties || [],
    rating: expert.rating ?? 0,
    reviewCount: expert.reviewCount || 0,
    verified: expert.verified === true,
    online: expert.availability === "ONLINE",
    instantConsult: expert.services?.some((s) => s.name?.toLowerCase().includes("instant")) ?? false,
    startingRateRwf: rate ?? 0,
    district: expert.city || "Rwanda",
    lat: expert.latitude ?? 0,
    lng: expert.longitude ?? 0,
    avatarUrl: expert.avatarUrl || expert.avatarObjectKey || null,
    distanceKm: expert.distanceKm ?? expert.distance ?? 0,
    yearsExperience: expert.yearsOfExperience ?? expert.yearsExperience ?? null,
    languages: expert.languages ?? [],
    city: expert.city ?? null,
    baseConsultationFee: rate,
    presenceStatus: expert.availability ?? "OFFLINE",
    officeAddress: expert.officeAddress ?? null,
  };
}

export function useExpertSearch(
  params: ExpertSearchParams = {},
  options: { enabled?: boolean } = {}
) {
  const queryString = new URLSearchParams();

  if (params.lat !== undefined) queryString.append("lat", params.lat.toString());
  if (params.lng !== undefined) queryString.append("lng", params.lng.toString());
  if (params.radius !== undefined) queryString.append("radius", params.radius.toString());
  if (params.specialty) queryString.append("specialty", params.specialty);
  if (params.page !== undefined) queryString.append("page", params.page.toString());
  if (params.limit !== undefined) queryString.append("limit", params.limit.toString());
  if (params.search) queryString.append("search", params.search);
  if (params.sort) queryString.append("sort", params.sort);
  if (params.minRating !== undefined) queryString.append("minRating", params.minRating.toString());
  if (params.minYearsExperience !== undefined) queryString.append("minYearsExperience", params.minYearsExperience.toString());
  if (params.availability) queryString.append("availability", params.availability);
  if (params.availableToday) queryString.append("availableToday", "true");
  if (params.instantConsult) queryString.append("instantConsult", "true");

  return useQuery({
    queryKey: ["experts", params],
    enabled: options.enabled !== false,
    queryFn: async () => {
      const response = await apiFetch<ApiResponse>(
        `/experts?${queryString.toString()}`,
        { method: "GET" }
      );

      const meta = response.meta
        ? { page: response.meta.page, limit: response.meta.limit, total: response.meta.total, totalPages: response.meta.totalPages }
        : response.pagination
          ? { page: response.pagination.page, limit: response.pagination.limit, total: response.pagination.total, totalPages: response.pagination.pages }
          : undefined;

      return {
        lawyers: response.data.map(mapApiExpertToLawyer),
        pagination: meta,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 2,
  });
}
