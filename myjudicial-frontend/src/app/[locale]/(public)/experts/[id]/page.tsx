"use client";

import { use, Suspense } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  ArrowLeft, Star, MapPin, Shield, Clock, Video, CheckCircle,
  Award, Calendar, Loader2, AlertCircle, ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getExpertsIdProfile, getExpertsExpertIdServices } from "@/api/generated";
import { useRequireBookingAuth } from "@/features/booking/hooks/useRequireBookingAuth";

interface ProfileService {
  id: string;
  name: string;
  description?: string;
  category?: string;
  durationMin: number;
  flatFee: number;
  currency?: string;
  deliveryMode?: string;
}

const CATEGORY_ORDER = ["consultation", "document_review", "contract_drafting", "court_representation", "legal_advice", "mediation", "other"];

interface ProfileViewExpert {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  barNumber?: string;
  verified: boolean;
  verifiedAt?: string;
  status?: string;
  headshot: string | null;
  specialties: string[];
  languages: string[];
  bio: string | null;
  officeAddress?: string;
  credentialsExpiry?: string;
  hourlyRate?: number;
  currency?: string;
  rating?: number;
  avgRating?: number;
  reviewCount?: number;
  totalBookings?: number;
  yearsOfExperience?: number;
  services: ProfileService[];
}

function ExpertProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const tBooking = useTranslations("booking");
  const t = useTranslations("public.expertProfile");
  const { requireAuth } = useRequireBookingAuth();

  function handleBookClick() {
    if (requireAuth(`/lawyers/${id}/book`)) {
      router.push(`/lawyers/${id}/book`);
    }
  }

  // Fetch expert profile
  const { data, isLoading, error } = useQuery({
    queryKey: ["expert", id],
    queryFn: async () => {
      const response = await getExpertsIdProfile(id);
      if (response.status === 200) return response.data.data;
      throw new Error("Failed to load expert profile");
    },
  });

  // Fetch expert services separately
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["expert-services", id],
    queryFn: async () => {
      const response = await getExpertsExpertIdServices(id);
      if (response.status === 200) return response.data.data;
      throw new Error("Failed to load services");
    },
    enabled: !!id,
  });

  const expertRaw = data;
  const services = servicesData ?? [];
  const raw = expertRaw as Record<string, unknown> | undefined;
  const expert: ProfileViewExpert | undefined = raw
    ? ({
        ...raw,
        services,
        verified: raw.verified ?? raw.status === "VERIFIED",
        headshot: raw.headshot ?? raw.profileImageObjectKey ?? null,
      } as unknown as ProfileViewExpert)
    : undefined;

  if (isLoading || servicesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-black px-6">
        <AlertCircle className="h-10 w-10 text-brand-alert mb-4" />
        <p className="text-brand-alert font-medium">{t("failedToLoad")}</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6">
          {error instanceof Error ? error.message : t("expertNotFound")}
        </p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href="/experts">{t("backToExperts")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-brand-canvas dark:bg-gray-900">
        {/* Profile Section */}
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link
            href="/experts"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
          >
            <ArrowLeft size={14} />
            {t("backToExperts")}
          </Link>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column - Expert Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Expert Card */}
              <div className="rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
                <div className="flex flex-col gap-6 sm:flex-row">
                  {/* Avatar */}
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-brand-dark/5">
                    {expert.headshot ? (
                      <img
                        src={expert.headshot}
                        alt={expert.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-dark text-white text-3xl font-bold">
                        {(expert.displayName ?? expert.firstName ?? "?").charAt(0)}
                      </div>
                    )}
                    {expert.verified && (
                      <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md dark:bg-black">
                        <Shield size={14} className="text-brand-dark dark:text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h1 className="text-[24px] font-bold text-brand-dark dark:text-white">
                          {expert.displayName ?? `${expert.firstName ?? ""} ${expert.lastName ?? ""}`.trim()}
                        </h1>
                        {expert.barNumber && (
                          <p className="text-[13px] text-brand-dark/50 dark:text-white/50">
                            {t("barNo", { number: expert.barNumber })}
                          </p>
                        )}
                      </div>
                      {expert.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle size={11} />
                          {t("verified")}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px] text-brand-dark/60 dark:text-white/60">
                      {expert.avgRating && (
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-brand-dark dark:text-white">
                            {Number(expert.avgRating).toFixed(1)}
                          </span>
                          <span>({t("consultations", { count: expert.totalBookings ?? 0 })})</span>
                        </div>
                      )}
                      {expert.officeAddress && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {expert.officeAddress}
                        </div>
                      )}
                    </div>

                    {expert.specialties && expert.specialties.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {expert.specialties.map((specialty: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-full bg-brand-dark/10 px-3 py-1 text-[11px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {expert.bio && (
                  <div className="mt-6 border-t border-brand-border/20 pt-6 dark:border-white/20">
                    <h3 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-2">
                      {t("about")}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-brand-dark/70 dark:text-white/70">
                      {expert.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Services */}
              <div className="rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-brand-dark dark:text-white">
                    {t("servicesAndPricing")}
                  </h2>
                  {expert.services && expert.services.length > 0 && (
                    <span className="text-[11px] text-brand-dark/50 dark:text-white/50">
                      {t("servicesCount", { count: expert.services.length })}
                    </span>
                  )}
                </div>

                {expert.services && expert.services.length > 0 ? (
                  <div className="space-y-6">
                    {(() => {
                      const grouped = new Map<string, ProfileService[]>();
                      for (const s of expert.services) {
                        const cat = s.category ?? "other";
                        if (!grouped.has(cat)) grouped.set(cat, []);
                        grouped.get(cat)!.push(s);
                      }
                      return Array.from(grouped.entries())
                        .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
                        .map(([category, catServices]) => (
                        <div key={category}>
                          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">
                            {tBooking(`category.${category}` as any) || "Other"}
                          </h3>
                          <div className="space-y-2">
                            {catServices.map((service: ProfileService) => (
                              <div
                                key={service.id}
                                className="flex items-start justify-between gap-4 rounded-xl border border-brand-border/20 p-4 hover:bg-brand-dark/5 dark:border-white/20 dark:hover:bg-white/5"
                              >
                                <div className="flex-1">
                                  <h4 className="text-[15px] font-bold text-brand-dark dark:text-white">
                                    {service.name}
                                  </h4>
                                  {service.description && (
                                    <p className="mt-1 text-[13px] text-brand-dark/60 dark:text-white/60">
                                      {service.description}
                                    </p>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-brand-dark/50 dark:text-white/50">
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      {service.durationMin} {t("min")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Video size={12} />
                                      {tBooking(`deliveryMode.${service.deliveryMode ?? "VIDEO"}` as any) || service.deliveryMode}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[18px] font-bold text-brand-dark dark:text-white">
                                    {service.currency ?? "RWF"} {Number(service.flatFee).toLocaleString()}
                                  </p>
                                  <p className="text-[11px] text-brand-dark/40 dark:text-white/40">
                                    {t("minSession", { count: service.durationMin })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-[13px] text-brand-dark/50 dark:text-white/50">
                    {t("noServicesListed")}
                  </p>
                )}
              </div>

              {/* Credentials (if visible) */}
              {expert.credentialsExpiry && (
                <div className="rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
                  <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">
                    {t("professionalCredentials")}
                  </h2>
                  <div className="flex items-center gap-2 text-[13px]">
                    <Award size={14} className="text-brand-dark/50 dark:text-white/50" />
                    <span className="text-brand-dark/70 dark:text-white/70">
                      {t("licensedUntil", { date: new Date(expert.credentialsExpiry).toLocaleDateString() })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-lg dark:border-white/20 dark:bg-black">
                <h2 className="text-[18px] font-bold text-brand-dark dark:text-white mb-4">
                  {t("bookConsultation")}
                </h2>

                {expert.services && expert.services.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <p className="text-[13px] text-brand-dark/60 dark:text-white/60 mb-2">
                        {t("startingFrom")}
                      </p>
                      <p className="text-[28px] font-bold text-brand-dark dark:text-white">
                        RWF {Math.min(...expert.services.map((s: ProfileService) => Number(s.flatFee))).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      onClick={handleBookClick}
                      className="w-full rounded-xl bg-brand-dark py-6 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
                    >
                      <Calendar size={16} className="mr-2" />
                      {t("checkAvailability")}
                    </Button>

                    <div className="mt-4 space-y-2 text-[11px] text-brand-dark/50 dark:text-white/50">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} />
                        <span>{t("instantConfirmation")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} />
                        <span>{t("securePayment")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} />
                        <span>{t("cancelAnytime")}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-brand-dark/50 dark:text-white/50">
                    {t("notAcceptingBookings")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

    </>
  );
}

export default function ExpertProfilePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <ExpertProfileContent {...props} />
    </Suspense>
  );
}
