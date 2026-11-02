"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FileText, Plus, RefreshCw, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { SettingsSection } from "./settings-section";
import { saveSettingsSection } from "../api";
import { DEFAULTS, type CoreValueItem, type MilestoneItem, type SettingsData } from "../settings";
import { translateText } from "@/lib/api/ai";
import { getErrorMessage } from "@/lib/utils";

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

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

function copyDeep<T>(value: T[]): T[] {
  return JSON.parse(JSON.stringify(value)) as T[];
}

export function EditorialSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [saved, setSaved] = useState({
    aboutVision: settings.aboutVision,
    aboutVisionFr: settings.aboutVisionFr || "",
    aboutVisionRw: settings.aboutVisionRw || "",
    aboutMission: settings.aboutMission,
    aboutMissionFr: settings.aboutMissionFr || "",
    aboutMissionRw: settings.aboutMissionRw || "",
    aboutStory: settings.aboutStory,
    aboutStoryFr: settings.aboutStoryFr || "",
    aboutStoryRw: settings.aboutStoryRw || "",
    aboutCoreValues: copyDeep(settings.aboutCoreValues),
    aboutMilestones: copyDeep(settings.aboutMilestones),
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"en" | "fr" | "rw">("en");
  const [translating, setTranslating] = useState(false);

  const dirty =
    draft.aboutVision !== saved.aboutVision ||
    draft.aboutVisionFr !== saved.aboutVisionFr ||
    draft.aboutVisionRw !== saved.aboutVisionRw ||
    draft.aboutMission !== saved.aboutMission ||
    draft.aboutMissionFr !== saved.aboutMissionFr ||
    draft.aboutMissionRw !== saved.aboutMissionRw ||
    draft.aboutStory !== saved.aboutStory ||
    draft.aboutStoryFr !== saved.aboutStoryFr ||
    draft.aboutStoryRw !== saved.aboutStoryRw ||
    JSON.stringify(draft.aboutCoreValues) !== JSON.stringify(saved.aboutCoreValues) ||
    JSON.stringify(draft.aboutMilestones) !== JSON.stringify(saved.aboutMilestones);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function handleAutoTranslate() {
    if (!draft.aboutMission.trim() && !draft.aboutVision.trim() && !draft.aboutStory.trim()) {
      toast.error("Please enter English mission, vision, or narrative first.");
      return;
    }
    setTranslating(true);
    try {
      const [mFr, mRw, vFr, vRw, sFr, sRw] = await Promise.all([
        draft.aboutMission.trim() ? translateText(draft.aboutMission, "en", "fr") : null,
        draft.aboutMission.trim() ? translateText(draft.aboutMission, "en", "rw") : null,
        draft.aboutVision.trim() ? translateText(draft.aboutVision, "en", "fr") : null,
        draft.aboutVision.trim() ? translateText(draft.aboutVision, "en", "rw") : null,
        draft.aboutStory.trim() ? translateText(draft.aboutStory, "en", "fr") : null,
        draft.aboutStory.trim() ? translateText(draft.aboutStory, "en", "rw") : null,
      ]);
      setDraft((d) => ({
        ...d,
        ...(mFr?.translated_text && { aboutMissionFr: mFr.translated_text.trim() }),
        ...(mRw?.translated_text && { aboutMissionRw: mRw.translated_text.trim() }),
        ...(vFr?.translated_text && { aboutVisionFr: vFr.translated_text.trim() }),
        ...(vRw?.translated_text && { aboutVisionRw: vRw.translated_text.trim() }),
        ...(sFr?.translated_text && { aboutStoryFr: sFr.translated_text.trim() }),
        ...(sRw?.translated_text && { aboutStoryRw: sRw.translated_text.trim() }),
      }));
      toast.success("✨ Mission, Vision & Narrative translated into French and Kinyarwanda!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Translation failed"));
    } finally {
      setTranslating(false);
    }
  }

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
    <SettingsSection
      icon={FileText}
      title={t("aboutCmsTitle")}
      description={t("aboutCmsDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/40">
          <span className="text-xs font-semibold text-muted-foreground">
            Foundational Purpose Statements
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAutoTranslate}
              disabled={translating || (!draft.aboutMission.trim() && !draft.aboutVision.trim() && !draft.aboutStory.trim())}
              className="h-6 text-[10px] px-2 text-primary hover:text-primary font-medium gap-1"
              title="Translate English mission, vision and story into French and Kinyarwanda using AI"
            >
              {translating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span>✨ Auto-Translate</span>
            </Button>
            <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40 text-[10px]">
              {(["en", "fr", "rw"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setTab(l)}
                  className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                    tab === l
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`settings-about-mission-${tab}`} className="text-xs font-semibold">
            {t("aboutMission")} ({tab.toUpperCase()})
          </Label>
          {tab === "en" && (
            <Textarea
              id="settings-about-mission-en"
              rows={2}
              value={draft.aboutMission}
              onChange={(e) => set("aboutMission", e.target.value)}
              placeholder="e.g. To democratize access to justice in Rwanda by providing a trusted, transparent, and legally compliant digital platform..."
            />
          )}
          {tab === "fr" && (
            <Textarea
              id="settings-about-mission-fr"
              rows={2}
              value={draft.aboutMissionFr}
              onChange={(e) => set("aboutMissionFr", e.target.value)}
              placeholder="Ex. Démocratiser l'accès à la justice au Rwanda..."
            />
          )}
          {tab === "rw" && (
            <Textarea
              id="settings-about-mission-rw"
              rows={2}
              value={draft.aboutMissionRw}
              onChange={(e) => set("aboutMissionRw", e.target.value)}
              placeholder="Urugero: Kwegereza abaturage bose ubutabera binyuze mu gukoresha ikoranabuhanga ryizewe..."
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`settings-about-vision-${tab}`} className="text-xs font-semibold">
            {t("aboutVision")} ({tab.toUpperCase()})
          </Label>
          {tab === "en" && (
            <Textarea
              id="settings-about-vision-en"
              rows={2}
              value={draft.aboutVision}
              onChange={(e) => set("aboutVision", e.target.value)}
              placeholder="e.g. To become the premier digital legal infrastructure for East Africa..."
            />
          )}
          {tab === "fr" && (
            <Textarea
              id="settings-about-vision-fr"
              rows={2}
              value={draft.aboutVisionFr}
              onChange={(e) => set("aboutVisionFr", e.target.value)}
              placeholder="Ex. Devenir la première infrastructure juridique numérique en Afrique de l'Est..."
            />
          )}
          {tab === "rw" && (
            <Textarea
              id="settings-about-vision-rw"
              rows={2}
              value={draft.aboutVisionRw}
              onChange={(e) => set("aboutVisionRw", e.target.value)}
              placeholder="Urugero: Kuba umusingi ukomeye w'ikoranabuhanga mu by'amategeko muri Afurika y'Uburasirazuba..."
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`settings-about-story-${tab}`} className="text-xs font-semibold">
            {t("aboutStory")} ({tab.toUpperCase()})
          </Label>
          {tab === "en" && (
            <Textarea
              id="settings-about-story-en"
              rows={4}
              value={draft.aboutStory}
              onChange={(e) => set("aboutStory", e.target.value)}
              placeholder="e.g. Founded in Kigali, MyJudicial was established to bridge the gap between citizens seeking trusted counsel and certified Rwanda Bar Association advocates..."
            />
          )}
          {tab === "fr" && (
            <Textarea
              id="settings-about-story-fr"
              rows={4}
              value={draft.aboutStoryFr}
              onChange={(e) => set("aboutStoryFr", e.target.value)}
              placeholder="Ex. Fondé à Kigali, MyJudicial a été créé pour combler le fossé entre les citoyens..."
            />
          )}
          {tab === "rw" && (
            <Textarea
              id="settings-about-story-rw"
              rows={4}
              value={draft.aboutStoryRw}
              onChange={(e) => set("aboutStoryRw", e.target.value)}
              placeholder="Urugero: Yashinzwe i Kigali, MyJudicial yashyizweho kugira ngo ifashe abaturage kubona ubufasha bw'abavoka b'umwuga..."
            />
          )}
        </div>

        <div className="pt-6 border-t border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-foreground">{t("coreValues")}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{t("coreValuesDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
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
          </div>

          <div className="space-y-3">
            {draft.aboutCoreValues.map((val, idx) => (
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
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-foreground">{t("milestones")}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{t("milestonesDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
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
          </div>

          <div className="space-y-3">
            {draft.aboutMilestones.map((ms, idx) => (
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
            ))}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}