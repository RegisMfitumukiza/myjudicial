import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type PublicStats = {
  verifiedExperts: number;
  completedConsultations: number;
  totalClients: number;
  totalPracticeAreas: number;
  totalLawyers: number;
};

export type PracticeArea = {
  specialty: string;
  label: string;
  expertCount: number;
};

export type ExpertSummary = {
  id: string;
  name: string;
  specialty: string | null;
  specialties: string[];
  rating: number | null;
  reviewCount: number;
  city: string | null;
  flatFee: number | null;
  currency: string;
  avatarUrl: string | null;
  yearsExperience?: number | null;
  languages?: string[];
  verified?: boolean;
  presenceStatus?: string;
};

export type MostBookedExpert = ExpertSummary & {
  completedBookings: number;
};

export type LegalServiceSummary = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  deliveryMode: string;
  durationMin: number;
  flatFee: number | null;
  currency: string;
  expertId: string;
  expertName: string;
  expertSpecialty: string | null;
  expertRating: number | null;
  expertCity: string | null;
};

export type FeaturedReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  clientName: string;
  expertId: string;
  expertName: string;
  expertSpecialty: string | null;
  serviceName: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export function usePublicStats() {
  return useQuery({
    queryKey: ["landing", "stats"],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<PublicStats>>("/experts/stats/public", { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePracticeAreas() {
  return useQuery({
    queryKey: ["landing", "practice-areas"],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<PracticeArea[]>>("/experts/practice-areas", { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendedExperts(limit = 8) {
  return useQuery({
    queryKey: ["landing", "recommended", limit],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<ExpertSummary[]>>(`/experts/recommended?limit=${limit}`, { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewestExperts(limit = 6) {
  return useQuery({
    queryKey: ["landing", "newest", limit],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<ExpertSummary[]>>(`/experts/newest?limit=${limit}`, { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMostBookedExperts(limit = 6) {
  return useQuery({
    queryKey: ["landing", "most-booked", limit],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<MostBookedExpert[]>>(`/experts/most-booked?limit=${limit}`, { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHighestRatedExperts(limit = 6) {
  return useQuery({
    queryKey: ["landing", "highest-rated", limit],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<ExpertSummary[]>>(`/experts/highest-rated?limit=${limit}`, { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAvailableTodayExperts(limit = 6) {
  return useQuery({
    queryKey: ["landing", "available-today", limit],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<ExpertSummary[]>>(`/experts/available-today?limit=${limit}`, { method: "GET" });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useLegalServices(limit = 8) {
  return useQuery({
    queryKey: ["landing", "legal-services", limit],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<LegalServiceSummary[]>>(`/experts/legal-services?limit=${limit}`, { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedReviews(limit = 6) {
  return useQuery({
    queryKey: ["landing", "featured-reviews", limit],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<FeaturedReview[]>>(`/experts/reviews/featured?limit=${limit}`, { method: "GET" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
