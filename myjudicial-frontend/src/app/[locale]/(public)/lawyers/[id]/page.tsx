"use client";

import { Link, useRouter } from "@/i18n/routing";
import { useState, use, Suspense } from "react";
import {
  MapPin, Phone, Share2,
  Calendar, ChevronLeft, CheckCircle, Award, Clock,
  Briefcase, GraduationCap, Languages, ShieldCheck,
  Quote, Video, Mail, ArrowRight, Star,
  ThumbsUp, ThumbsDown, Flag, Send, Loader2, X, Reply, MessageSquare,
} from "lucide-react";
import { StarRating } from "@/shared/components/star-rating";
import { ExpertAvatar } from "@/shared/components/expert-avatar";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/shared/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExpertsExpertIdServices, getExpertsExpertIdReviews } from "@/api/generated";
import { useExpertProfile } from "@/features/search/hooks/useExpertProfile";
import { OfficeMap } from "@/features/search/components/office-map";
import { AvailabilityPreview } from "@/features/booking/components/availability-preview";
import { useRequireBookingAuth } from "@/features/booking/hooks/useRequireBookingAuth";
import { postReviewReaction, deleteReviewReaction, postReviewReport } from "@/lib/api/reviews";
import { toast } from "sonner";

function LawyerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-brand-canvas">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mb-8 h-4 w-32 animate-pulse rounded bg-muted" />
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
  const { data: expert, isLoading, error } = useExpertProfile(id);
  const [activeTab, setActiveTab] = useState<"bio" | "services" | "credentials" | "reviews">("bio");

  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireBookingAuth();

  function handleBookClick() {
    if (requireAuth(`/lawyers/${id}/book`)) {
      router.push(`/lawyers/${id}/book`);
    }
  }

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

  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const reactionMutation = useMutation({
    mutationFn: ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) =>
      postReviewReaction(reviewId, isHelpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-reviews", id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeReactionMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReviewReaction(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-reviews", id] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ reviewId, reason, details }: { reviewId: string; reason: string; details?: string }) =>
      postReviewReport(reviewId, reason, details),
    onSuccess: () => {
      toast.success("Report submitted");
      setReportingReviewId(null);
      setReportReason("");
      setReportDetails("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading || servicesLoading) {
    return <LawyerProfileSkeleton />;
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-brand-canvas">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
          <Link
            href="/search"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark/50 hover:text-brand-dark transition-colors"
          >
            <ChevronLeft size={16} /> Back to search results
          </Link>
          <div className="text-center">
            <p className="text-red-600 font-medium">Failed to load expert profile</p>
            <p className="text-sm text-slate-400 mt-2">Please try again or go back to search results</p>
          </div>
        </div>
      </div>
    );
  }

  const specialties = [expert.specialty || "Legal Services"];
  const initials = expert.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const tagsList = specialties.slice(0, 3);

  return (
    <>
      <div className="min-h-screen bg-brand-canvas">

      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 lg:px-6 lg:py-8">
        <Link
          href="/search"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark/50 hover:text-brand-dark transition-colors"
        >
          <ChevronLeft size={16} /> Back to search results
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col items-start gap-6 sm:flex-row">
                  <div className="relative shrink-0">
                    <div className="overflow-hidden rounded-2xl ring-4 ring-brand-border/20 shadow-lg">
                      <ExpertAvatar src={expert.avatarUrl} name={expert.name} size="xl" className="h-28 w-28 rounded-none lg:h-32 lg:w-32" />
                    </div>
                    {expert.verified && (
                      <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark shadow-md ring-2 ring-white">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-brand-dark lg:text-3xl">
                      {expert.name}
                    </h1>
                    <p className="mt-1 text-sm font-medium text-brand-dark/70">{specialties[0]}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="md" />
                      {expert.location && (
                        <>
                          <span className="h-3 w-px bg-brand-border/60" />
                          <span className="flex items-center gap-1 text-xs text-brand-dark/60">
                            <MapPin size={12} />
                            {expert.location}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tagsList.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-brand-border bg-brand-dark/5 px-3 py-1 text-xs font-medium text-brand-dark/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <Card size="sm">
                <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10">
                    <Award size={18} className="text-brand-dark" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{expert.yearsExperience}+ years</p>
                    <p className="text-xs text-brand-dark/50">Experience</p>
                  </div>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10">
                    <Briefcase size={18} className="text-brand-dark" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{specialties.length}</p>
                    <p className="text-xs text-brand-dark/50">Specialties</p>
                  </div>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10">
                    <Languages size={18} className="text-brand-dark/60" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{expert.languages?.length || 0}</p>
                    <p className="text-xs text-brand-dark/50">Languages</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-0 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
                <div className="flex gap-4 overflow-x-auto border-b border-brand-border [scrollbar-width:none] sm:gap-6 lg:gap-8 [&::-webkit-scrollbar]:hidden">
                  {(["bio", "services", "credentials", "reviews"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 -mb-px whitespace-nowrap pb-3 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === tab
                          ? "border-brand-dark text-brand-dark"
                          : "border-transparent text-brand-dark/40 hover:text-brand-dark/70"
                      }`}
                    >
                      {tab === "bio" ? "About" : tab === "services" ? `Services (${servicesData?.length ?? 0})` : tab === "credentials" ? "Credentials" : `Reviews (${expertReviews.length})`}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6">
                {activeTab === "bio" ? (
                  <div className="space-y-8">
                    {expert.bio && (
                      <div>
                        <p className="text-sm leading-7 text-brand-dark/70">{expert.bio}</p>
                      </div>
                    )}
                    {expert.verified && (
                      <div className="border-l-2 border-brand-dark pl-5">
                        <h3 className="mb-4 text-sm font-bold text-brand-dark flex items-center gap-2">
                          <GraduationCap size={16} className="text-brand-dark" />
                          Verification
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark/10">
                              <CheckCircle size={14} className="text-brand-dark" />
                            </div>
                            <div className="pt-0.5">
                              <p className="text-sm font-medium text-brand-dark">Verified Professional</p>
                              <p className="text-xs text-brand-dark/50">
                                {expert.barNumber
                                  ? `BAR certified — License #${expert.barNumber}`
                                  : "BAR certified legal expert"}
                              </p>
                            </div>
                          </div>
                          {expert.firmName && (
                            <div className="flex items-start gap-3">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark/10">
                                <Briefcase size={14} className="text-brand-dark" />
                              </div>
                              <div className="pt-0.5">
                                <p className="text-sm font-medium text-brand-dark">{expert.firmName}</p>
                                <p className="text-xs text-brand-dark/50">Registered firm</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {expert.languages && expert.languages.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-sm font-bold text-brand-dark flex items-center gap-2">
                          <Languages size={16} className="text-brand-blue" />
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {expert.languages.map((lang) => (
                            <span
                              key={lang}
                              className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark/70"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeTab === "services" ? (
                  <div className="space-y-4">
                    {!servicesData || servicesData.length === 0 ? (
                      <p className="text-sm text-brand-dark/50">No services listed yet.</p>
                    ) : (
                      servicesData.map((service: any) => {
                        const DeliveryIcon = service.deliveryMode === "PHONE" ? Phone
                          : service.deliveryMode === "IN_PERSON" ? MapPin
                          : service.deliveryMode === "EMAIL" ? Mail
                          : Video;
                        return (
                          <div
                            key={service.id}
                            className="rounded-xl border border-brand-border/20 p-5 transition hover:border-brand-dark/30 hover:bg-brand-dark/[0.02] dark:border-white/20 dark:hover:border-white/30"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-bold text-brand-dark dark:text-white">
                                  {service.name}
                                </h3>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {service.category && (
                                    <span className="rounded-md bg-brand-dark/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
                                      {service.category.replace(/_/g, " ")}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-dark/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
                                    <DeliveryIcon size={11} />
                                    {service.deliveryMode === "VIDEO" ? "Video" : service.deliveryMode === "PHONE" ? "Phone" : service.deliveryMode === "IN_PERSON" ? "In Person" : "Email"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-dark/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
                                    <Clock size={11} />
                                    {service.durationMin} min
                                  </span>
                                </div>
                                {service.description && (
                                  <p className="mt-2 text-[13px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-[18px] font-bold text-brand-dark dark:text-white">
                                  {service.currency} {Number(service.flatFee).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-brand-dark/40 dark:text-white/40">
                                  {service.isDefault ? "base rate" : "per service"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : activeTab === "credentials" ? (
                  <div className="space-y-8">
                    {/* Education */}
                    <div>
                      <h3 className="mb-4 text-sm font-bold text-brand-dark flex items-center gap-2">
                        <GraduationCap size={16} className="text-brand-dark" />
                        Education
                      </h3>
                      {expert.education.length === 0 ? (
                        <p className="text-sm text-brand-dark/50">No education records listed.</p>
                      ) : (
                        <div className="space-y-4">
                          {expert.education.map((edu) => (
                            <div key={edu.id} className="flex items-start gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                                <GraduationCap size={18} className="text-brand-dark" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-brand-dark">{edu.degree}</p>
                                {edu.fieldOfStudy && (
                                  <p className="text-xs text-brand-dark/60">{edu.fieldOfStudy}</p>
                                )}
                                <p className="mt-0.5 text-xs text-brand-dark/50">
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
                      <h3 className="mb-4 text-sm font-bold text-brand-dark flex items-center gap-2">
                        <Award size={16} className="text-brand-dark" />
                        Certifications
                      </h3>
                      {expert.certifications.length === 0 ? (
                        <p className="text-sm text-brand-dark/50">No certifications listed.</p>
                      ) : (
                        <div className="space-y-4">
                          {expert.certifications.map((cert) => {
                            const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                            return (
                              <div key={cert.id} className="flex items-start gap-4">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isExpired ? "bg-brand-dark/5" : "bg-brand-dark/10"}`}>
                                  <Award size={18} className={isExpired ? "text-brand-dark/40" : "text-brand-dark"} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-brand-dark">{cert.certificateName}</p>
                                    {isExpired && (
                                      <span className="rounded bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-dark/50">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-brand-dark/50">
                                    {cert.issuer} &middot; Issued {new Date(cert.issueDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                    {cert.expiryDate && (
                                      <> &middot; Expires {new Date(cert.expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {expertReviews.length === 0 ? (
                      <p className="text-sm text-brand-dark/50">No reviews yet.</p>
                    ) : (
                      expertReviews.map((review: any, i: number) => (
                        <div key={i} className="border-b border-brand-border pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                      {(review.user?.firstName ?? "A").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-brand-dark">
                          {review.user?.firstName} {review.user?.lastName}
                        </p>
                        <span className="shrink-0 text-xs text-brand-dark/40">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            size={12}
                            className={j < review.rating ? "fill-brand-dark text-brand-dark" : "text-brand-border"}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <div className="mt-2 flex gap-2">
                          <Quote size={14} className="mt-0.5 shrink-0 text-brand-dark/20" />
                          <p className="text-sm leading-6 text-brand-dark/70">{review.comment}</p>
                        </div>
                      )}

                      {/* Expert Reply */}
                      {review.expertReply && (
                        <div className="mt-3 ml-4 rounded-lg border border-brand-border bg-brand-canvas p-3">
                          <div className="flex items-center gap-2">
                            <Reply size={12} className="text-brand-dark/40" />
                            <span className="text-xs font-bold text-brand-dark">Expert reply</span>
                            <span className="text-xs text-brand-dark/40">
                              {new Date(review.expertReply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-brand-dark/70">{review.expertReply.reply}</p>
                        </div>
                      )}

                      {/* Reactions + Report */}
                      <div className="mt-3 flex items-center gap-4">
                        <button
                          onClick={() => reactionMutation.mutate({ reviewId: review.id, isHelpful: true })}
                          className="flex items-center gap-1 text-xs text-brand-dark/40 hover:text-brand-dark"
                        >
                          <ThumbsUp size={12} />
                          <span>{review.helpfulCount || 0}</span>
                        </button>
                        <button
                          onClick={() => reactionMutation.mutate({ reviewId: review.id, isHelpful: false })}
                          className="flex items-center gap-1 text-xs text-brand-dark/40 hover:text-brand-dark"
                        >
                          <ThumbsDown size={12} />
                          <span>{review.unhelpfulCount || 0}</span>
                        </button>
                        <button
                          onClick={() => setReportingReviewId(review.id)}
                          className="flex items-center gap-1 text-xs text-brand-dark/30 hover:text-red-600"
                        >
                          <Flag size={11} />
                          Report
                        </button>
                      </div>

                      {/* Report Dialog */}
                      {reportingReviewId === review.id && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-red-800">Report this review</p>
                            <button onClick={() => setReportingReviewId(null)} className="text-red-400 hover:text-red-600">
                              <X size={14} />
                            </button>
                          </div>
                          <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="mt-2 w-full rounded border border-red-200 p-1.5 text-xs text-red-900"
                          >
                            <option value="">Select a reason...</option>
                            <option value="SPAM">Spam</option>
                            <option value="HARASSMENT">Harassment</option>
                            <option value="OFFENSIVE_LANGUAGE">Offensive language</option>
                            <option value="FAKE_REVIEW">Fake review</option>
                            <option value="OTHER">Other</option>
                          </select>
                          <textarea
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            placeholder="Optional details..."
                            rows={2}
                            className="mt-2 w-full rounded border border-red-200 p-1.5 text-xs text-red-900 placeholder:text-red-300"
                          />
                          <button
                            onClick={() => {
                              if (!reportReason) { toast.error("Please select a reason"); return; }
                              reportMutation.mutate({ reviewId: review.id, reason: reportReason, details: reportDetails || undefined });
                            }}
                            disabled={!reportReason || reportMutation.isPending}
                            className="mt-2 flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {reportMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Submit Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden border-0 shadow-sm">
              <div className="bg-brand-dark px-6 py-5">
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest">Starting From</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {expert.startingRateRwf > 0
                    ? `${Number(expert.startingRateRwf).toLocaleString()}`
                    : "Contact"}{" "}
                  <span className="text-base font-normal text-white/50">RWF</span>
                </p>
                <p className="mt-0.5 text-xs text-white/40">{expert.startingRateRwf > 0 ? "starting from" : "for pricing"}</p>
              </div>
              <CardContent className="space-y-4 p-6">
                <Button
                  size="lg"
                  onClick={handleBookClick}
                  className="w-full gap-2 rounded-xl bg-brand-dark text-sm font-bold text-on-brand hover:bg-brand-dark/90 h-12"
                >
                  <Calendar size={16} /> Book a Service
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 rounded-xl border-brand-border text-xs h-10"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: expert.name, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard");
                      }
                    }}
                  >
                    <Share2 size={13} /> Share Profile
                  </Button>
                  {expert.officeAddress ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(expert.officeAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-1.5 rounded-xl border-brand-border text-xs h-10">
                        <MapPin size={13} /> Directions
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 rounded-xl border-brand-border text-xs h-10" disabled>
                      <MapPin size={13} /> No Address
                    </Button>
                  )}
                </div>
                <AvailabilityPreview
                  expertId={id}
                  timezone="Africa/Kigali"
                  onBookClick={handleBookClick}
                />
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-brand-dark/60">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/10">
                      <Briefcase size={14} className="text-brand-dark" />
                    </div>
                    {specialties[0]}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-brand-dark/60">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/10">
                      <Clock size={14} className="text-brand-dark" />
                    </div>
                    {(servicesData?.length ?? 0)} service{(servicesData?.length ?? 0) === 1 ? "" : "s"} offered
                  </div>
                  {expert.location && (
                    <div className="flex items-center gap-3 text-sm text-brand-dark/60">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/10">
                        <MapPin size={14} className="text-brand-dark/60" />
                      </div>
                      {expert.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                  <ShieldCheck size={18} className="text-brand-dark" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark">Verified Professional</p>
                  <p className="mt-1 text-xs text-brand-dark/50 leading-relaxed">
                    Identity, credentials, and bar association membership verified.
                  </p>
                </div>
              </CardContent>
            </Card>

            {expert.latitude && expert.longitude && (
              <Card size="sm">
                <CardContent className="p-3">
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-brand-dark/40 dark:text-white/40">
                    Office Location
                  </p>
                  <OfficeMap
                    latitude={expert.latitude}
                    longitude={expert.longitude}
                    label={expert.name}
                    className="h-36 w-full"
                  />
                  {expert.officeAddress && (
                    <p className="mt-2 px-2 text-xs text-brand-dark/50 dark:text-white/50 flex items-center gap-1">
                      <MapPin size={11} /> {expert.officeAddress}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Mobile Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-border/20 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:border-white/20 dark:bg-black lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-dark dark:text-white truncate">{expert.name}</p>
            <p className="text-xs text-brand-dark/50 dark:text-white/50">
              {expert.startingRateRwf > 0
                ? `From RWF ${Number(expert.startingRateRwf).toLocaleString()}`
                : "Contact for pricing"}
            </p>
          </div>
          <Button
            onClick={handleBookClick}
            className="shrink-0 gap-2 rounded-xl bg-brand-dark px-6 text-sm font-bold text-white hover:opacity-90 dark:bg-white dark:text-black h-11"
          >
            <Calendar size={15} /> Book
          </Button>
        </div>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-20 lg:hidden" />
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