export type Specialty = string;

export type Lawyer = {
  id: string;
  name: string;
  specialtyLabel: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  online: boolean;
  instantConsult: boolean;
  startingRateRwf: number;
  district: string;
  lat: number;
  lng: number;
  avatarUrl: string | null;
  distanceKm: number;
  yearsExperience?: number | null;
  languages?: string[];
  city?: string | null;
  baseConsultationFee?: number | null;
  presenceStatus?: string;
  officeAddress?: string | null;
};

export type ProximityFilter = "5km" | "10km" | "20km" | "50km" | "anywhere";

export type SortOption = "NEAREST" | "RECOMMENDED" | "HIGHEST_RATED" | "MOST_EXPERIENCED" | "MOST_REVIEWED";

export type SearchFilters = {
  searchQuery: string;
  specialties: string[];
  sort: SortOption;
  proximity: ProximityFilter;
  maxBudgetRwf: number;
  instantConsultOnly: boolean;
  minRating: number;
  minYearsExperience: number;
  availableToday: boolean;
};

export const PROXIMITY_OPTIONS: { value: ProximityFilter; km: number; labelKey: string }[] = [
  { value: "5km", km: 5, labelKey: "within5km" },
  { value: "10km", km: 10, labelKey: "within10km" },
  { value: "20km", km: 20, labelKey: "within20km" },
  { value: "50km", km: 50, labelKey: "within50km" },
  { value: "anywhere", km: 100, labelKey: "allRwanda" },
];

export const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: "RECOMMENDED", labelKey: "sortRecommended" },
  { value: "NEAREST", labelKey: "sortNearest" },
  { value: "HIGHEST_RATED", labelKey: "sortHighestRated" },
  { value: "MOST_EXPERIENCED", labelKey: "sortMostExperienced" },
  { value: "MOST_REVIEWED", labelKey: "sortMostReviewed" },
];

export const DEFAULT_FILTERS: SearchFilters = {
  searchQuery: "",
  specialties: [],
  sort: "NEAREST",
  proximity: "anywhere",
  maxBudgetRwf: 200000,
  instantConsultOnly: false,
  minRating: 0,
  minYearsExperience: 0,
  availableToday: false,
};
