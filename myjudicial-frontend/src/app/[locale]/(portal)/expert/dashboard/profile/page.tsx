"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import {
  User, Palette, Loader2, Save, Globe, AlertTriangle,
  Pencil, X, Check, Building2, BookOpen,
  MapPin, DollarSign, BadgeCheck, Briefcase, Hash, Languages,
  FileText, Sun, Moon, Laptop, ShieldCheck, ArrowUpRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { usePatchAuthMe, UpdateMeDtoPreferredLanguage } from "@/api/generated";
import {
  getExpertsProfileMe,
  patchExpertsProfileMe,
  postExpertsProfile,
} from "@/api/generated";
import type {
  PatchExpertsProfileMeBody,
  CreateProfileDto,
} from "@/api/generated";
import type { ExpertProfile } from "@/features/experts/types";
import { LegalSpecialty, LEGAL_SPECIALTY_LABELS, EXPERT_STATUS_CONFIG } from "@/features/experts/types";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { ExpertPhotoUploader } from "@/shared/components/photo-upload";
import { useAuth } from "@/providers/auth-provider";
import { EXPERT_PHOTO_URL_QUERY_KEY, useExpertPhotoUrl } from "@/features/experts/hooks/useExpertProfile";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/shared/components/dashboard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type TabId = "profile" | "preferences";

const TABS: { id: TabId; icon: React.ElementType }[] = [
  { id: "profile", icon: User },
  { id: "preferences", icon: Palette },
];

type ProfileFormData = {
  displayName: string;
  bio: string;
  firmName: string;
  barNumber: string;
  yearsExperience: number;
  primarySpecialty: LegalSpecialty;
  specialties: LegalSpecialty[];
  languages: string;
  officeAddress: string;
  city: string;
  country: string;
  baseConsultationFee: number;
  currency: string;
};

function emptyForm(name: string): ProfileFormData {
  return {
    displayName: name,
    bio: "",
    firmName: "",
    barNumber: "",
    yearsExperience: 0,
    primarySpecialty: LegalSpecialty.OTHER,
    specialties: [],
    languages: "",
    officeAddress: "",
    city: "",
    country: "Rwanda",
    baseConsultationFee: 0,
    currency: "RWF",
  };
}

function formatApiError(err: Error, fallback: string): string {
  const errors = (err as Error & { errors?: string[] }).errors;
  if (errors?.length) return errors.join(" ");
  return err.message || fallback;
}

function profileToForm(profile: ExpertProfile): ProfileFormData {
  return {
    displayName: profile.displayName || "",
    bio: profile.bio || "",
    firmName: profile.firmName || "",
    barNumber: profile.barNumber || "",
    yearsExperience: profile.yearsExperience || 0,
    primarySpecialty: profile.primarySpecialty || LegalSpecialty.OTHER,
    specialties: profile.specialties || [],
    languages: (profile.languages || []).join(", "),
    officeAddress: profile.officeAddress || "",
    city: profile.city || "",
    country: profile.country || "Rwanda",
    // baseConsultationFee is a Prisma Decimal column — serializes as a string over JSON
    baseConsultationFee: Number(profile.baseConsultationFee) || 0,
    currency: profile.currency || "RWF",
  };
}

function getInitials(first: string, last: string) {
  return (first[0] + last[0]).toUpperCase();
}

export default function ExpertProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const patchAuthMe = usePatchAuthMe();
  const { refreshUser } = useAuth();
  const t = useTranslations("expertDashboard_profile");
  const tSidebar = useTranslations("shared.sidebar");
  const locale = useLocale();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  /* Profile tab state */
  const [editing, setEditing] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [form, setForm] = useState<ProfileFormData>(emptyForm(""));

  /* Photo state — track the confirmed URL after upload */
  const [confirmedPhotoUrl, setConfirmedPhotoUrl] = useState<string | null>(null);

  // Fetch signed URL on load so photo shows without needing to upload again
  const { data: signedPhotoUrl } = useExpertPhotoUrl();
  const displayPhotoUrl = confirmedPhotoUrl ?? signedPhotoUrl ?? null;

  /* Preferences tab state */
  const [language, setLanguage] = useState<keyof typeof UpdateMeDtoPreferredLanguage>("en");

  /* Notification preferences */
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifsError, setNotifsError] = useState<string | null>(null);

  const sessionName = session?.user?.name || "";
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  /* Callback fired by ExpertPhotoUploader after a successful upload */
  const handlePhotoSuccess = useCallback(async (newUrl: string) => {
    setConfirmedPhotoUrl(newUrl);
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: ["expert-profile"] });
    queryClient.invalidateQueries({ queryKey: ["experts", "onboarding"] });
    // Invalidate signed URL cache so sidebar re-fetches the new photo
    queryClient.invalidateQueries({ queryKey: EXPERT_PHOTO_URL_QUERY_KEY });
  }, [refreshUser, queryClient]);

  /* Expert profile */
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["expert-profile"],
    queryFn: async () => {
      const response = await getExpertsProfileMe();
      if (response.status === 200) return response.data.data as unknown as ExpertProfile;
      throw new Error("Failed to fetch profile");
    },
    enabled: !!accessToken,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const body: PatchExpertsProfileMeBody = {
        displayName: data.displayName,
        bio: data.bio || undefined,
        firmName: data.firmName || undefined,
        barNumber: data.barNumber,
        yearsExperience: data.yearsExperience || undefined,
        primarySpecialty: data.primarySpecialty,
        specialties: data.specialties,
        languages: data.languages.split(",").map((l) => l.trim()).filter(Boolean),
        officeAddress: data.officeAddress || undefined,
        city: data.city || undefined,
        country: data.country,
        baseConsultationFee: data.baseConsultationFee || undefined,
        currency: data.currency,
      };
      const response = await patchExpertsProfileMe(body);
      if (response.status === 200) return response.data.data as unknown as ExpertProfile;
      throw new Error("Failed to update profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-profile"] });
      setEditing(false);
      setIsNewProfile(false);
      toast.success(t("profileUpdatedSuccess"));
    },
    onError: (err: Error) => {
      toast.error(formatApiError(err, t("failedUpdateProfile")));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const body: CreateProfileDto = {
        displayName: data.displayName,
        bio: data.bio || undefined,
        firmName: data.firmName || undefined,
        barNumber: data.barNumber,
        yearsExperience: data.yearsExperience || undefined,
        primarySpecialty: data.primarySpecialty,
        specialties: data.specialties,
        languages: data.languages.split(",").map((l) => l.trim()).filter(Boolean),
        officeAddress: data.officeAddress || undefined,
        city: data.city || undefined,
        country: data.country,
        baseConsultationFee: data.baseConsultationFee || undefined,
        currency: data.currency,
      };
      const response = await postExpertsProfile(body);
      if (response.status === 201) return response.data.data as unknown as ExpertProfile;
      throw new Error("Failed to create profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-profile"] });
      setEditing(false);
      setIsNewProfile(false);
      toast.success(t("profileCreatedSuccess"));
    },
    onError: (err: Error) => {
      toast.error(formatApiError(err, t("failedCreateProfile")));
    },
  });

  useEffect(() => {
    if (profile && !editing) {
      setForm(profileToForm(profile));
    }
  }, [profile, editing]);

  /* Sync language from session */
  useEffect(() => {
    const lang = (session?.user as any)?.preferredLanguage as keyof typeof UpdateMeDtoPreferredLanguage | undefined;
    if (lang) setLanguage(lang);
  }, [session]);

  /* Hash-based tab navigation & security redirect */
  useEffect(() => {
    const rawHash = window.location.hash.replace("#", "");
    if (rawHash === "security" || rawHash === "account") {
      router.replace("/expert/dashboard/security");
    } else if (rawHash === "preferences") {
      setActiveTab("preferences");
    } else {
      setActiveTab("profile");
    }
  }, [router]);

  useEffect(() => {
    const onHashChange = () => {
      const rawHash = window.location.hash.replace("#", "");
      if (rawHash === "security" || rawHash === "account") {
        router.replace("/expert/dashboard/security");
      } else if (rawHash === "preferences") {
        setActiveTab("preferences");
      } else {
        setActiveTab("profile");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [router]);

  const handleTabClick = useCallback(
    (tabId: TabId) => {
      setActiveTab(tabId);
      setTimeout(() => {
        router.replace(`/expert/dashboard/profile#${tabId}`, { scroll: false });
      }, 0);
    },
    [router],
  );

  const statusConfig = profile ? EXPERT_STATUS_CONFIG[profile.status] : null;
  const busy = saveMutation.isPending || createMutation.isPending;

  /* ── Profile Tab Actions ── */
  function startEditing() {
    if (profile) setForm(profileToForm(profile));
    setEditing(true);
  }

  function cancelEditing() {
    if (profile) {
      setForm(profileToForm(profile));
    }
    setEditing(false);
    setIsNewProfile(false);
  }

  function handleSaveProfile() {
    if (isNewProfile) {
      createMutation.mutate(form);
    } else {
      saveMutation.mutate(form);
    }
  }

  function handleCreateProfile() {
    setForm(emptyForm(sessionName));
    setIsNewProfile(true);
    setEditing(true);
  }

  /* ── Preferences Tab Actions ── */
  const handleLanguageChange = async (newLang: keyof typeof UpdateMeDtoPreferredLanguage) => {
    setLanguage(newLang);
    try {
      await patchAuthMe.mutateAsync({ data: { preferredLanguage: newLang } });
      toast.success(t("languageSaved"));
      router.replace(pathname, { locale: newLang });
    } catch {
      toast.error(t("failedSaveLanguage"));
    }
  };

  const fetchNotifPrefs = useCallback(async () => {
    setLoadingNotifs(true);
    setNotifsError(null);
    try {
      const res: any = await apiFetch("/auth/me/notification-preferences");
      const prefs = res.data?.data ?? res.data ?? {};
      setNotifEmail(prefs.email ?? true);
      setNotifPush(prefs.push ?? true);
      setNotifInApp(prefs.inApp ?? true);
    } catch {
      setNotifsError(null);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "preferences") {
      fetchNotifPrefs();
    }
  }, [activeTab, fetchNotifPrefs]);

  const handleSaveNotifPrefs = async () => {
    setSavingNotifs(true);
    setNotifsError(null);
    try {
      await apiFetch("/auth/me/notification-preferences", {
        method: "PUT",
        body: { email: notifEmail, push: notifPush, inApp: notifInApp },
      });
      toast.success(t("notifsSaved"));
    } catch {
      setNotifsError(t("failedSaveNotifs"));
    } finally {
      setSavingNotifs(false);
    }
  };

  const initials = profile?.displayName
    ? profile.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : isNewProfile && form.displayName
      ? form.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : sessionName
        ? sessionName[0].toUpperCase()
        : "?";

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader title={t("profileTitle")} description={t("profileSubtitle")} />

      {/* Name + role banner */}
      <div className="flex flex-col min-[380px]:flex-row items-center gap-4 rounded-xl border border-border bg-card p-3.5 min-[360px]:p-5 shadow-sm min-w-0 text-center min-[380px]:text-left">
        <ExpertPhotoUploader
          currentImageUrl={displayPhotoUrl}
          userName={profile?.displayName || session?.user?.name || "?"}
          size="md"
          onSuccess={handlePhotoSuccess}
        />
        <div className="min-w-0 w-full min-[380px]:w-auto">
          <p className="text-base font-semibold text-foreground break-words">
            {profile?.displayName || session?.user?.name || t("defaultExpertName")}
          </p>
          <div className="flex flex-wrap items-center justify-center min-[380px]:justify-start gap-1.5 mt-0.5">
            <p className="text-xs min-[360px]:text-sm text-muted-foreground break-all select-all">{session?.user?.email}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Check size={11} className="stroke-[2.5]" />
              Verified
            </span>
          </div>
          <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
            {t("expertBadge")}
          </span>
        </div>
      </div>

      {/* 2 Canonical Tabs: Profile & Preferences */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-card/50"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span>{(t as any)(`tabs.${id}`)}</span>
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Skeleton className="h-64 rounded-xl lg:col-span-1" />
                <Skeleton className="h-96 rounded-xl lg:col-span-2" />
              </div>
            </div>
          ) : error ? (
            error instanceof Error && error.message.toLowerCase().includes("not found") ? (
              <EmptyState
                icon={User}
                title={t("createProfilePrompt")}
                action={<Button onClick={handleCreateProfile}>{t("createProfileBtn")}</Button>}
              />
            ) : (
              <ErrorState
                message={t("failedLoadProfile")}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ["expert-profile"] })}
                retryLabel={t("retryBtn")}
              />
            )
          ) : (
            <>
              {statusConfig && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                    {profile?.statusMessage && (
                      <p className="text-sm text-muted-foreground">{profile.statusMessage}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
                  <div className="flex flex-col items-center">
                    <div className="mb-4">
                      <ExpertPhotoUploader
                        currentImageUrl={displayPhotoUrl}
                        userName={profile?.displayName || session?.user?.name || "?"}
                        size="lg"
                        onSuccess={handlePhotoSuccess}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <h2 className="text-center text-lg font-bold text-foreground">
                        {editing ? form.displayName || t("unnamed") : profile?.displayName || t("unnamed")}
                      </h2>
                      {!editing && profile?.status === "VERIFIED" && (
                        <StatusBadge tone="active" dot={false} title={t("verifiedExpert")} className="px-1.5 py-0.5">
                          <Check size={12} className="stroke-[3]" />
                        </StatusBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-sm text-muted-foreground">{session?.user?.email || ""}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check size={10} className="stroke-[2.5]" />
                        Verified
                      </span>
                    </div>
                    {!editing && profile?.user?.phone && (
                      <p className="text-sm text-muted-foreground">{profile.user.phone}</p>
                    )}
                    {!editing && profile && (
                      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                        {profile.specialties?.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {LEGAL_SPECIALTY_LABELS[s] || s}
                          </Badge>
                        ))}
                        {(profile.specialties?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border px-4 sm:px-5 py-4">
                    <div>
                      <h2 className="text-base font-bold text-foreground">{t("professionalDetailsTitle")}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {editing ? t("editProfessionalDetailsDesc") : t("professionalDetailsDesc")}
                      </p>
                    </div>
                    {editing ? (
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button variant="ghost" onClick={cancelEditing} disabled={busy} className="flex-1 sm:flex-none">
                          <X size={14} className="mr-1.5" />
                          {t("cancelBtn")}
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={busy} className="flex-1 sm:flex-none">
                          {busy ? (
                            <Loader2 size={14} className="mr-1.5 animate-spin" />
                          ) : (
                            <Check size={14} className="mr-1.5" />
                          )}
                          {busy ? t("savingBtn") : isNewProfile ? t("createProfileBtn") : t("saveChangesBtn")}
                        </Button>
                      </div>
                    ) : profile ? (
                      <Button variant="outline" onClick={startEditing} className="w-full sm:w-auto">
                        <Pencil size={14} className="mr-1.5" />
                        {t("editProfileBtn")}
                      </Button>
                    ) : null}
                  </div>
                  <div className="p-4 sm:p-5">
                    {editing ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="displayName">{t("displayNameLabel")} *</Label>
                            <Input
                              id="displayName"
                              value={form.displayName}
                              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="firmName">{t("firmNameLabel")}</Label>
                            <Input
                              id="firmName"
                              value={form.firmName}
                              onChange={(e) => setForm((f) => ({ ...f, firmName: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="bio">{t("bioLabel")}</Label>
                          <Textarea
                            id="bio"
                            value={form.bio}
                            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="barNumber">{t("barNumberLabel")} *</Label>
                            <Input
                              id="barNumber"
                              value={form.barNumber}
                              onChange={(e) => setForm((f) => ({ ...f, barNumber: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="yearsExperience">{t("yearsExperienceLabel")}</Label>
                            <Input
                              id="yearsExperience"
                              type="number"
                              min={0}
                              max={60}
                              value={form.yearsExperience || ""}
                              onChange={(e) => setForm((f) => ({ ...f, yearsExperience: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="primarySpecialty">{t("primarySpecialtyLabel")} *</Label>
                            <Select
                              value={form.primarySpecialty}
                              onValueChange={(v) => setForm((f) => ({ ...f, primarySpecialty: v as LegalSpecialty }))}
                            >
                              <SelectTrigger id="primarySpecialty" className="w-full">
                                <SelectValue placeholder={t("selectSpecialtyPlaceholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(LEGAL_SPECIALTY_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="currency">{t("currencyLabel")}</Label>
                            <Select
                              value={form.currency}
                              onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                            >
                              <SelectTrigger id="currency" className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RWF">RWF</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label>{t("additionalSpecialtiesLabel")}</Label>
                          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border border-border p-3">
                            {Object.entries(LEGAL_SPECIALTY_LABELS).map(([value, label]) => {
                              const checked = form.specialties.includes(value as LegalSpecialty);
                              return (
                                <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) =>
                                      setForm((f) => ({
                                        ...f,
                                        specialties: e.target.checked
                                          ? [...f.specialties, value as LegalSpecialty]
                                          : f.specialties.filter((s) => s !== value),
                                      }))
                                    }
                                  />
                                  {label}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="baseConsultationFee">{t("consultationFeeLabel")}</Label>
                            <Input
                              id="baseConsultationFee"
                              type="number"
                              min={0}
                              value={form.baseConsultationFee || ""}
                              onChange={(e) => setForm((f) => ({ ...f, baseConsultationFee: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="languages">{t("languagesCodesLabel")}</Label>
                            <Input
                              id="languages"
                              value={form.languages}
                              onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                              placeholder={t("languagesPlaceholder")}
                            />
                            <p className="text-xs text-muted-foreground">
                              {t("languagesHelperText")}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="city">{t("cityLabel")}</Label>
                            <Input
                              id="city"
                              value={form.city}
                              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="country">{t("countryLabel")}</Label>
                            <Input
                              id="country"
                              value={form.country}
                              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="officeAddress">{t("officeAddressLabel")}</Label>
                          <Input
                            id="officeAddress"
                            value={form.officeAddress}
                            onChange={(e) => setForm((f) => ({ ...f, officeAddress: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : profile ? (
                      <div className="divide-y divide-border">
                        <FieldRow icon={User} label={t("displayNameField")} value={profile.displayName || "—"} />
                        <FieldRow icon={FileText} label={t("bioField")} value={profile.bio || "—"} />
                        <FieldRowWithIcon icon={Building2} label={t("firmField")} value={profile.firmName || "—"} />
                        <FieldRow icon={Hash} label={t("barNumberField")} value={profile.barNumber || "—"} />
                        <FieldRow icon={Briefcase} label={t("yearsExperienceField")} value={profile.yearsExperience != null ? String(profile.yearsExperience) : "—"} />
                        <FieldRow icon={BookOpen} label={t("primarySpecialtyField")} value={LEGAL_SPECIALTY_LABELS[profile.primarySpecialty] || profile.primarySpecialty || "—"} />
                        <FieldRowWithIcon icon={BadgeCheck} label={t("specialtiesField")}>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {profile.specialties?.length ? (
                              profile.specialties.map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs">
                                  {LEGAL_SPECIALTY_LABELS[s] || s}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </FieldRowWithIcon>
                        <FieldRow icon={Languages} label={t("languagesField")} value={profile.languages?.join(", ") || "—"} />
                        <FieldRow icon={MapPin} label={t("officeAddressField")} value={profile.officeAddress || "—"} />
                        <FieldRowWithIcon icon={Globe} label={t("locationField")} value={[profile.city, profile.country].filter(Boolean).join(", ") || "—"} />
                        <FieldRow icon={DollarSign} label={t("consultationFeeField")} value={profile.baseConsultationFee != null ? `${profile.baseConsultationFee.toLocaleString()} ${profile.currency}` : "—"} />
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        {t("noProfileData")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Settings Callout */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{tSidebar("security")}</p>
                    <p className="text-xs text-muted-foreground">{t("profileSubtitle")}</p>
                  </div>
                </div>
                <Link
                  href="/expert/dashboard/security"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <span>{tSidebar("security")}</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Preferences Tab ── */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          {/* Visual Theme Selector */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-foreground">{t("appearanceTitle")}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t("appearanceDesc")}</p>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Laptop },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 sm:p-4 text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs sm:text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selection with Auto-Save */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-foreground">{t("languageTitle")}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t("languageDesc")}</p>
            <div className="flex items-center gap-4">
              <Globe size={18} className="text-muted-foreground shrink-0" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as keyof typeof UpdateMeDtoPreferredLanguage)}
                className="h-10 w-full max-w-xs rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="en">{t("langEnglish")}</option>
                <option value="fr">{t("langFrench")}</option>
                <option value="rw">{t("langKinyarwanda")}</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-foreground">{t("notifsTitle")}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t("notifsDesc")}</p>
            {loadingNotifs ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 min-[360px]:px-4 py-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium text-foreground">{t("emailNotifs")}</p>
                    <p className="text-xs text-muted-foreground">{t("emailNotifsDesc")}</p>
                  </div>
                  <Switch
                    checked={notifEmail}
                    onCheckedChange={(v) => setNotifEmail(v)}
                    aria-label={t("emailNotifs")}
                    className="shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 min-[360px]:px-4 py-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium text-foreground">{t("pushNotifs")}</p>
                    <p className="text-xs text-muted-foreground">{t("pushNotifsDesc")}</p>
                  </div>
                  <Switch
                    checked={notifPush}
                    onCheckedChange={(v) => setNotifPush(v)}
                    aria-label={t("pushNotifs")}
                    className="shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 min-[360px]:px-4 py-3">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium text-foreground">{t("inAppNotifs")}</p>
                    <p className="text-xs text-muted-foreground">{t("inAppNotifsDesc")}</p>
                  </div>
                  <Switch
                    checked={notifInApp}
                    onCheckedChange={(v) => setNotifInApp(v)}
                    aria-label={t("inAppNotifs")}
                    className="shrink-0"
                  />
                </div>
                <Button onClick={handleSaveNotifPrefs} disabled={savingNotifs} className="mt-4 w-full sm:w-auto">
                  {savingNotifs ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {t("saveNotifsBtn")}
                </Button>
                {notifsError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    {notifsError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return FieldRowWithIcon({ icon: Icon, label, value: <span className="font-medium text-foreground break-words">{value}</span> });
}

function FieldRowWithIcon({ icon: Icon, label, value, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value?: string | React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {children ?? value}
      </div>
    </div>
  );
}
