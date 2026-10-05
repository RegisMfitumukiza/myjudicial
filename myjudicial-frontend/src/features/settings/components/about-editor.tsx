"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Building2,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { saveSettingsSection } from "../api";
import { DEFAULTS, type CoreValueItem, type MilestoneItem, type SettingsData } from "../settings";

const ICON_OPTIONS = [
  "ShieldCheck",
  "Scale",
  "Users",
  "Award",
  "Target",
  "Lock",
  "Heart",
  "Clock",
  "Globe",
  "Sparkles",
];

export interface AboutEditorProps {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

function copyDeep<T>(value: T[]): T[] {
  return JSON.parse(JSON.stringify(value)) as T[];
}

export function AboutEditor({ settings, onSaved }: AboutEditorProps) {
  const t = useTranslations("admin.settings");

  const [saved, setSaved] = useState({
    aboutVision: settings.aboutVision,
    aboutMission: settings.aboutMission,
    aboutStory: settings.aboutStory,
    aboutHeroBadge: settings.aboutHeroBadge || "",
    aboutHeroTitle: settings.aboutHeroTitle || "",
    aboutHeroSubtitle: settings.aboutHeroSubtitle || "",
    aboutCoreValues: copyDeep(settings.aboutCoreValues),
    aboutMilestones: copyDeep(settings.aboutMilestones),
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.aboutVision !== saved.aboutVision ||
    draft.aboutMission !== saved.aboutMission ||
    draft.aboutStory !== saved.aboutStory ||
    draft.aboutHeroBadge !== saved.aboutHeroBadge ||
    draft.aboutHeroTitle !== saved.aboutHeroTitle ||
    draft.aboutHeroSubtitle !== saved.aboutHeroSubtitle ||
    JSON.stringify(draft.aboutCoreValues) !== JSON.stringify(saved.aboutCoreValues) ||
    JSON.stringify(draft.aboutMilestones) !== JSON.stringify(saved.aboutMilestones);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setCoreValues = (values: CoreValueItem[]) => set("aboutCoreValues", values);
  const setMilestones = (values: MilestoneItem[]) => set("aboutMilestones", values);

  const handleAddCoreValue = () =>
    setCoreValues([
      ...draft.aboutCoreValues,
      { id: `val_${Date.now()}`, title: "", description: "", icon: "ShieldCheck" },
    ]);

  const handleUpdateCoreValue = (index: number, field: keyof CoreValueItem, value: string) => {
    const updated = copyDeep(draft.aboutCoreValues);
    updated[index] = { ...updated[index], [field]: value };
    setCoreValues(updated);
  };

  const handleRemoveCoreValue = (index: number) =>
    setCoreValues(draft.aboutCoreValues.filter((_, i) => i !== index));

  const handleAddMilestone = () =>
    setMilestones([
      ...draft.aboutMilestones,
      {
        id: `m_${Date.now()}`,
        year: new Date().getFullYear().toString(),
        title: "",
        description: "",
      },
    ]);

  const handleUpdateMilestone = (index: number, field: keyof MilestoneItem, value: string) => {
    const updated = copyDeep(draft.aboutMilestones);
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleRemoveMilestone = (index: number) =>
    setMilestones(draft.aboutMilestones.filter((_, i) => i !== index));

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await saveSettingsSection(draft);
      setSaved({
        ...draft,
        aboutCoreValues: copyDeep(draft.aboutCoreValues),
        aboutMilestones: copyDeep(draft.aboutMilestones),
      });
      onSaved(updated);
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(t("settingsUnavailable"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Context & Action Banner ── */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-bold text-foreground">{t("aboutCmsTitle")}</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 whitespace-nowrap shrink-0">
              {draft.aboutCoreValues.length} Values • {draft.aboutMilestones.length} Milestones
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{t("aboutTabDesc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs flex-1 sm:flex-initial">
            <Link href="/about" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {t("viewLivePage")}
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="h-8 text-xs font-semibold flex-1 sm:flex-initial"
          >
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {t("saveChanges")}
          </Button>
        </div>
      </div>

      {/* ── Hero & Platform Positioning ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Hero & Public Positioning
          </CardTitle>
          <CardDescription className="text-xs">
            Headline, trust badge, and introduction banner at the very top of the public /about page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="about-hero-badge" className="text-xs font-semibold">
                Hero Badge Text
              </Label>
              <Input
                id="about-hero-badge"
                value={draft.aboutHeroBadge}
                onChange={(e) => set("aboutHeroBadge", e.target.value)}
                placeholder="National Digital Legal Platform"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="about-hero-title" className="text-xs font-semibold">
                Main Hero Headline
              </Label>
              <Input
                id="about-hero-title"
                value={draft.aboutHeroTitle}
                onChange={(e) => set("aboutHeroTitle", e.target.value)}
                placeholder="Democratizing Access to Justice Across Rwanda"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about-hero-subtitle" className="text-xs font-semibold">
              Hero Introduction Paragraph
            </Label>
            <Textarea
              id="about-hero-subtitle"
              rows={2}
              value={draft.aboutHeroSubtitle}
              onChange={(e) => set("aboutHeroSubtitle", e.target.value)}
              placeholder="Connecting citizens and enterprises with vetted, Bar-certified advocates through transparent escrow and standardized counsel."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Foundational Statements ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Mission, Vision & Platform Narrative
          </CardTitle>
          <CardDescription className="text-xs">
            Core purpose statements displayed in the public /about page hero and mission section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="about-mission" className="text-xs font-semibold">
              {t("aboutMission")}
            </Label>
            <Textarea
              id="about-mission"
              rows={2}
              value={draft.aboutMission}
              onChange={(e) => set("aboutMission", e.target.value)}
              placeholder="e.g. To democratize access to justice in Rwanda by providing a trusted, transparent, and legally compliant digital platform..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="about-vision" className="text-xs font-semibold">
              {t("aboutVision")}
            </Label>
            <Textarea
              id="about-vision"
              rows={2}
              value={draft.aboutVision}
              onChange={(e) => set("aboutVision", e.target.value)}
              placeholder="e.g. To become the premier digital legal infrastructure for East Africa..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="about-story" className="text-xs font-semibold">
              {t("aboutStory")}
            </Label>
            <Textarea
              id="about-story"
              rows={4}
              value={draft.aboutStory}
              onChange={(e) => set("aboutStory", e.target.value)}
              placeholder="e.g. Founded in Kigali, MyJudicial was established to bridge the gap between citizens seeking trusted counsel and certified Rwanda Bar Association advocates..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Core Values Section ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("coreValues")}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {t("coreValuesDesc")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCoreValues(copyDeep(DEFAULTS.aboutCoreValues))}
              className="text-xs h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {t("resetValues")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddCoreValue}
              className="text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("addValue")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.aboutCoreValues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No core values defined yet. Click &quot;Add Value&quot; to create one.
            </div>
          ) : (
            draft.aboutCoreValues.map((val, idx) => (
              <div
                key={val.id || idx}
                className="p-3.5 sm:p-4 rounded-xl border border-border bg-muted/20 space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-12 items-start">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("valueTitle")}
                    </Label>
                    <Input
                      value={val.title}
                      onChange={(e) => handleUpdateCoreValue(idx, "title", e.target.value)}
                      placeholder="e.g. Accessibility"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("valueIcon")}
                    </Label>
                    <Select
                      value={val.icon}
                      onValueChange={(iconVal) => handleUpdateCoreValue(idx, "icon", iconVal)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("valueDescription")}
                    </Label>
                    <Input
                      value={val.description}
                      onChange={(e) => handleUpdateCoreValue(idx, "description", e.target.value)}
                      placeholder="e.g. Legal counsel accessible across all 30 districts"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end justify-end sm:pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCoreValue(idx)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      title={t("removeValue")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Milestones Section ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t("milestones")}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {t("milestonesDesc")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMilestones(copyDeep(DEFAULTS.aboutMilestones))}
              className="text-xs h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {t("resetMilestones")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddMilestone}
              className="text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("addMilestone")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.aboutMilestones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No milestones defined yet. Click &quot;Add Milestone&quot; to create one.
            </div>
          ) : (
            draft.aboutMilestones.map((ms, idx) => (
              <div
                key={ms.id || idx}
                className="p-3.5 sm:p-4 rounded-xl border border-border bg-muted/20 space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-12 items-start">
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("milestoneYear")}
                    </Label>
                    <Input
                      value={ms.year}
                      onChange={(e) => handleUpdateMilestone(idx, "year", e.target.value)}
                      placeholder="e.g. 2026 or Q3 2026"
                      className="h-9 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-8 space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("milestoneTitle")}
                    </Label>
                    <Input
                      value={ms.title}
                      onChange={(e) => handleUpdateMilestone(idx, "title", e.target.value)}
                      placeholder="e.g. Nationwide 30-District Deployment"
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end justify-end sm:pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      title={t("removeMilestone")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="sm:col-span-12 space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("milestoneDesc")}
                    </Label>
                    <Input
                      value={ms.description}
                      onChange={(e) => handleUpdateMilestone(idx, "description", e.target.value)}
                      placeholder="e.g. Expanding certified counsel access across all provinces in Kinyarwanda, English, and French..."
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
