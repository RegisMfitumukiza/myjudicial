"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle2,
  FileText,
  Briefcase,
  MapPin,
  Languages as LanguagesIcon,
  Loader2,
  Scale,
  Camera,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { postExpertsProfile } from "@/api/generated";
import type { CreateProfileDto } from "@/api/generated";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { ExpertOnboardingHeader, StepProgress } from "./ExpertOnboardingHeader";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { FreeLocationInput } from "@/shared/components/location/FreeLocationInput";
import {
  useExpertProfile,
  EXPERT_PROFILE_QUERY_KEY,
  EXPERT_PHOTO_URL_QUERY_KEY,
} from "@/features/experts/hooks/useExpertProfile";

const STORAGE_KEY = "mj_expert_onboarding";
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Map specialty slug from API to LegalSpecialty enum value
function slugToEnum(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}

// Map LegalSpecialty enum value back to slug for API matching
function formatFileSize(fileOrSize: File | { size?: number } | number | undefined | null): string {
  if (!fileOrSize) return "";
  const size = typeof fileOrSize === "number" ? fileOrSize : (fileOrSize as any)?.size;
  if (typeof size !== "number" || isNaN(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function enumToSlug(enumVal: string): string {
  return enumVal.toLowerCase().replace(/_/g, "-");
}

// ISO 639-1 language codes (2 chars) - matches backend validation max 10 chars
const LANGUAGES = [
  { code: "rw", label: "Kinyarwanda" },
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "sw", label: "Swahili" },
];

type OnboardingData = {
  displayName: string;
  barNumber: string;
  yearsExperience: number | "";
  firmName: string;
  primarySpecialty: string;
  specialties: string[];
  bio: string;
  languages: string[];
  baseConsultationFee: number | "";
  officeAddress: string;
  city: string;
  // Location data
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    method?: string;
    placeId?: string;
    accuracy?: number;
  };
  // Photo data (deferred upload)
  photoFile?: File;
  previewPhotoUrl?: string;
  // Document data (deferred upload)
  identityFile?: File;
  barCertificateFile?: File;
  additionalFiles?: { file: File; label: string }[];
};

interface SavedProgress {
  currentStep: number;
  formData: OnboardingData;
  savedAt: number;
}

export function isRealFile(f: unknown): f is File {
  return typeof File !== "undefined" && f instanceof File && f.size > 0;
}

function saveProgress(currentStep: number, formData: OnboardingData) {
  try {
    const {
      photoFile,
      identityFile,
      barCertificateFile,
      additionalFiles,
      previewPhotoUrl,
      ...cleanFormData
    } = formData;

    // Transient blob URLs must not be persisted into localStorage
    const safePhotoUrl = previewPhotoUrl?.startsWith("blob:") ? undefined : previewPhotoUrl;

    const data: SavedProgress = {
      currentStep,
      formData: {
        ...cleanFormData,
        previewPhotoUrl: safePhotoUrl,
      },
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: SavedProgress = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > STORAGE_MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Clean out non-serializable properties or dead blob URLs that might exist from older sessions
    if (parsed.formData) {
      delete (parsed.formData as any).photoFile;
      delete (parsed.formData as any).identityFile;
      delete (parsed.formData as any).barCertificateFile;
      delete (parsed.formData as any).additionalFiles;
      if (parsed.formData.previewPhotoUrl?.startsWith("blob:")) {
        delete (parsed.formData as any).previewPhotoUrl;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently ignore
  }
}

export function ExpertOnboardingWizard({ fullName }: { fullName: string }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const t = useTranslations("features.experts");
  const tWizard = useTranslations("expertOnboarding");
  const tCommon = useTranslations("common");

  // Restore saved progress or start fresh.
  // Lazy useState initializer runs exactly once (unlike useRef(loadProgress()),
  // which read localStorage during every render).
  const [initialProgress] = useState(() => loadProgress());
  const [currentStep, setCurrentStep] = useState(initialProgress?.currentStep ?? 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  
  // Existing profile query to handle resuming onboarding
  const { data: existingProfile } = useExpertProfile();

  // Fetch onboarding progress from backend
  const { data: onboardingRes } = useQuery({
    queryKey: ["experts", "onboarding"],
    queryFn: async () => {
      return await apiFetch<{
        data: {
          currentStep: string;
          completedSteps: string[];
          completionPercentage: number;
          totalSteps: number;
          photoStatus: {
            hasPhoto: boolean;
            needsPhoto: boolean;
            urgency: 'low' | 'medium' | 'high';
            message: string;
          };
          draft?: {
            currentStep: number;
            formData: Partial<OnboardingData>;
            savedAt: number;
            completionPercentage: number;
          } | null;
        };
      }>("/experts/onboarding", { method: "GET" });
    },
    staleTime: 5 * 60 * 1000,
  });

  const onboardingData = onboardingRes?.data ?? null;

  // Fetch specialties dynamically from the API
  const { data: specialtiesRes, isLoading: specialtiesLoading } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const res = await apiFetch<{ data: Array<{ id: string; slug: string; label: string; group: string }> }>("/specialties");
      return res.data.map(s => ({
        value: slugToEnum(s.slug),
        label: s.label,
        group: s.group,
        slug: s.slug,
      }));
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const specialtyOptions = specialtiesRes ?? [];

  const defaultFormData: OnboardingData = {
    displayName: fullName,
    barNumber: "",
    yearsExperience: "",
    firmName: "",
    primarySpecialty: specialtyOptions.length > 0 ? specialtyOptions[0].value : "",
    specialties: [],
    bio: "",
    languages: ["en"],
    baseConsultationFee: "",
    officeAddress: "",
    city: "Kigali",
    location: undefined,
  };

  const [formData, setFormData] = useState<OnboardingData>(
    initialProgress?.formData ?? defaultFormData
  );

  // Prefill with existing profile data if resuming onboarding
  useEffect(() => {
    if (existingProfile && !initialProgress) {
      const prof = existingProfile as any;
      setFormData(prev => ({
        ...prev,
        displayName: prof.displayName || prof.name || prev.displayName,
        barNumber: prof.barNumber || prev.barNumber,
        yearsExperience: prof.yearsOfExperience ?? prev.yearsExperience,
        firmName: prof.firmName || prev.firmName,
        primarySpecialty: prof.primarySpecialty || (prof.specialties?.[0] ? slugToEnum(prof.specialties[0]) : prev.primarySpecialty),
        specialties: prof.specialties || prev.specialties,
        bio: prof.bio || prev.bio,
        languages: prof.languages?.length ? prof.languages : prev.languages,
        baseConsultationFee: prof.baseConsultationFee ?? prof.hourlyRate ?? prev.baseConsultationFee,
        officeAddress: prof.officeAddress || prev.officeAddress,
        city: prof.city || prev.city,
      }));
    }
  }, [existingProfile, initialProgress]);

  const totalSteps = 7;
  const hasHydratedFromServer = useRef(false);
  const lastSavedPayload = useRef<string>("");

  // Ensure default primarySpecialty is populated when specialtyOptions load
  useEffect(() => {
    if (specialtyOptions.length > 0) {
      setFormData(prev => {
        if (!prev.primarySpecialty) {
          return { ...prev, primarySpecialty: specialtyOptions[0].value };
        }
        return prev;
      });
    }
  }, [specialtyOptions]);

  // Restore from server draft if no local progress was found (runs once on mount)
  useEffect(() => {
    if (!initialProgress && onboardingData?.draft && !hasHydratedFromServer.current) {
      hasHydratedFromServer.current = true;
      const serverDraft = onboardingData.draft;
      if (typeof serverDraft.currentStep === "number") {
        setCurrentStep(Math.max(1, Math.min(totalSteps, serverDraft.currentStep)));
      }
      if (serverDraft.formData && typeof serverDraft.formData === "object") {
        const cleanServerData = { ...serverDraft.formData } as any;
        delete cleanServerData.photoFile;
        delete cleanServerData.identityFile;
        delete cleanServerData.barCertificateFile;
        delete cleanServerData.additionalFiles;
        if (typeof cleanServerData.previewPhotoUrl === "string" && cleanServerData.previewPhotoUrl.startsWith("blob:")) {
          delete cleanServerData.previewPhotoUrl;
        }
        setFormData(prev => ({
          ...prev,
          ...cleanServerData,
        }));
      }
    }
  }, [initialProgress, onboardingData?.draft, totalSteps]);

  // Auto-save to localStorage (fast) and cloud draft (debounced, without triggering refetch loops)
  useEffect(() => {
    // 1. Fast local save
    const localTimer = setTimeout(() => {
      saveProgress(currentStep, formData);
    }, 300);

    // 2. Debounced cloud draft sync (2 seconds) - only fires when payload actually changes
    const cloudTimer = setTimeout(() => {
      const {
        photoFile,
        identityFile,
        barCertificateFile,
        additionalFiles,
        previewPhotoUrl,
        ...serializableFormData
      } = formData;

      const payload = {
        currentStep,
        formData: serializableFormData,
        completionPercentage: Math.round((currentStep / totalSteps) * 100),
      };

      const payloadStr = JSON.stringify(payload);
      if (payloadStr === lastSavedPayload.current) {
        return;
      }
      lastSavedPayload.current = payloadStr;

      apiFetch("/experts/onboarding/draft", {
        method: "POST",
        body: payloadStr,
      }).catch(() => {
        // Silently ignore background cloud sync errors
      });
    }, 2000);

    return () => {
      clearTimeout(localTimer);
      clearTimeout(cloudTimer);
    };
  }, [currentStep, formData, totalSteps]);

  // Clear saved progress on successful backend confirmation
  useEffect(() => {
    if (onboardingData?.completionPercentage === 100) {
      clearProgress();
    }
  }, [onboardingData?.completionPercentage]);

  const topRef = useRef<HTMLDivElement>(null);

  // Auto-scroll smoothly to top whenever step advances or changes
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const steps = [
    { number: 1, title: tWizard("steps.profile"), icon: Scale, id: "profile" },
    { number: 2, title: tWizard("steps.services"), icon: Briefcase, id: "services" },
    { number: 3, title: tWizard("steps.location"), icon: MapPin, id: "location" },
    { number: 4, title: tWizard("steps.bio"), icon: FileText, id: "bio" },
    { number: 5, title: tWizard("steps.rates"), icon: LanguagesIcon, id: "rates" },
    { number: 6, title: tWizard("steps.photo"), icon: Camera, id: "photo" },
    { number: 7, title: tWizard("steps.documents"), icon: ShieldCheck, id: "documents" },
  ];

  const updateField = (field: keyof OnboardingData, value: OnboardingData[keyof OnboardingData] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "specialties" | "languages", item: string) => {
    const current = formData[field];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateField(field, updated);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.displayName.trim() && formData.barNumber.trim() && formData.yearsExperience !== "";
      case 2:
        return formData.primarySpecialty && specialtyOptions.length > 0;
      case 3:
        return formData.location || (formData.officeAddress.trim() && formData.city.trim());
      case 4:
        return formData.bio.trim().length >= 50;
      case 5:
        return formData.languages.length > 0 && formData.baseConsultationFee !== "";
      case 6:
        return true; // Photo is optional
      case 7:
        return true; // Documents are optional at this step (can submit later)
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      const fallbackSpecialty = formData.primarySpecialty || (specialtyOptions[0]?.value ?? "OTHER");
      const payload: CreateProfileDto = {
        displayName: formData.displayName.trim(),
        barNumber: formData.barNumber.trim(),
        yearsExperience: formData.yearsExperience !== "" ? Number(formData.yearsExperience) : undefined,
        firmName: formData.firmName.trim() || undefined,
        primarySpecialty: fallbackSpecialty as CreateProfileDto["primarySpecialty"],
        specialties: (formData.specialties && formData.specialties.length > 0) ? formData.specialties as CreateProfileDto["specialties"] : [fallbackSpecialty as any],
        bio: formData.bio.trim() || undefined,
        languages: formData.languages,
        officeAddress: formData.location?.address || formData.officeAddress.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: "Rwanda",
        baseConsultationFee: formData.baseConsultationFee !== "" ? Number(formData.baseConsultationFee) : undefined,
        currency: "RWF",
        // Add location coordinates if available
        ...(formData.location && {
          latitude: formData.location.latitude,
          longitude: formData.location.longitude,
        })
      };

      if (existingProfile) {
        await apiFetch('/experts/profile/me', {
          method: 'PATCH',
          body: payload,
        });
      } else {
        try {
          const response = await postExpertsProfile(payload);
          if (response.status !== 201) {
            throw new Error("Failed to create profile");
          }
        } catch (postErr: any) {
          if (postErr?.status === 409 || postErr?.message?.includes("already have an expert profile")) {
            await apiFetch('/experts/profile/me', {
              method: 'PATCH',
              body: payload,
            });
          } else {
            throw postErr;
          }
        }
      }

      // If they selected a photo, upload it NOW after profile creation
      if (isRealFile(formData.photoFile)) {
        try {
          const photoData = new FormData();
          photoData.append('photo', formData.photoFile);
          await apiFetch<{ data: { photoUrl: string } }>('/experts/photo/profile', {
            method: 'POST',
            body: photoData,
          });
          await queryClient.invalidateQueries({ queryKey: EXPERT_PROFILE_QUERY_KEY });
          await queryClient.invalidateQueries({ queryKey: EXPERT_PHOTO_URL_QUERY_KEY });
          await updateSession();
        } catch (photoError) {
          toast.error(t("profileCreatedPhotoFailed"));
        }
      }

      // If they attached verification documents, submit them now
      const validAdditionalFiles = (formData.additionalFiles || []).filter(f => isRealFile(f?.file));
      const hasVerificationDocs = isRealFile(formData.identityFile) || isRealFile(formData.barCertificateFile) || validAdditionalFiles.length > 0;

      if (hasVerificationDocs) {
        try {
          const verificationData = new FormData();
          const docTypes: string[] = [];
          const docLabels: string[] = [];

          if (isRealFile(formData.identityFile)) {
            verificationData.append('files', formData.identityFile);
            docTypes.push('identity_document');
            docLabels.push('National ID / Passport');
          }
          if (isRealFile(formData.barCertificateFile)) {
            verificationData.append('files', formData.barCertificateFile);
            docTypes.push('bar_certificate');
            docLabels.push('Bar Association Certificate');
          }
          validAdditionalFiles.forEach(fileObj => {
            verificationData.append('files', fileObj.file);
            docTypes.push('additional');
            docLabels.push(fileObj.label || 'Additional Document');
          });
          
          docTypes.forEach(t => verificationData.append('documentTypes[]', t));
          docLabels.forEach(l => verificationData.append('documentLabels[]', l));
          await apiFetch('/experts/verification/submit', {
            method: 'POST',
            body: verificationData,
          });
          toast.success(t("verificationSubmitted"));
        } catch (verifyError) {
          console.error("Verification submission failed:", verifyError);
          toast.error(t("verificationUploadFailed"));
        }
      }

      toast.success(t("profileCreated"));
      clearProgress();
      apiFetch("/experts/onboarding/draft", { method: "DELETE" }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["experts", "onboarding"] });
      queryClient.invalidateQueries({ queryKey: EXPERT_PROFILE_QUERY_KEY });
      router.push("/expert/dashboard");
    } catch (error: any) {
      console.error("Profile submission error:", error);
      const errorMessage = error?.message || (error?.error && typeof error.error === 'string' ? error.error : null);
      toast.error(errorMessage || t("profileCreateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setFormData(prev => ({ ...prev, photoFile: file, previewPhotoUrl: URL.createObjectURL(file) }));
    toast.success(t("photoSelected"));
    return Promise.resolve();
  };

  return (
    <div ref={topRef} className="min-h-full bg-slate-50/60 dark:bg-background">
      {/* Professional Onboarding Header */}
      <ExpertOnboardingHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        completionPercentage={Math.round((currentStep / totalSteps) * 100)}
        expertName={fullName}
      />

      {/* Step Progress Indicator */}
      <StepProgress 
        steps={steps.map(step => ({
          id: step.id,
          title: step.title,
          completed: currentStep > step.number,
          active: currentStep === step.number
        }))}
        onStepClick={(stepNumber) => setCurrentStep(stepNumber)}
      />

      {/* Content */}
      <div className="mx-auto max-w-2xl px-2.5 py-3 sm:px-6 sm:py-8 lg:py-10">
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-6 lg:p-8 shadow-xs">
          {/* Step 1: Professional Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">{tWizard("step1.title")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                  {tWizard("step1.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">{tWizard("step1.displayName")}</Label>
                  <Input
                    id="displayName"
                    placeholder={tWizard("step1.displayNamePlaceholder")}
                    value={formData.displayName}
                    onChange={(e) => updateField("displayName", e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                    {tWizard("step1.displayNameHint")}
                  </p>
                </div>

                <div>
                  <Label htmlFor="barNumber">{tWizard("step1.barNumber")}</Label>
                  <Input
                    id="barNumber"
                    placeholder={tWizard("step1.barNumberPlaceholder")}
                    value={formData.barNumber}
                    onChange={(e) => updateField("barNumber", e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                    {tWizard("step1.barNumberHint")}
                  </p>
                </div>

                <div>
                  <Label htmlFor="yearsExperience">{tWizard("step1.yearsExperience")}</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    max="60"
                    placeholder={tWizard("step1.yearsExperiencePlaceholder")}
                    value={formData.yearsExperience}
                    onChange={(e) => updateField("yearsExperience", e.target.value ? Number(e.target.value) : "")}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                    {tWizard("step1.yearsExperienceHint")}
                  </p>
                </div>

                <div>
                  <Label htmlFor="firmName">
                    {tWizard("step1.firmName")} <span className="text-slate-400 dark:text-muted-foreground">{tWizard("step1.optional")}</span>
                  </Label>
                  <Input
                    id="firmName"
                    placeholder={tWizard("step1.firmNamePlaceholder")}
                    value={formData.firmName}
                    onChange={(e) => updateField("firmName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>{tWizard("step1.verificationNoticeStrong")}</strong> {tWizard("step1.verificationNotice")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Practice Areas */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">{tWizard("step2.title")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                  {tWizard("step2.subtitle")}
                </p>
              </div>

              {specialtiesLoading ? (
                <div className="space-y-4">
                  <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-muted" />
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-muted" />
                    ))}
                  </div>
                </div>
              ) : specialtyOptions.length === 0 ? (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    {tWizard("step2.specialtiesLoading")}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="primarySpecialty">{tWizard("step2.primarySpecialty")}</Label>
                    <select
                      id="primarySpecialty"
                      value={formData.primarySpecialty}
                      onChange={(e) => updateField("primarySpecialty", e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-card px-3 text-sm text-slate-900 dark:text-foreground"
                    >
                      {specialtyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                      {tWizard("step2.primarySpecialtyHint")}
                    </p>
                  </div>

                  <div>
                    <Label>{tWizard("step2.additionalSpecialties")} <span className="text-slate-400 dark:text-muted-foreground">{tWizard("step1.optional")}</span></Label>
                    <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground mb-3">
                      {tWizard("step2.additionalSpecialtiesHint")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {specialtyOptions.map((opt) => {
                        const selected = formData.specialties.includes(opt.value);
                        const isPrimary = formData.primarySpecialty === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => !isPrimary && toggleArrayItem("specialties", opt.value)}
                            disabled={isPrimary}
                            className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                              isPrimary
                                ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 opacity-50 cursor-not-allowed"
                                : selected
                                ? "border-brand-blue bg-blue-50 dark:bg-blue-950/40"
                                : "border-slate-200 dark:border-border bg-white dark:bg-card hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                selected
                                  ? "border-brand-blue bg-brand-blue"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-card"
                              }`}
                            >
                              {selected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                selected ? "text-brand-blue" : "text-slate-700"
                              }`}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-muted-foreground">
                      {tWizard("step2.selectedAreas", { count: formData.specialties.length })}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Office Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">{tWizard("step3.title")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                  {tWizard("step3.subtitle")}
                </p>
              </div>

              <div>
                <FreeLocationInput
                  value={formData.location}
                  onChange={(location) => {
                    updateField("location", location);
                    if (location?.address) {
                      updateField("officeAddress", location.address);
                    }
                  }}
                  required={false}
                />
              </div>

              {/* Fallback manual address if location input is not used */}
              {!formData.location && (
                <div className="mt-6 space-y-4 border-t border-slate-200 dark:border-border pt-6">
                  <div>
                    <Label htmlFor="officeAddressFallback">
                      {tWizard("step3.officeAddressFallback")} <span className="text-slate-400 dark:text-muted-foreground">{tWizard("step3.alternative")}</span>
                    </Label>
                    <Input
                      id="officeAddressFallback"
                      placeholder={tWizard("step3.officeAddressPlaceholder")}
                      value={formData.officeAddress}
                      onChange={(e) => updateField("officeAddress", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cityFallback">
                      {tWizard("step3.cityFallback")} <span className="text-slate-400 dark:text-muted-foreground">{tWizard("step3.alternative")}</span>
                    </Label>
                    <Input
                      id="cityFallback"
                      placeholder={tWizard("step3.cityPlaceholder")}
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>{tWizard("step3.whyLocationStrong")}</strong> {tWizard("step3.whyLocation")}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Profile & Bio */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">{tWizard("step4.title")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                  {tWizard("step4.subtitle")}
                </p>
              </div>

              <div>
                <Label htmlFor="bio">{tWizard("step4.bioLabel")}</Label>
                <Textarea
                  id="bio"
                  rows={8}
                  placeholder={tWizard("step4.bioPlaceholder")}
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                  {tWizard("step4.bioMinLength", { count: formData.bio.length })}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>{tWizard("step4.bioTipStrong")}</strong> {tWizard("step4.bioTip")}
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Languages & Rates */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">{tWizard("step5.title")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                  {tWizard("step5.subtitle")}
                </p>
              </div>

              <div>
                <Label>{tWizard("step5.languagesLabel")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => {
                    const selected = formData.languages.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleArrayItem("languages", lang.code)}
                        className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                          selected
                            ? "border-brand-blue bg-brand-blue text-white"
                            : "border-slate-300 dark:border-border bg-white dark:bg-card text-slate-700 dark:text-foreground hover:border-slate-400 dark:hover:border-slate-600"
                        }`}
                      >
                        {tCommon(`languages.${lang.code}` as any) || lang.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                  {tWizard("step5.selectedLanguages", {
                    languages: formData.languages.map(code => tCommon(`languages.${code}` as any) || LANGUAGES.find(l => l.code === code)?.label || code).join(", ")
                  })}
                </p>
              </div>

              <div>
                <Label htmlFor="baseConsultationFee">{tWizard("step5.feeLabel")}</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-500 dark:text-muted-foreground">
                    RWF
                  </span>
                  <Input
                    id="baseConsultationFee"
                    type="number"
                    min="5000"
                    step="1000"
                    placeholder="50000"
                    value={formData.baseConsultationFee}
                    onChange={(e) => updateField("baseConsultationFee", e.target.value ? Number(e.target.value) : "")}
                    className="pl-14"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                  {tWizard("step5.feeHint")}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>{tWizard("step5.feeNoteStrong")}</strong> {tWizard("step5.feeNote")}
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Profile Photo (optional) */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">{tWizard("step6.title")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                  {tWizard("step6.subtitle")}
                </p>
              </div>

              <ProfilePhotoUpload
                currentPhotoUrl={formData.previewPhotoUrl ?? undefined}
                onPhotoUpload={handlePhotoUpload}
                isUploading={isPhotoUploading}
              />

              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>{tWizard("step6.photoOptionalStrong")}</strong> {tWizard("step6.photoOptional")}
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Verification Documents (optional) */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">{tWizard("step7.title")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                  {tWizard("step7.subtitle")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>{tWizard("step7.identityLabel")}</span>
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                      {tWizard("step7.requiredForVerification")}
                    </span>
                  </Label>
                  {isRealFile(formData.identityFile) ? (
                    <div className="flex items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-3">
                      <FileText className="h-8 w-8 shrink-0 text-blue-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{formData.identityFile.name}</p>
                        {formatFileSize(formData.identityFile) ? (
                          <p className="text-xs text-slate-500 dark:text-muted-foreground">{formatFileSize(formData.identityFile)}</p>
                        ) : null}
                      </div>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, identityFile: undefined }))} className="rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-950/50 cursor-pointer">
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-border p-6 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all h-full justify-center">
                      <Upload className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
                      <span className="text-xs text-slate-500 dark:text-muted-foreground text-center"><span className="font-semibold text-blue-600 dark:text-blue-400">{tWizard("step7.uploadPrompt")}</span> {tWizard("step7.uploadPromptDrag")}</span>
                      <span className="text-[11px] text-slate-400 dark:text-muted-foreground">{tWizard("step7.uploadLimit")}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData(prev => ({ ...prev, identityFile: f })); e.target.value = ""; }} />
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>{tWizard("step7.barCertificateLabel")}</span>
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                      {tWizard("step7.requiredForVerification")}
                    </span>
                  </Label>
                  {isRealFile(formData.barCertificateFile) ? (
                    <div className="flex items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-3">
                      <FileText className="h-8 w-8 shrink-0 text-red-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{formData.barCertificateFile.name}</p>
                        {formatFileSize(formData.barCertificateFile) ? (
                          <p className="text-xs text-slate-500 dark:text-muted-foreground">{formatFileSize(formData.barCertificateFile)}</p>
                        ) : null}
                      </div>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, barCertificateFile: undefined }))} className="rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-950/50 cursor-pointer">
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-border p-6 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all h-full justify-center">
                      <Upload className="h-8 w-8 text-slate-400 dark:text-muted-foreground" />
                      <span className="text-xs text-slate-500 dark:text-muted-foreground text-center"><span className="font-semibold text-blue-600 dark:text-blue-400">{tWizard("step7.uploadPrompt")}</span> {tWizard("step7.uploadPromptDrag")}</span>
                      <span className="text-[11px] text-slate-400 dark:text-muted-foreground">{tWizard("step7.uploadLimit")}</span>
                      <input type="file" accept="image/*,.pdf" className="sr-only"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData(prev => ({ ...prev, barCertificateFile: f })); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              </div>

              {/* Additional Documents Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-border">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground">{tWizard("step7.additionalDocsTitle")} <span className="text-slate-400 dark:text-muted-foreground font-normal text-sm">{tWizard("step1.optional")}</span></h3>
                  <p className="text-sm text-slate-600 dark:text-muted-foreground">{tWizard("step7.additionalDocsSubtitle")}</p>
                </div>

                {formData.additionalFiles && formData.additionalFiles.filter(fileObj => isRealFile(fileObj?.file)).length > 0 && (
                  <div className="space-y-3">
                    {formData.additionalFiles.filter(fileObj => isRealFile(fileObj?.file)).map((fileObj, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card p-3 shadow-sm">
                        <FileText className="h-6 w-6 shrink-0 text-slate-400 dark:text-muted-foreground" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {fileObj.file.name}
                            {formatFileSize(fileObj.file) ? (
                              <span className="font-normal text-slate-500 dark:text-muted-foreground ml-1">({formatFileSize(fileObj.file)})</span>
                            ) : null}
                          </p>
                          <Input 
                            size={1}
                            className="h-7 text-xs" 
                            placeholder={tWizard("step7.documentLabelPlaceholder")} 
                            value={fileObj.label} 
                            onChange={(e) => {
                              const newFiles = [...(formData.additionalFiles || [])];
                              newFiles[idx] = { ...newFiles[idx], label: e.target.value };
                              setFormData(prev => ({ ...prev, additionalFiles: newFiles }));
                            }} 
                          />
                        </div>
                        <button type="button" onClick={() => {
                          const newFiles = [...(formData.additionalFiles || [])];
                          newFiles.splice(idx, 1);
                          setFormData(prev => ({ ...prev, additionalFiles: newFiles }));
                        }} className="rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-950/50 mt-4 cursor-pointer">
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(!formData.additionalFiles || formData.additionalFiles.filter(f => isRealFile(f?.file)).length < 5) && (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-border py-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                    <Upload className="h-5 w-5 text-slate-400 dark:text-muted-foreground" />
                    <span className="text-sm text-slate-600 dark:text-muted-foreground"><span className="font-semibold text-blue-600 dark:text-blue-400">{tWizard("step7.addDocument")}</span> {tWizard("step7.fileFormats")}</span>
                    <input type="file" accept="image/*,.pdf" className="sr-only" multiple
                      onChange={(e) => { 
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        
                        setFormData(prev => {
                          const current = prev.additionalFiles || [];
                          const spaceLeft = 5 - current.length;
                          const toAdd = files.slice(0, spaceLeft).map(f => ({ file: f, label: f.name.split('.')[0] }));
                          return { ...prev, additionalFiles: [...current, ...toAdd] };
                        });
                        e.target.value = ""; 
                      }} />
                  </label>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 mt-6">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>{tWizard("step7.docsOptionalStrong")}</strong> {tWizard("step7.docsOptional")}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-t border-border pt-4 sm:pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 1}
              className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl min-w-[70px] cursor-pointer"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              {tWizard("nav.back")}
            </Button>

            <div className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap order-last xs:order-none w-full xs:w-auto text-center py-0.5 xs:py-0">
              {tWizard("nav.stepOf", { current: currentStep, total: totalSteps })}
            </div>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold bg-brand-dark text-on-brand rounded-xl shadow-xs hover:opacity-90 transition-opacity min-w-[95px] cursor-pointer"
              >
                <span>{tWizard("nav.continue")}</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs hover:opacity-90 transition-opacity bg-emerald-600 hover:bg-emerald-700 min-w-[120px] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {tWizard("nav.submitting")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {isRealFile(formData.identityFile) || isRealFile(formData.barCertificateFile)
                      ? tWizard("nav.completeAndVerify")
                      : tWizard("nav.completeSetupVerifyLater")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
