"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  ExternalLink,
  History,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Trash2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { getSession } from "next-auth/react";
import { Link } from "@/i18n/routing";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { FormSectionSkeleton } from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";
import { fetchAdminSettings, saveSettingsSection } from "@/features/settings/api";
import {
  DEFAULTS,
  DEFAULT_CAREERS_ROLES,
  normalizeSettings,
  type CareerRoleItem,
  type CareersHiringStatus,
  type SettingsData,
} from "@/features/settings/settings";
import {
  getCareersSnapshots,
  saveCareersSnapshot,
  type CareersSnapshot,
} from "@/features/admin-content/snapshots-history";
import { CareersHistoryDialog } from "./careers-history-dialog";

/**
 * Consolidated Careers Hub.
 *
 * Serves as the single source of truth for:
 * - Hiring Posture (`ACTIVELY_HIRING` | `TALENT_POOL` | `PAUSED`)
 * - Official Careers Inquiries Email (`careers@myjudicial.com`)
 * - Full Open Positions Management (CRUD, requirements, responsibilities, published toggles)
 */

function copyDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emptyRole(): CareerRoleItem {
  return {
    id: `role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: "",
    department: "Legal Operations",
    location: "Kigali, Rwanda (Hybrid)",
    type: "Full-time",
    applyUrl: "",
    published: true,
  };
}

function ListField({
  labelKey,
  items,
  onChange,
}: {
  labelKey: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const t = useTranslations("adminCareers");
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">{t(labelKey as never)}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="h-9 text-xs"
            aria-label={`${t(labelKey as never)} ${i + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={() => onChange(items.filter((_, x) => x !== i))}
            aria-label={t("removeItem")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addItem")}
      </Button>
    </div>
  );
}

function RoleEditorCard({
  role,
  index,
  total,
  onChange,
  onRemove,
}: {
  role: CareerRoleItem;
  index: number;
  total: number;
  onChange: (role: CareerRoleItem) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("adminCareers");
  const text = (field: keyof CareerRoleItem) => (value: string) =>
    onChange({ ...role, [field]: value });

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs transition-colors">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 bg-muted/20">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {role.title.trim() || t("untitledRole")}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {t("positionLabel", { number: index + 1, total })}
            </span>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className="text-[11px] text-muted-foreground">{role.department || "General"}</span>
            {role.published === false ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {t("hidden")}
              </span>
            ) : (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Live
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          aria-label={t("removeRole")}
          title={t("removeRole")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{t("roleTitle")}</Label>
            <Input
              value={role.title}
              onChange={(e) => text("title")(e.target.value)}
              placeholder="e.g. Legal Operations Counsel"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{t("roleDepartment")}</Label>
            <Input
              value={role.department}
              onChange={(e) => text("department")(e.target.value)}
              placeholder="e.g. Legal & Compliance"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{t("roleLocation")}</Label>
            <Input
              value={role.location}
              onChange={(e) => text("location")(e.target.value)}
              placeholder="e.g. Kigali, Rwanda (Hybrid)"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{t("roleType")}</Label>
            <Input
              value={role.type}
              onChange={(e) => text("type")(e.target.value)}
              placeholder="e.g. Full-time"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{t("roleApplyUrl")}</Label>
          <Input
            value={role.applyUrl}
            onChange={(e) => text("applyUrl")(e.target.value)}
            className="h-9 text-xs"
            placeholder="https://... or mailto:careers@myjudicial.com?subject=Application"
          />
        </div>

        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-semibold text-foreground marker:hidden select-none">
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
              {t("roleDetails")}
            </span>
          </summary>

          <div className="mt-3 space-y-4 pt-3 border-t border-border/40">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">{t("roleSlug")}</Label>
                <Input
                  value={role.slug ?? ""}
                  onChange={(e) => onChange({ ...role, slug: e.target.value || undefined })}
                  className="h-9 text-xs font-mono"
                  placeholder="legal-counsel-kigali"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">{t("roleSummary")}</Label>
                <Input
                  value={role.summary ?? ""}
                  onChange={(e) => onChange({ ...role, summary: e.target.value || undefined })}
                  className="h-9 text-xs"
                  placeholder="Brief 1-sentence teaser"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{t("roleDescription")}</Label>
              <Textarea
                value={role.description ?? ""}
                onChange={(e) => onChange({ ...role, description: e.target.value || undefined })}
                rows={3}
                placeholder="Overview of the mission and impact of this role within MyJudicial..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <ListField
                labelKey="responsibilities"
                items={role.responsibilities ?? []}
                onChange={(responsibilities) =>
                  onChange({ ...role, responsibilities: responsibilities.length ? responsibilities : undefined })
                }
              />
              <ListField
                labelKey="requirements"
                items={role.requirements ?? []}
                onChange={(requirements) =>
                  onChange({ ...role, requirements: requirements.length ? requirements : undefined })
                }
              />
              <ListField
                labelKey="niceToHave"
                items={role.niceToHave ?? []}
                onChange={(niceToHave) =>
                  onChange({ ...role, niceToHave: niceToHave.length ? niceToHave : undefined })
                }
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                {t("applicationInstructions")}
              </Label>
              <Textarea
                value={role.applicationInstructions ?? ""}
                onChange={(e) =>
                  onChange({ ...role, applicationInstructions: e.target.value || undefined })
                }
                rows={2}
                placeholder="Submit your CV and Rwanda Bar Association certification or credentials to careers@myjudicial.com..."
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{t("published")}</p>
                <p className="text-[11px] text-muted-foreground">{t("publishedHint")}</p>
              </div>
              <Switch
                checked={role.published !== false}
                onCheckedChange={(checked) => onChange({ ...role, published: checked ? undefined : false })}
                aria-label={t("published")}
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export interface CareersHubProps {
  initialSettings?: SettingsData;
  onSaved?: (updated: SettingsData) => void;
}

export function CareersHub({ initialSettings, onSaved }: CareersHubProps) {
  const t = useTranslations("adminCareers");
  const tSettings = useTranslations("admin.settings");

  const [loading, setLoading] = useState(!initialSettings);
  const [backendUnreachable, setBackendUnreachable] = useState(false);
  const [saving, setSaving] = useState(false);

  // Saved state
  const [savedHiringStatus, setSavedHiringStatus] = useState<CareersHiringStatus>(
    initialSettings?.careersHiringStatus ?? "ACTIVELY_HIRING"
  );
  const [savedEmail, setSavedEmail] = useState<string>(
    initialSettings?.careersEmail ?? "careers@myjudicial.com"
  );
  const [savedHeroTitle, setSavedHeroTitle] = useState<string>(
    initialSettings?.careersHeroTitle ?? ""
  );
  const [savedHeroSubtitle, setSavedHeroSubtitle] = useState<string>(
    initialSettings?.careersHeroSubtitle ?? ""
  );
  const [savedRoles, setSavedRoles] = useState<CareerRoleItem[]>(
    initialSettings ? copyDeep(initialSettings.careersOpenRoles) : []
  );
  const [savedReqPhone, setSavedReqPhone] = useState<boolean>(
    initialSettings?.careersRequirePhone ?? false
  );
  const [savedReqLinkedIn, setSavedReqLinkedIn] = useState<boolean>(
    initialSettings?.careersRequireLinkedIn ?? false
  );
  const [savedReqPortfolio, setSavedReqPortfolio] = useState<boolean>(
    initialSettings?.careersRequirePortfolio ?? false
  );
  const [savedReqResume, setSavedReqResume] = useState<boolean>(
    initialSettings?.careersRequireResume ?? true
  );
  const [savedReqCoverNote, setSavedReqCoverNote] = useState<boolean>(
    initialSettings?.careersRequireCoverNote ?? true
  );

  // Draft state
  const [draftHiringStatus, setDraftHiringStatus] = useState<CareersHiringStatus>(savedHiringStatus);
  const [draftEmail, setDraftEmail] = useState<string>(savedEmail);
  const [draftHeroTitle, setDraftHeroTitle] = useState<string>(savedHeroTitle);
  const [draftHeroSubtitle, setDraftHeroSubtitle] = useState<string>(savedHeroSubtitle);
  const [draftRoles, setDraftRoles] = useState<CareerRoleItem[]>(copyDeep(savedRoles));
  const [draftReqPhone, setDraftReqPhone] = useState<boolean>(savedReqPhone);
  const [draftReqLinkedIn, setDraftReqLinkedIn] = useState<boolean>(savedReqLinkedIn);
  const [draftReqPortfolio, setDraftReqPortfolio] = useState<boolean>(savedReqPortfolio);
  const [draftReqResume, setDraftReqResume] = useState<boolean>(savedReqResume);
  const [draftReqCoverNote, setDraftReqCoverNote] = useState<boolean>(savedReqCoverNote);
  const locale = useLocale();
  const [careersSnapshots, setCareersSnapshots] = useState<CareersSnapshot[]>([]);
  const [showCareersHistory, setShowCareersHistory] = useState(false);

  useEffect(() => {
    setCareersSnapshots(getCareersSnapshots());
  }, []);

  // Sync when initialSettings updates from parent
  useEffect(() => {
    if (initialSettings) {
      setSavedHiringStatus(initialSettings.careersHiringStatus);
      setSavedEmail(initialSettings.careersEmail);
      setSavedHeroTitle(initialSettings.careersHeroTitle ?? "");
      setSavedHeroSubtitle(initialSettings.careersHeroSubtitle ?? "");
      setSavedRoles(copyDeep(initialSettings.careersOpenRoles));
      setSavedReqPhone(initialSettings.careersRequirePhone ?? false);
      setSavedReqLinkedIn(initialSettings.careersRequireLinkedIn ?? false);
      setSavedReqPortfolio(initialSettings.careersRequirePortfolio ?? false);
      setSavedReqResume(initialSettings.careersRequireResume ?? true);
      setSavedReqCoverNote(initialSettings.careersRequireCoverNote ?? true);

      setDraftHiringStatus(initialSettings.careersHiringStatus);
      setDraftEmail(initialSettings.careersEmail);
      setDraftHeroTitle(initialSettings.careersHeroTitle ?? "");
      setDraftHeroSubtitle(initialSettings.careersHeroSubtitle ?? "");
      setDraftRoles(copyDeep(initialSettings.careersOpenRoles));
      setDraftReqPhone(initialSettings.careersRequirePhone ?? false);
      setDraftReqLinkedIn(initialSettings.careersRequireLinkedIn ?? false);
      setDraftReqPortfolio(initialSettings.careersRequirePortfolio ?? false);
      setDraftReqResume(initialSettings.careersRequireResume ?? true);
      setDraftReqCoverNote(initialSettings.careersRequireCoverNote ?? true);
      setLoading(false);
    }
  }, [initialSettings]);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminSettings()
      .then((data) => {
        const norm = normalizeSettings(data);
        setSavedHiringStatus(norm.careersHiringStatus);
        setSavedEmail(norm.careersEmail);
        setSavedHeroTitle(norm.careersHeroTitle ?? "");
        setSavedHeroSubtitle(norm.careersHeroSubtitle ?? "");
        setSavedRoles(copyDeep(norm.careersOpenRoles));
        setSavedReqPhone(norm.careersRequirePhone);
        setSavedReqLinkedIn(norm.careersRequireLinkedIn);
        setSavedReqPortfolio(norm.careersRequirePortfolio);
        setSavedReqResume(norm.careersRequireResume);
        setSavedReqCoverNote(norm.careersRequireCoverNote);

        setDraftHiringStatus(norm.careersHiringStatus);
        setDraftEmail(norm.careersEmail);
        setDraftHeroTitle(norm.careersHeroTitle ?? "");
        setDraftHeroSubtitle(norm.careersHeroSubtitle ?? "");
        setDraftRoles(copyDeep(norm.careersOpenRoles));
        setDraftReqPhone(norm.careersRequirePhone);
        setDraftReqLinkedIn(norm.careersRequireLinkedIn);
        setDraftReqPortfolio(norm.careersRequirePortfolio);
        setDraftReqResume(norm.careersRequireResume);
        setDraftReqCoverNote(norm.careersRequireCoverNote);
        setBackendUnreachable(false);
      })
      .catch((error) => {
        setBackendUnreachable(true);
        toast.error(getErrorMessage(error, t("loadFailed")));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (!initialSettings) {
      load();
    }
  }, [initialSettings, load]);

  const dirty =
    draftHiringStatus !== savedHiringStatus ||
    draftEmail !== savedEmail ||
    draftHeroTitle !== savedHeroTitle ||
    draftHeroSubtitle !== savedHeroSubtitle ||
    draftReqPhone !== savedReqPhone ||
    draftReqLinkedIn !== savedReqLinkedIn ||
    draftReqPortfolio !== savedReqPortfolio ||
    draftReqResume !== savedReqResume ||
    draftReqCoverNote !== savedReqCoverNote ||
    JSON.stringify(draftRoles) !== JSON.stringify(savedRoles);

  const addRole = () => setDraftRoles((d) => [...d, emptyRole()]);
  const removeRole = (index: number) => setDraftRoles((d) => d.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        careersHiringStatus: draftHiringStatus,
        careersEmail: draftEmail,
        careersHeroTitle: draftHeroTitle,
        careersHeroSubtitle: draftHeroSubtitle,
        careersOpenRoles: draftRoles,
        careersRequirePhone: draftReqPhone,
        careersRequireLinkedIn: draftReqLinkedIn,
        careersRequirePortfolio: draftReqPortfolio,
        careersRequireResume: draftReqResume,
        careersRequireCoverNote: draftReqCoverNote,
      };
      const updated = await saveSettingsSection(payload);
      const norm = normalizeSettings(updated);

      setSavedHiringStatus(norm.careersHiringStatus);
      setSavedEmail(norm.careersEmail);
      setSavedHeroTitle(norm.careersHeroTitle ?? "");
      setSavedHeroSubtitle(norm.careersHeroSubtitle ?? "");
      setSavedRoles(copyDeep(norm.careersOpenRoles));
      setSavedReqPhone(norm.careersRequirePhone);
      setSavedReqLinkedIn(norm.careersRequireLinkedIn);
      setSavedReqPortfolio(norm.careersRequirePortfolio);
      setSavedReqResume(norm.careersRequireResume);
      setSavedReqCoverNote(norm.careersRequireCoverNote);

      setDraftHiringStatus(norm.careersHiringStatus);
      setDraftEmail(norm.careersEmail);
      setDraftHeroTitle(norm.careersHeroTitle ?? "");
      setDraftHeroSubtitle(norm.careersHeroSubtitle ?? "");
      setDraftRoles(copyDeep(norm.careersOpenRoles));
      setDraftReqPhone(norm.careersRequirePhone);
      setDraftReqLinkedIn(norm.careersRequireLinkedIn);
      setDraftReqPortfolio(norm.careersRequirePortfolio);
      setDraftReqResume(norm.careersRequireResume);
      setDraftReqCoverNote(norm.careersRequireCoverNote);

      if (onSaved) {
        onSaved(updated);
      }
      let author = "Admin";
      if (typeof window !== "undefined") {
        try {
          const session = await getSession();
          if (session?.user?.name) {
            author = `${session.user.name} (${session.user.email ?? ""})`.trim();
          } else if (session?.user?.email) {
            author = session.user.email;
          }
        } catch {}
      }
      saveCareersSnapshot(draftRoles, draftHiringStatus, author);
      setCareersSnapshots(getCareersSnapshots());
      toast.success(t("rolesSaved"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreCareers = (snapshot: CareersSnapshot) => {
    setDraftRoles(copyDeep(snapshot.roles));
    setDraftHiringStatus(snapshot.hiringStatus);
    toast.success(`Restored ${snapshot.roleCount} roles from snapshot. Click Save Changes to apply.`);
  };

  if (loading) {
    return <FormSectionSkeleton fields={6} />;
  }

  const liveRolesCount = draftRoles.filter((r) => r.published !== false).length;

  return (
    <div className="space-y-6">
      {backendUnreachable && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("serverUnreachable")}</p>
              <p className="text-xs text-muted-foreground">{t("serverUnreachableDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-3 w-3 mr-1" /> {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Context & Status Banner ── */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-bold text-foreground">{tSettings("careersTitle")}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 ${
                draftHiringStatus === "ACTIVELY_HIRING"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : draftHiringStatus === "TALENT_POOL"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {draftHiringStatus === "ACTIVELY_HIRING"
                ? tSettings("hiringActive")
                : draftHiringStatus === "TALENT_POOL"
                ? tSettings("hiringTalentPool")
                : tSettings("hiringPaused")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{tSettings("careersTabDesc")}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCareersHistory(true)}
            className="h-8 text-xs gap-1.5"
            title="View saved history snapshots of careers positions"
          >
            <History className="h-3.5 w-3.5 text-primary" />
            <span>History ({careersSnapshots.length})</span>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link href="/careers" prefetch={false} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {tSettings("viewLivePage")}
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="h-8 text-xs font-semibold"
          >
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {t("saveChanges")}
          </Button>
        </div>
      </div>

      {/* ── Global Hiring Controls Card ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Recruitment Posture & Contact
          </CardTitle>
          <CardDescription className="text-xs">
            These settings govern the public hero badges, talent pool cards, and application routing on /careers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="careers-hiring-status" className="text-xs font-semibold">
                {tSettings("hiringStatus")}
              </Label>
              <Select
                value={draftHiringStatus}
                onValueChange={(val) => setDraftHiringStatus(val as CareersHiringStatus)}
              >
                <SelectTrigger id="careers-hiring-status" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVELY_HIRING">
                    {tSettings("hiringActive")} — Open roles listed & accepting applications
                  </SelectItem>
                  <SelectItem value="TALENT_POOL">
                    {tSettings("hiringTalentPool")} — Accepting spontaneous CVs into talent pool
                  </SelectItem>
                  <SelectItem value="PAUSED">
                    {tSettings("hiringPaused")} — Recruitment paused
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="careers-contact-email" className="text-xs font-semibold">
                {tSettings("careersEmail")}
              </Label>
              <div className="relative">
                <Input
                  id="careers-contact-email"
                  type="email"
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  placeholder="careers@myjudicial.com"
                  className="h-9 text-xs pl-8"
                />
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Hero Headline & Subtitle Customization */}
          <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/40">
            <div className="space-y-1.5">
              <Label htmlFor="careers-hero-title" className="text-xs font-semibold">
                Hero Headline (Optional Override)
              </Label>
              <Input
                id="careers-hero-title"
                type="text"
                value={draftHeroTitle}
                onChange={(e) => setDraftHeroTitle(e.target.value)}
                placeholder="e.g. Build the future of accessible legal services"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="careers-hero-subtitle" className="text-xs font-semibold">
                Hero Subtitle (Optional Override)
              </Label>
              <Input
                id="careers-hero-subtitle"
                type="text"
                value={draftHeroSubtitle}
                onChange={(e) => setDraftHeroSubtitle(e.target.value)}
                placeholder="e.g. We are engineering foundational legal infrastructure for Rwanda..."
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Application Form Field Requirements Card ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            Application Form Field Requirements
          </CardTitle>
          <CardDescription className="text-xs">
            Configure which fields are mandatory (marked with a red asterisk *) versus optional on the public candidate application modal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Full Name (Locked) */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Full Name</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">Always Required</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Candidate identification and applicant record creation</p>
              </div>
              <Switch checked={true} disabled aria-label="Full Name requirement" />
            </div>

            {/* Email Address (Locked) */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Email Address</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">Always Required</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Primary communication channel for interview invites</p>
              </div>
              <Switch checked={true} disabled aria-label="Email requirement" />
            </div>

            {/* Phone Number (Configurable) */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Phone Number</span>
                  {draftReqPhone && <span className="text-destructive font-bold">*</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">Direct telephone or WhatsApp hotline for urgent interview alerts</p>
              </div>
              <Switch
                checked={draftReqPhone}
                onCheckedChange={setDraftReqPhone}
                aria-label="Require Phone Number"
              />
            </div>

            {/* LinkedIn Profile URL (Configurable) */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">LinkedIn Profile URL</span>
                  {draftReqLinkedIn && <span className="text-destructive font-bold">*</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">Professional history, career timeline, and verified endorsements</p>
              </div>
              <Switch
                checked={draftReqLinkedIn}
                onCheckedChange={setDraftReqLinkedIn}
                aria-label="Require LinkedIn Profile"
              />
            </div>

            {/* Portfolio / GitHub URL (Configurable) */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Portfolio / GitHub / Code Link</span>
                  {draftReqPortfolio && <span className="text-destructive font-bold">*</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">Relevant work samples, design portfolios, or open-source repositories</p>
              </div>
              <Switch
                checked={draftReqPortfolio}
                onCheckedChange={setDraftReqPortfolio}
                aria-label="Require Portfolio or GitHub"
              />
            </div>

            {/* Resume / CV (Configurable) */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Resume / CV (File or Link)</span>
                  {draftReqResume && <span className="text-destructive font-bold">*</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">Curriculum vitae in PDF/DOCX or cloud storage link</p>
              </div>
              <Switch
                checked={draftReqResume}
                onCheckedChange={setDraftReqResume}
                aria-label="Require Resume or CV"
              />
            </div>

            {/* Cover Note / Motivation (Configurable) */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 sm:col-span-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Cover Note / Why MyJudicial?</span>
                  {draftReqCoverNote && <span className="text-destructive font-bold">*</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">Candidate&apos;s pitch, motivation, and specific problems they want to solve</p>
              </div>
              <Switch
                checked={draftReqCoverNote}
                onCheckedChange={setDraftReqCoverNote}
                aria-label="Require Cover Note"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Open Roles Header & Controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Open Positions</h3>
          <span className="text-xs text-muted-foreground">
            ({t("roleCount", { count: draftRoles.length })} • {liveRolesCount} live)
          </span>
          {draftRoles.some((role) => role.published === false) && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("someHidden")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDraftRoles(JSON.parse(JSON.stringify(DEFAULT_CAREERS_ROLES)))}
            className="h-8 text-xs font-medium"
            title="Populate standard legal-tech job openings"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
            {draftRoles.length === 0 ? "Populate Standard Roles" : "Reset Standard Roles"}
          </Button>
          <Button variant="outline" size="sm" onClick={addRole} className="h-8 text-xs font-medium">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("addRole")}
          </Button>
        </div>
      </div>

      {/* ── Positions List ── */}
      {draftRoles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-3">
          <Briefcase className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
          <p className="text-xs text-muted-foreground">{t("noRoles")}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              variant="default"
              size="sm"
              onClick={() => setDraftRoles(JSON.parse(JSON.stringify(DEFAULT_CAREERS_ROLES)))}
              className="text-xs font-semibold shadow-xs"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Populate Standard Roles
            </Button>
            <Button variant="outline" size="sm" onClick={addRole} className="text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Custom Role
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {draftRoles.map((role, index) => (
            <RoleEditorCard
              key={role.id}
              role={role}
              index={index}
              total={draftRoles.length}
              onChange={(next) => setDraftRoles((d) => d.map((r, i) => (i === index ? next : r)))}
              onRemove={() => removeRole(index)}
            />
          ))}
        </div>
      )}

      {/* Careers Snapshot History & Recovery Dialog */}
      <CareersHistoryDialog
        open={showCareersHistory}
        onOpenChange={setShowCareersHistory}
        snapshots={careersSnapshots}
        onRestore={handleRestoreCareers}
        locale={locale}
      />
    </div>
  );
}

/** Re-export for backward compatibility */
export { CareersHub as RolesEditor };
