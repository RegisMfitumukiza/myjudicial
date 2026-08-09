"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import {
  User, Key, Palette, Loader2, Save, Lock, Globe, AlertTriangle,
  CheckCircle, Monitor, Pencil, X, Check, Building2, BookOpen,
  MapPin, DollarSign, BadgeCheck, Briefcase, Hash, Languages,
  FileText,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
import { ExpertPhotoUploader } from "@/shared/components/photo-upload";
import { useAuth } from "@/providers/auth-provider";
import { EXPERT_PHOTO_URL_QUERY_KEY, useExpertPhotoUrl } from "@/features/experts/hooks/useExpertProfile";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type TabId = "profile" | "account" | "preferences";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Key },
  { id: "preferences", label: "Preferences", icon: Palette },
];

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

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
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const patchAuthMe = usePatchAuthMe();
  const { refreshUser } = useAuth();
  const t = useTranslations("expertDashboard_profile");

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

  /* Account tab state */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  /* Preferences tab state */
  const [language, setLanguage] = useState<keyof typeof UpdateMeDtoPreferredLanguage>("en");
  const [savingLanguage, setSavingLanguage] = useState(false);

  /* Session management */
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  /* Notification preferences */
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
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

  /* Hash-based tab navigation */
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabId;
    if (hash && TABS.some((t) => t.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as TabId;
      if (hash && TABS.some((t) => t.id === hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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

  /* ── Account Tab Actions ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch("/auth/admin/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("passwordChanged"));
    } catch (err: any) {
      setPasswordError(err?.message ?? t("failedChangePassword"));
    } finally {
      setChangingPassword(false);
    }
  };

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res: any = await apiFetch("/auth/sessions");
      const list = (res.data?.data ?? res.data ?? []) as SessionInfo[];
      setSessions(list);
    } catch {
      setSessionsError(t("failedLoadSessions"));
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "account") {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success(t("sessionRevoked"));
    } catch {
      toast.error(t("failedRevokeSession"));
    } finally {
      setRevokingSessionId(null);
    }
  };

  /* ── Preferences Tab Actions ── */
  const handleSaveLanguage = async () => {
    setSavingLanguage(true);
    try {
      await patchAuthMe.mutateAsync({ data: { preferredLanguage: language } });
      toast.success(t("languageSaved"));
    } catch {
      toast.error(t("failedSaveLanguage"));
    } finally {
      setSavingLanguage(false);
    }
  };

  const fetchNotifPrefs = useCallback(async () => {
    setLoadingNotifs(true);
    setNotifsError(null);
    try {
      const res: any = await apiFetch("/auth/me/notification-preferences");
      const prefs = res.data?.data ?? res.data ?? {};
      setNotifEmail(prefs.email ?? true);
      setNotifWhatsapp(prefs.whatsapp ?? true);
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
        body: { email: notifEmail, whatsapp: notifWhatsapp, push: notifPush, inApp: notifInApp },
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
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{t("profileTitle")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("profileSubtitle")}
        </p>
      </div>

      {/* Name + role banner */}
      <div className="flex items-center gap-4 rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
        <ExpertPhotoUploader
          currentImageUrl={displayPhotoUrl}
          userName={profile?.displayName || session?.user?.name || "?"}
          size="md"
          onSuccess={handlePhotoSuccess}
        />
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {profile?.displayName || session?.user?.name || t("defaultExpertName")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-dark/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-dark dark:bg-white/10 dark:text-white">
            {t("expertBadge")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-brand-border/20 bg-white p-1 shadow-md dark:bg-gray-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-brand-dark text-white shadow-sm dark:bg-white dark:text-black"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{(t as any)(`tabs.${id}`)}</span>
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
            <div className="rounded-xl border border-brand-border/20 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {error instanceof Error && error.message.toLowerCase().includes("not found")
                  ? t("createProfilePrompt")
                  : t("failedLoadProfile")}
              </p>
              {error instanceof Error && error.message.toLowerCase().includes("not found") ? (
                <Button onClick={handleCreateProfile}>{t("createProfileBtn")}</Button>
              ) : (
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["expert-profile"] })}>
                  {t("retryBtn")}
                </Button>
              )}
            </div>
          ) : (
            <>
              {statusConfig && (
                <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                    {profile?.statusMessage && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{profile.statusMessage}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-md dark:bg-gray-900 lg:col-span-1">
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
                      <h2 className="text-center text-lg font-bold text-brand-dark dark:text-gray-100">
                        {editing ? form.displayName || t("unnamed") : profile?.displayName || t("unnamed")}
                      </h2>
                      {!editing && profile?.status === "VERIFIED" && (
                        <div title={t("verifiedExpert")} className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email || ""}</p>
                    {!editing && profile?.user?.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{profile.user.phone}</p>
                    )}
                    {!editing && profile && (
                      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                        {profile.specialties?.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {LEGAL_SPECIALTY_LABELS[s] || s}
                          </Badge>
                        ))}
                        {(profile.specialties?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{profile.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-brand-border/20 bg-white shadow-md dark:bg-gray-900 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-brand-border/10 px-5 py-4">
                    <div>
                      <h2 className="text-base font-bold text-brand-dark dark:text-gray-100">{t("professionalDetailsTitle")}</h2>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {editing ? t("editProfessionalDetailsDesc") : t("professionalDetailsDesc")}
                      </p>
                    </div>
                    {editing ? (
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={cancelEditing} disabled={busy}>
                          <X size={14} className="mr-1.5" />
                          {t("cancelBtn")}
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={busy}>
                          {busy ? (
                            <Loader2 size={14} className="mr-1.5 animate-spin" />
                          ) : (
                            <Check size={14} className="mr-1.5" />
                          )}
                          {busy ? t("savingBtn") : isNewProfile ? t("createProfileBtn") : t("saveChangesBtn")}
                        </Button>
                      </div>
                    ) : profile ? (
                      <Button variant="outline" onClick={startEditing}>
                        <Pencil size={14} className="mr-1.5" />
                        {t("editProfileBtn")}
                      </Button>
                    ) : null}
                  </div>
                  <div className="p-5">
                    {editing ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="displayName">Display Name *</Label>
                            <Input
                              id="displayName"
                              value={form.displayName}
                              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="firmName">Firm Name</Label>
                            <Input
                              id="firmName"
                              value={form.firmName}
                              onChange={(e) => setForm((f) => ({ ...f, firmName: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={form.bio}
                            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="barNumber">Bar Number *</Label>
                            <Input
                              id="barNumber"
                              value={form.barNumber}
                              onChange={(e) => setForm((f) => ({ ...f, barNumber: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="yearsExperience">Years of Experience</Label>
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="primarySpecialty">Primary Specialty *</Label>
                            <Select
                              value={form.primarySpecialty}
                              onValueChange={(v) => setForm((f) => ({ ...f, primarySpecialty: v as LegalSpecialty }))}
                            >
                              <SelectTrigger id="primarySpecialty" className="w-full">
                                <SelectValue placeholder="Select specialty" />
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
                            <Label htmlFor="currency">Currency</Label>
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
                          <Label>Additional Specialties</Label>
                          <div className="grid grid-cols-2 gap-2 rounded-lg border border-brand-border/20 dark:border-gray-700 p-3 sm:grid-cols-3">
                            {Object.entries(LEGAL_SPECIALTY_LABELS).map(([value, label]) => {
                              const checked = form.specialties.includes(value as LegalSpecialty);
                              return (
                                <label key={value} className="flex items-center gap-2 text-sm text-brand-dark dark:text-gray-100">
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="baseConsultationFee">Consultation Fee</Label>
                            <Input
                              id="baseConsultationFee"
                              type="number"
                              min={0}
                              value={form.baseConsultationFee || ""}
                              onChange={(e) => setForm((f) => ({ ...f, baseConsultationFee: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="languages">Languages (codes, comma-separated)</Label>
                            <Input
                              id="languages"
                              value={form.languages}
                              onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                              placeholder="en, fr, rw"
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Use short language codes: en (English), fr (French), rw (Kinyarwanda), sw (Swahili)
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={form.city}
                              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={form.country}
                              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="officeAddress">Office Address</Label>
                          <Input
                            id="officeAddress"
                            value={form.officeAddress}
                            onChange={(e) => setForm((f) => ({ ...f, officeAddress: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : profile ? (
                      <div className="divide-y divide-brand-border/10">
                        <FieldRow icon={User} label="Display Name" value={profile.displayName || "—"} />
                        <FieldRow icon={FileText} label="Bio" value={profile.bio || "—"} />
                        <FieldRowWithIcon icon={Building2} label="Firm" value={profile.firmName || "—"} />
                        <FieldRow icon={Hash} label="Bar Number" value={profile.barNumber || "—"} />
                        <FieldRow icon={Briefcase} label="Years of Experience" value={profile.yearsExperience != null ? String(profile.yearsExperience) : "—"} />
                        <FieldRow icon={BookOpen} label="Primary Specialty" value={LEGAL_SPECIALTY_LABELS[profile.primarySpecialty] || profile.primarySpecialty || "—"} />
                        <FieldRowWithIcon icon={BadgeCheck} label="Specialties">
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {profile.specialties?.length ? (
                              profile.specialties.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[11px]">
                                  {LEGAL_SPECIALTY_LABELS[s] || s}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                            )}
                          </div>
                        </FieldRowWithIcon>
                        <FieldRow icon={Languages} label="Languages" value={profile.languages?.join(", ") || "—"} />
                        <FieldRow icon={MapPin} label="Office Address" value={profile.officeAddress || "—"} />
                        <FieldRowWithIcon icon={Globe} label="Location" value={[profile.city, profile.country].filter(Boolean).join(", ") || "—"} />
                        <FieldRow icon={DollarSign} label="Consultation Fee" value={profile.baseConsultationFee != null ? `${profile.baseConsultationFee.toLocaleString()} ${profile.currency}` : "—"} />
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No profile data yet. Click &quot;Create Profile&quot; to get started.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Account Tab ── */}
      {activeTab === "account" && (
        <div className="space-y-4">
          <form onSubmit={handleChangePassword} className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ac-current-pw">
                  Current Password
                </label>
                <input
                  id="ac-current-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ac-new-pw">
                  New Password
                </label>
                <input
                  id="ac-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
                {newPassword && newPassword.length < 8 && (
                  <p className="mt-1 text-xs text-red-500">Minimum 8 characters</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ac-confirm-pw">
                  Confirm New Password
                </label>
                <input
                  id="ac-confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>

            {passwordError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle size={15} />
                Password updated successfully
              </div>
            )}

            <button
              type="submit"
              disabled={changingPassword || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {changingPassword ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              Update Password
            </button>
          </form>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Active Sessions</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Devices and sessions currently logged into your account
            </p>
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : sessionsError ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border/20 py-8 text-sm text-gray-400">
                <AlertTriangle size={18} className="mr-2" />
                {sessionsError}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border/20 py-8 text-sm text-gray-400">
                <Monitor size={18} className="mr-2" />
                No active sessions
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      s.isCurrent
                        ? "border-brand-dark/30 bg-brand-dark/5 dark:border-white/20 dark:bg-white/5"
                        : "border-brand-border/20 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Monitor size={18} className="shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {s.device || "Unknown device"}
                          {s.isCurrent && (
                            <span className="ml-2 rounded-full bg-brand-dark/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-dark dark:bg-white/10 dark:text-white">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.browser && `${s.browser} · `}{s.ip && `${s.ip} · `}
                          Last active: {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    {!s.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        disabled={revokingSessionId === s.id}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        {revokingSessionId === s.id ? <Loader2 size={14} className="animate-spin" /> : "Revoke"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {activeTab === "preferences" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Appearance</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Choose how the platform looks for you</p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-gray-700 dark:text-gray-300">Toggle light / dark mode</span>
            </div>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Language</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Select your preferred interface language</p>
            <div className="flex items-center gap-4">
              <Globe size={18} className="text-gray-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as keyof typeof UpdateMeDtoPreferredLanguage)}
                className="h-11 max-w-xs rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </div>
            <button
              onClick={handleSaveLanguage}
              disabled={savingLanguage}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {savingLanguage ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Language Preference
            </button>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:bg-gray-900">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Notification Preferences</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Control which notifications you receive</p>
            {loadingNotifs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates via email</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifEmail}
                    onClick={() => setNotifEmail(!notifEmail)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifEmail ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifEmail ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates via WhatsApp (Meta Cloud API)</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifWhatsapp}
                    onClick={() => setNotifWhatsapp(!notifWhatsapp)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifWhatsapp ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifWhatsapp ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
                    <p className="text-xs text-gray-500">Receive push notifications for booking state changes</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifPush}
                    onClick={() => setNotifPush(!notifPush)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifPush ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPush ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between rounded-lg border border-brand-border/20 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">In-App Notifications</p>
                    <p className="text-xs text-gray-500">Receive notifications inside the platform</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifInApp}
                    onClick={() => setNotifInApp(!notifInApp)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      notifInApp ? "bg-brand-dark dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifInApp ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </label>
                <button
                  onClick={handleSaveNotifPrefs}
                  disabled={savingNotifs}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
                >
                  {savingNotifs ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save Notification Preferences
                </button>
                {notifsError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
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
  return FieldRowWithIcon({ icon: Icon, label, value: <span className="font-medium text-brand-dark break-words dark:text-white">{value}</span> });
}

function FieldRowWithIcon({ icon: Icon, label, value, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value?: string | React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-blue">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark/50 dark:text-white/50">{label}</p>
        {children ?? value}
      </div>
    </div>
  );
}
