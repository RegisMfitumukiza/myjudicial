"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useState, use, Suspense, useEffect, useRef } from "react";
import {
  MapPin, Phone, Share2,
  Calendar, CheckCircle, Award, Clock,
  Briefcase, GraduationCap, Languages, ShieldCheck,
  Quote, Video, Mail, ArrowRight, Star,
  ThumbsUp, ThumbsDown, Flag, Send, Loader2, X, Reply,
} from "lucide-react";
import { StarRating } from "@/shared/components/star-rating";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardContent } from "@/shared/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExpertsExpertIdServices, getExpertsExpertIdReviews } from "@/api/generated";
import { useExpertProfile } from "@/features/search/hooks/useExpertProfile";
import { OfficeMap } from "@/features/search/components/office-map";
import { AvailabilityPreview } from "@/features/booking/components/availability-preview";
import { useRequireBookingAuth } from "@/features/booking/hooks/useRequireBookingAuth";
import { postReviewReaction, deleteReviewReaction, postReviewReport } from "@/lib/api/reviews";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import { getLocalizedLanguage } from "@/shared/constants/languages";
import {
  getLocalizedServiceName,
  getLocalizedServiceCategory,
  getLocalizedServiceDescription,
} from "@/shared/utils/service-localization";

function LawyerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-brand-canvas dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <div className="rounded-2xl border-0 bg-card p-6 shadow-sm lg:p-8">
              <div className="flex flex-col items-start gap-6 sm:flex-row">
                <div className="h-28 w-28 animate-pulse rounded-2xl bg-muted lg:h-32 lg:w-32" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="flex gap-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border-0 bg-card p-5 shadow-sm">
                  <div className="flex flex-col items-center gap-2 py-3 text-center">
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                    <div className="space-y-1.5">
                      <div className="mx-auto h-4 w-16 animate-pulse rounded bg-muted" />
                      <div className="mx-auto h-3 w-12 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border-0 bg-card p-8 shadow-sm">
              <div className="flex gap-8 border-b border-border pb-3">
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border-0 bg-card shadow-sm">
              <div className="h-28 animate-pulse bg-muted" />
              <div className="space-y-4 p-6">
                <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
                <div className="flex gap-3">
                  <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
                  <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LawyerProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireBookingAuth();

  const t = useTranslations("public.expertProfile");
  const tCommon = useTranslations("common");
  const tLawyers = useTranslations("lawyers");
  const tSpecialties = useTranslations("specialties");
  const locale = useLocale();

  const { data: expert, isLoading, error } = useExpertProfile(id);

  const [activeSection, setActiveSection] = useState<string>("overview");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (activeSection && tabRefs.current[activeSection]) {
      tabRefs.current[activeSection]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeSection]);

  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["expert-services", id],
    queryFn: async () => {
      const response = await getExpertsExpertIdServices(id);
      if (response.status === 200) return response.data.data;
      throw new Error("Failed to load services");
    },
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["expert-reviews", id],
    queryFn: async () => {
      const response = await getExpertsExpertIdReviews(id);
      if (response.status === 200) return response.data.data;
      return [];
    },
    enabled: !!id,
  });
  const expertReviews = reviewsData ?? [];

  const reactionMutation = useMutation({
    mutationFn: ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) =>
      postReviewReaction(reviewId, isHelpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-reviews", id] });
    },
    onError: () => toast.error(t("actionFailed")),
  });

  const reportMutation = useMutation({
    mutationFn: ({ reviewId, reason, details }: { reviewId: string; reason: string; details?: string }) =>
      postReviewReport(reviewId, reason, details),
    onSuccess: () => {
      toast.success(t("reportSubmitted"));
      setReportingReviewId(null);
      setReportReason("");
      setReportDetails("");
    },
    onError: () => toast.error(t("actionFailed")),
  });

  function handleBookClick() {
    if (requireAuth(`/lawyers/${id}/book`)) {
      router.push(`/lawyers/${id}/book`);
    }
  }

  function handleBookService(serviceId: string) {
    const url = `/lawyers/${id}/book?serviceId=${serviceId}`;
    if (requireAuth(url)) {
      router.push(url);
    }
  }

  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  // Scroll listener for sticky tab active state
  useEffect(() => {
    function onScroll() {
      // If reached near bottom of page, activate the last section
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 90) {
        setActiveSection("reviews");
        return;
      }

      const sections = ["overview", "services", "credentials", "location", "reviews"];
      const scrollPos = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const el = document.getElementById(section);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(section);
          break;
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading || servicesLoading) {
    return <LawyerProfileSkeleton />;
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-brand-canvas dark:bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="text-center py-16">
            <p className="text-red-600 font-semibold text-lg">{t("failedToLoad")}</p>
            <p className="text-sm text-muted-foreground mt-2">{t("tryAgain")}</p>
          </div>
        </div>
      </div>
    );
  }

  const specialties = expert.specialties.length > 0 ? expert.specialties : [expert.specialty || tLawyers("legalServices")];
  const hasLocation = Boolean((expert.latitude && expert.longitude) || expert.officeAddress);

  return (
    <>
      {/* SEO: JSON-LD BreadcrumbList — invisible to users, indexed by Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `https://myjudicial.com/${locale}`,
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Find Lawyers",
                "item": `https://myjudicial.com/${locale}/search`,
              },
              ...(expert.specialty ? [{
                "@type": "ListItem",
                "position": 3,
                "name": getLocalizedSpecialty(expert.specialty, tSpecialties),
                "item": `https://myjudicial.com/${locale}/search?specialty=${expert.specialty}`,
              }, {
                "@type": "ListItem",
                "position": 4,
                "name": expert.name,
                "item": `https://myjudicial.com/${locale}/lawyers/${id}`,
              }] : [{
                "@type": "ListItem",
                "position": 3,
                "name": expert.name,
                "item": `https://myjudicial.com/${locale}/lawyers/${id}`,
              }]),
            ],
          }),
        }}
      />
      <div className="min-h-screen bg-brand-canvas dark:bg-background pb-16">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 lg:px-6 lg:py-8">

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left Main Column */}
            <div className="space-y-6">
              {/* Profile Hero Card */}
              <Card className="border-0 shadow-sm overflow-hidden bg-card">
                <CardContent className="p-5 sm:p-6 lg:p-8">
                  <div className="flex flex-col items-start gap-6 sm:flex-row">
                    <div className="relative shrink-0">
                      <div className="overflow-hidden rounded-2xl ring-4 ring-brand-border/20 shadow-md">
                        <ExpertAvatar
                          src={expert.avatarUrl}
                          name={expert.name}
                          size="xl"
                          shape="squircle"
                          className="h-28 w-28 lg:h-32 lg:w-32"
                        />
                      </div>
                      {expert.verified && (
                        <div
                          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-white dark:ring-card"
                          title={tLawyers("verifiedTooltip")}
                        >
                          <CheckCircle size={15} className="text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-brand-dark dark:text-white sm:text-3xl">
                          {expert.name}
                        </h1>
                        {expert.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <ShieldCheck size={13} /> {t("verifiedAdvocate")}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-medium text-brand-dark/70 dark:text-white/70">
                        {expert.firmName
                          ? `${getLocalizedSpecialty(expert.specialty, tSpecialties)} • ${expert.firmName}`
                          : getLocalizedSpecialty(expert.specialty, tSpecialties)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {expert.reviewCount > 0 ? (
                          <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="md" />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-50/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
                            <Star size={11} className="fill-amber-400 text-amber-500" />
                            {t("newAdvocateBadge")}
                          </span>
                        )}
                        {expert.location && (
                          <>
                            <span className="h-3 w-px bg-brand-border/60 dark:bg-white/20" />
                            <span className="flex items-center gap-1 text-xs text-brand-dark/60 dark:text-white/60">
                              <MapPin size={12} />
                              {expert.location}
                            </span>
                          </>
                        )}
                        {expert.barNumber && (
                          <>
                            <span className="h-3 w-px bg-brand-border/60 dark:bg-white/20" />
                            <span className="text-xs font-medium text-brand-dark/60 dark:text-white/60">
                              {t("barLicenseNumber", { number: expert.barNumber })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Specialties Chips */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {specialties.map((spec) => (
                          <span
                            key={spec}
                            className="rounded-lg border border-brand-border/80 bg-brand-canvas px-2.5 py-1 text-xs font-medium text-brand-dark/80 dark:border-white/20 dark:bg-white/5 dark:text-white/80"
                          >
                            {getLocalizedSpecialty(spec, tSpecialties)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stat Highlights Row */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <Card size="sm" className="border-0 shadow-sm bg-card">
                  <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10">
                      <Award size={18} className="text-brand-dark dark:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark dark:text-white">
                        {t("experienceYears", { years: expert.yearsExperience })}
                      </p>
                      <p className="text-xs text-brand-dark/50 dark:text-white/50">{t("experienceLabel")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card size="sm" className="border-0 shadow-sm bg-card">
                  <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10">
                      <Briefcase size={18} className="text-brand-dark dark:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark dark:text-white">
                        {specialties.length}
                      </p>
                      <p className="text-xs text-brand-dark/50 dark:text-white/50">{t("specialtiesLabel")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card size="sm" className="border-0 shadow-sm bg-card">
                  <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10">
                      <Languages size={18} className="text-brand-dark dark:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark dark:text-white">
                        {expert.languages.length}
                      </p>
                      <p className="text-xs text-brand-dark/50 dark:text-white/50">{t("languagesLabel")}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sticky Subnavigation Bar */}
              <div className="sticky top-[calc(var(--header-offset,4rem)+0.5rem)] z-20 rounded-xl border border-brand-border/40 bg-card/95 px-2.5 sm:px-3 py-2 shadow-sm backdrop-blur-md dark:border-white/10 transition-[top] duration-300 ease-in-out">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                  <button
                    ref={(el) => { tabRefs.current["overview"] = el; }}
                    onClick={() => scrollToSection("overview")}
                    className={`rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-colors shrink-0 whitespace-nowrap ${
                      activeSection === "overview"
                        ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm"
                        : "text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5 dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    {t("tabAbout")}
                  </button>

                  <button
                    ref={(el) => { tabRefs.current["services"] = el; }}
                    onClick={() => scrollToSection("services")}
                    className={`rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-colors shrink-0 whitespace-nowrap ${
                      activeSection === "services"
                        ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm"
                        : "text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5 dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    {t("tabServices", { count: servicesData?.length ?? 0 })}
                  </button>

                  <button
                    ref={(el) => { tabRefs.current["credentials"] = el; }}
                    onClick={() => scrollToSection("credentials")}
                    className={`rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-colors shrink-0 whitespace-nowrap ${
                      activeSection === "credentials"
                        ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm"
                        : "text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5 dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    {t("tabCredentials")}
                  </button>

                  {hasLocation && (
                    <button
                      ref={(el) => { tabRefs.current["location"] = el; }}
                      onClick={() => scrollToSection("location")}
                      className={`rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-colors shrink-0 whitespace-nowrap ${
                        activeSection === "location"
                          ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm"
                          : "text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5 dark:text-white/60 dark:hover:text-white"
                      }`}
                    >
                      {t("tabLocation")}
                    </button>
                  )}

                  <button
                    ref={(el) => { tabRefs.current["reviews"] = el; }}
                    onClick={() => scrollToSection("reviews")}
                    className={`rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-colors shrink-0 whitespace-nowrap ${
                      activeSection === "reviews"
                        ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm"
                        : "text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5 dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    {t("tabReviews", { count: expertReviews.length })}
                  </button>
                </div>
              </div>

              {/* SECTION 1: About the Advocate */}
              <div id="overview" className="scroll-mt-28">
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3 px-4 sm:px-6 pt-6">
                    <h2 className="text-base sm:text-lg font-bold text-brand-dark dark:text-white flex items-center gap-2">
                      <Quote size={18} className="text-brand-dark/60 dark:text-white/60" />
                      {t("aboutTitle")}
                    </h2>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-6 pt-0 space-y-6">
                    {expert.bio ? (
                      <p className="text-sm leading-relaxed text-brand-dark/80 dark:text-white/80 whitespace-pre-line">
                        {expert.bio}
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        {t("verifiedAdvocateSubtitle")}
                      </p>
                    )}

                    {/* Bar Standing Box */}
                    {expert.verified && (
                      <div className="rounded-xl border border-brand-border/60 bg-brand-canvas/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-3">
                          {t("barVerificationTitle")}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                              <CheckCircle size={15} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-brand-dark dark:text-white">
                                {t("barVerifiedProfessional")}
                              </p>
                              <p className="text-xs text-brand-dark/60 dark:text-white/60">
                                {expert.barNumber
                                  ? t("barLicenseNumber", { number: expert.barNumber })
                                  : t("barGeneralCertified")}
                              </p>
                            </div>
                          </div>

                          {expert.firmName && (
                            <div className="flex items-start gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                                <Briefcase size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-brand-dark dark:text-white">{expert.firmName}</p>
                                <p className="text-xs text-brand-dark/60 dark:text-white/60">{t("firmStanding")}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {expert.languages && expert.languages.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-2 flex items-center gap-1.5">
                          <Languages size={14} /> {t("spokenLanguages")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {expert.languages.map((lang) => (
                            <span
                              key={lang}
                              className="rounded-lg border border-brand-border/80 bg-background px-3 py-1 text-xs font-semibold text-brand-dark/80 shadow-2xs dark:border-white/10 dark:text-white/80"
                            >
                              {getLocalizedLanguage(lang, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 2: Services & Pricing */}
              <div id="services" className="scroll-mt-28">
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3 px-4 sm:px-6 pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-bold text-brand-dark dark:text-white">
                          {t("servicesTitle")}
                        </h2>
                        <p className="text-xs text-brand-dark/50 dark:text-white/50 mt-0.5 leading-relaxed">
                          {t("servicesSubtitle")}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-dark/10 px-2.5 py-1 text-xs font-bold text-brand-dark dark:bg-white/10 dark:text-white shrink-0 whitespace-nowrap">
                        {servicesData?.length ?? 0}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-6 pt-2 space-y-4">
                    {!servicesData || servicesData.length === 0 ? (
                      <p className="text-sm text-brand-dark/50 dark:text-white/50 py-4 text-center">
                        {t("noServicesListed")}
                      </p>
                    ) : (
                      servicesData.map((service: any) => {
                        const DeliveryIcon = service.deliveryMode === "PHONE" ? Phone
                          : service.deliveryMode === "IN_PERSON" ? MapPin
                          : service.deliveryMode === "EMAIL" ? Mail
                          : Video;
                        return (
                          <div
                            key={service.id}
                            className="rounded-2xl border border-brand-border/60 bg-background p-5 transition-all hover:border-brand-dark/40 hover:shadow-sm dark:border-white/10 dark:hover:border-white/30"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-bold text-brand-dark dark:text-white">
                                    {getLocalizedServiceName(service, t)}
                                  </h3>
                                  {service.isDefault && (
                                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                      {t("baseRate")}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                  {service.category && (
                                    <span className="rounded-md bg-brand-dark/10 px-2 py-0.5 font-medium text-brand-dark/70 dark:bg-white/10 dark:text-white/70">
                                      {getLocalizedServiceCategory(service.category, t)}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-dark/10 px-2 py-0.5 font-medium text-brand-dark/70 dark:bg-white/10 dark:text-white/70">
                                    <DeliveryIcon size={12} />
                                    {service.deliveryMode === "VIDEO" ? t("modeVideo") : service.deliveryMode === "PHONE" ? t("modePhone") : service.deliveryMode === "IN_PERSON" ? t("modeInPerson") : t("modeDocument")}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-dark/10 px-2 py-0.5 font-medium text-brand-dark/70 dark:bg-white/10 dark:text-white/70">
                                    <Clock size={12} />
                                    {service.durationMin} min
                                  </span>
                                </div>

                                {service.description && (
                                  <p className="mt-2.5 text-xs leading-relaxed text-brand-dark/70 dark:text-white/70">
                                    {getLocalizedServiceDescription(service.description, expert.name, t)}
                                  </p>
                                )}
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                                <div className="text-left sm:text-right">
                                  <p className="text-lg font-bold text-brand-dark dark:text-white">
                                    {service.currency} {Number(service.flatFee).toLocaleString()}
                                  </p>
                                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50">
                                    {service.isDefault ? t("baseRate") : t("perService")}
                                  </p>
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => handleBookService(service.id)}
                                  className="gap-1.5 rounded-xl bg-brand-dark text-xs font-bold text-on-brand hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 h-9"
                                >
                                  {t("bookThisService")} <ArrowRight size={13} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 3: Credentials & Education */}
              <div id="credentials" className="scroll-mt-28">
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3 px-4 sm:px-6 pt-6">
                    <h2 className="text-base sm:text-lg font-bold text-brand-dark dark:text-white">
                      {t("credentialsTitle")}
                    </h2>
                    <p className="text-xs text-brand-dark/50 dark:text-white/50 mt-0.5 leading-relaxed">
                      {t("credentialsSubtitle")}
                    </p>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-6 pt-2 space-y-6">
                    {/* Education */}
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-dark/60 dark:text-white/60 flex items-center gap-2">
                        <GraduationCap size={15} />
                        {t("education")}
                      </h3>
                      {expert.education.length === 0 ? (
                        <p className="text-xs text-brand-dark/50 dark:text-white/50 py-2">
                          {t("noEducation")}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {expert.education.map((edu) => (
                            <div
                              key={edu.id}
                              className="flex items-start gap-3 rounded-xl border border-brand-border/40 bg-background p-3 dark:border-white/10"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                                <GraduationCap size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-brand-dark dark:text-white">{edu.degree}</p>
                                {edu.fieldOfStudy && (
                                  <p className="text-xs text-brand-dark/60 dark:text-white/60">{edu.fieldOfStudy}</p>
                                )}
                                <p className="mt-0.5 text-[11px] text-brand-dark/50 dark:text-white/50">
                                  {edu.institution} &middot; {edu.yearCompleted}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Certifications */}
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-dark/60 dark:text-white/60 flex items-center gap-2">
                        <Award size={15} />
                        {t("certifications")}
                      </h3>
                      {expert.certifications.length === 0 ? (
                        <p className="text-xs text-brand-dark/50 dark:text-white/50 py-2">
                          {t("noCertifications")}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {expert.certifications.map((cert) => {
                            const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                            return (
                              <div
                                key={cert.id}
                                className="flex items-start gap-3 rounded-xl border border-brand-border/40 bg-background p-3 dark:border-white/10"
                              >
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                    isExpired
                                      ? "bg-brand-dark/5 text-brand-dark/40 dark:bg-white/5 dark:text-white/40"
                                      : "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white"
                                  }`}
                                >
                                  <Award size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-brand-dark dark:text-white">
                                      {cert.certificateName}
                                    </p>
                                    {isExpired && (
                                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                                        {t("expired")}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-[11px] text-brand-dark/50 dark:text-white/50">
                                    {cert.issuer} &middot; {t("issued", { date: new Date(cert.issueDate).toLocaleDateString() })}
                                    {cert.expiryDate && (
                                      <> &middot; {t("expires", { date: new Date(cert.expiryDate).toLocaleDateString() })}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 4: Office Location */}
              {hasLocation && (
                <div id="location" className="scroll-mt-28">
                  <Card className="border-0 shadow-sm bg-card">
                    <CardHeader className="pb-3 px-4 sm:px-6 pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-brand-dark dark:text-white flex items-center gap-2">
                            <MapPin size={18} /> {t("officeLocationTitle")}
                          </h2>
                          <p className="text-xs text-brand-dark/50 dark:text-white/50 mt-0.5 leading-relaxed">
                            {t("officeLocationSubtitle")}
                          </p>
                        </div>
                        {expert.officeAddress && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(expert.officeAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8 whitespace-nowrap">
                              <MapPin size={12} /> {t("getDirections")}
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-6 pt-2 space-y-3">
                      {expert.latitude && expert.longitude && (
                        <div className="overflow-hidden rounded-xl border border-brand-border/60 dark:border-white/10">
                          <OfficeMap
                            latitude={expert.latitude}
                            longitude={expert.longitude}
                            label={expert.name}
                            className="h-56 w-full"
                          />
                        </div>
                      )}
                      {expert.officeAddress && (
                        <p className="text-xs font-medium text-brand-dark/70 dark:text-white/70 flex items-center gap-1.5 pt-1">
                          <MapPin size={13} className="text-brand-dark/40 dark:text-white/40 shrink-0" />
                          {expert.officeAddress}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SECTION 5: Client Reviews */}
              <div id="reviews" className="scroll-mt-28">
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3 px-4 sm:px-6 pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-bold text-brand-dark dark:text-white">
                          {t("reviewsTitle")}
                        </h2>
                        <p className="text-xs text-brand-dark/50 dark:text-white/50 mt-0.5 leading-relaxed">
                          {t("reviewsSubtitle")}
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        {expertReviews.length > 0 ? (
                          <StarRating rating={expert.rating} reviewCount={expertReviews.length} size="md" />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-muted-foreground whitespace-nowrap shrink-0">
                            {t("zeroReviewsCount")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-6 pt-2 space-y-6">
                    {expertReviews.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-10 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 mb-3">
                          <Star size={22} className="fill-amber-400/30 text-amber-500" />
                        </div>
                        <h3 className="text-sm font-bold text-brand-dark dark:text-white">
                          {t("noReviewsTitle")}
                        </h3>
                        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                          {t("noReviewsDesc")}
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                          <div className="rounded-xl bg-background/90 px-3.5 py-2.5 text-xs font-medium text-muted-foreground border border-border/70 shadow-2xs w-full flex items-start gap-2.5 text-left">
                            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{t("noReviewsTrustNote")}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleBookClick}
                            className="gap-1.5 rounded-xl bg-brand-dark text-xs font-semibold text-on-brand hover:bg-brand-dark/90 dark:bg-white dark:text-black h-9 shrink-0 w-full sm:w-auto"
                          >
                            <Calendar size={13} /> {t("bookFirstReviewCta")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      expertReviews.map((review: any) => (
                        <div
                          key={review.id}
                          className="border-b border-brand-border/40 pb-5 last:border-0 last:pb-0 dark:border-white/10"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-white dark:bg-white dark:text-black">
                              {(review.user?.firstName ?? "A").charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-brand-dark dark:text-white">
                                    {review.user?.firstName} {review.user?.lastName}
                                  </p>
                                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                    {t("verifiedClient")}
                                  </span>
                                </div>
                                <span className="shrink-0 text-[11px] text-brand-dark/40 dark:text-white/40">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="mt-1 flex gap-0.5">
                                {[...Array(5)].map((_, j) => (
                                  <Star
                                    key={j}
                                    size={12}
                                    className={
                                      j < review.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-brand-border dark:text-white/20"
                                    }
                                  />
                                ))}
                              </div>

                              {review.comment && (
                                <p className="mt-2 text-xs leading-relaxed text-brand-dark/80 dark:text-white/80">
                                  {review.comment}
                                </p>
                              )}

                              {/* Advocate Reply */}
                              {review.expertReply && (
                                <div className="mt-3 ml-3 rounded-xl border border-brand-border/60 bg-brand-canvas/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                  <div className="flex items-center gap-2">
                                    <Reply size={12} className="text-brand-dark/50 dark:text-white/50" />
                                    <span className="text-[11px] font-bold text-brand-dark dark:text-white">
                                      {t("advocateReply")}
                                    </span>
                                    <span className="text-[10px] text-brand-dark/40 dark:text-white/40">
                                      {new Date(review.expertReply.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-brand-dark/70 dark:text-white/70">
                                    {review.expertReply.reply}
                                  </p>
                                </div>
                              )}

                              {/* Helpful Reaction and Report */}
                              <div className="mt-3 flex items-center gap-4 text-xs">
                                <button
                                  onClick={() => reactionMutation.mutate({ reviewId: review.id, isHelpful: true })}
                                  className="flex items-center gap-1 text-[11px] text-brand-dark/50 hover:text-brand-dark dark:text-white/50 dark:hover:text-white transition-colors"
                                >
                                  <ThumbsUp size={12} />
                                  <span>{t("helpful")} ({review.helpfulCount || 0})</span>
                                </button>
                                <button
                                  onClick={() => reactionMutation.mutate({ reviewId: review.id, isHelpful: false })}
                                  className="flex items-center gap-1 text-[11px] text-brand-dark/50 hover:text-brand-dark dark:text-white/50 dark:hover:text-white transition-colors"
                                >
                                  <ThumbsDown size={12} />
                                  <span>{t("unhelpful")} ({review.unhelpfulCount || 0})</span>
                                </button>
                                <button
                                  onClick={() => setReportingReviewId(review.id)}
                                  className="flex items-center gap-1 text-[11px] text-brand-dark/30 hover:text-rose-600 dark:text-white/30 dark:hover:text-rose-400 transition-colors"
                                >
                                  <Flag size={11} />
                                  <span>{t("report")}</span>
                                </button>
                              </div>

                              {/* Report Dialog Inline */}
                              {reportingReviewId === review.id && (
                                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/30">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                                      {t("reportReview")}
                                    </p>
                                    <button
                                      onClick={() => setReportingReviewId(null)}
                                      className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  <select
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="mt-2 w-full rounded-lg border border-rose-200 bg-white p-1.5 text-xs text-rose-950 dark:border-rose-800 dark:bg-black dark:text-rose-200"
                                  >
                                    <option value="">{t("selectReason")}</option>
                                    <option value="SPAM">{tLawyers("reportModal.spam")}</option>
                                    <option value="HARASSMENT">{tLawyers("reportModal.harassment")}</option>
                                    <option value="OFFENSIVE_LANGUAGE">{tLawyers("reportModal.offensiveLanguage")}</option>
                                    <option value="FAKE_REVIEW">{tLawyers("reportModal.fakeReview")}</option>
                                    <option value="OTHER">{tLawyers("reportModal.other")}</option>
                                  </select>
                                  <textarea
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                    placeholder={t("optionalDetails")}
                                    rows={2}
                                    className="mt-2 w-full rounded-lg border border-rose-200 bg-white p-1.5 text-xs text-rose-950 placeholder:text-rose-300 dark:border-rose-800 dark:bg-black dark:text-rose-200"
                                  />
                                  <button
                                    onClick={() => {
                                      if (!reportReason) {
                                        toast.error(t("selectReason"));
                                        return;
                                      }
                                      reportMutation.mutate({
                                        reviewId: review.id,
                                        reason: reportReason,
                                        details: reportDetails || undefined,
                                      });
                                    }}
                                    disabled={!reportReason || reportMutation.isPending}
                                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                                  >
                                    {reportMutation.isPending ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Send size={12} />
                                    )}
                                    {reportMutation.isPending ? t("submittingReport") : t("submitReport")}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Sidebar (Sticky) */}
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              {/* Pricing & Booking Card */}
              <Card className="overflow-hidden border-0 shadow-sm bg-card">
                <div className="bg-brand-dark px-6 py-5 dark:bg-black dark:border-b dark:border-white/10">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-white/60">
                    {t("baseConsultationFee")}
                  </p>
                  <p className="mt-1.5 text-3xl font-extrabold text-white">
                    {expert.startingRateRwf > 0
                      ? `${Number(expert.startingRateRwf).toLocaleString()}`
                      : tLawyers("contactRate")}{" "}
                    <span className="text-base font-normal text-white/60">RWF</span>
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {t("transparentPricing")}
                  </p>
                </div>

                <CardContent className="space-y-4 p-5 sm:p-6">
                  <Button
                    size="lg"
                    onClick={handleBookClick}
                    className="w-full gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 h-12 shadow-sm"
                  >
                    <Calendar size={16} /> {t("bookConsultation")}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 rounded-xl border-brand-border text-xs h-9"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: expert.name, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success(t("shareSuccess"));
                        }
                      }}
                    >
                      <Share2 size={13} /> {t("shareProfile")}
                    </Button>

                    {expert.officeAddress ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(expert.officeAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full gap-1.5 rounded-xl border-brand-border text-xs h-9">
                          <MapPin size={13} /> {t("directions")}
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 rounded-xl border-brand-border text-xs h-9" disabled>
                        <MapPin size={13} /> {t("directions")}
                      </Button>
                    )}
                  </div>

                  {/* Immediate Availability Calendar Preview */}
                  <div className="pt-1">
                    <AvailabilityPreview
                      expertId={id}
                      timezone="Africa/Kigali"
                      onBookClick={handleBookClick}
                    />
                  </div>

                  {/* Summary Facts */}
                  <div className="pt-2 space-y-2.5 border-t border-border/60">
                    <div className="flex items-center gap-2.5 text-xs text-brand-dark/70 dark:text-white/70">
                      <Briefcase size={14} className="text-brand-dark/50 dark:text-white/50 shrink-0" />
                      <span>{getLocalizedSpecialty(specialties[0], tSpecialties)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-brand-dark/70 dark:text-white/70">
                      <Clock size={14} className="text-brand-dark/50 dark:text-white/50 shrink-0" />
                      <span>{t("servicesCount", { count: servicesData?.length ?? 0 })}</span>
                    </div>
                    {expert.location && (
                      <div className="flex items-center gap-2.5 text-xs text-brand-dark/70 dark:text-white/70">
                        <MapPin size={14} className="text-brand-dark/50 dark:text-white/50 shrink-0" />
                        <span>{expert.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trust & Escrow Guarantee Card */}
              <Card size="sm" className="border-0 shadow-sm bg-card">
                <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10 text-brand-dark dark:text-white">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-dark dark:text-white">
                      {t("trustCardTitle")}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                      {t("trustCardDesc")}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={11} /> {t("escrowProtection")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.09)] backdrop-blur-md dark:border-white/10 dark:bg-card/95 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold tracking-tight text-brand-dark dark:text-white">
                {expert.startingRateRwf > 0 ? Number(expert.startingRateRwf).toLocaleString() : tLawyers("contactRate")}
              </span>
              {expert.startingRateRwf > 0 && (
                <span className="text-[11px] font-bold text-muted-foreground">RWF</span>
              )}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground truncate">
              {getLocalizedSpecialty(specialties[0] || expert.specialty, tSpecialties) || expert.name}
            </p>
          </div>
          <Button
            onClick={handleBookClick}
            size="sm"
            className="shrink-0 gap-1.5 rounded-xl bg-brand-dark px-5 text-xs font-bold text-on-brand hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 h-10 shadow-sm whitespace-nowrap"
          >
            <Calendar size={14} /> {t("bookNow")}
          </Button>
        </div>
      </div>

      {/* Safe-area spacer for mobile bottom bar */}
      <div className="h-20 pb-[env(safe-area-inset-bottom)] lg:hidden" />
    </>
  );
}

export default function LawyerProfilePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LawyerProfileSkeleton />}>
      <LawyerProfileContent {...props} />
    </Suspense>
  );
}