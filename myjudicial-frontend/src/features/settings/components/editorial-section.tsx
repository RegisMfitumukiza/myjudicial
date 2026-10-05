"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FileText, Plus, RefreshCw, Trash2 } from "lucide-react";
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
    aboutMission: settings.aboutMission,
    aboutStory: settings.aboutStory,
    aboutCoreValues: copyDeep(settings.aboutCoreValues),
    aboutMilestones: copyDeep(settings.aboutMilestones),
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.aboutVision !== saved.aboutVision ||
    draft.aboutMission !== saved.aboutMission ||
    draft.aboutStory !== saved.aboutStory ||
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
        <div className="space-y-1.5">
          <Label htmlFor="settings-about-mission" className="text-xs font-semibold">
            {t("aboutMission")}
          </Label>
          <Textarea
            id="settings-about-mission"
            rows={2}
            value={draft.aboutMission}
            onChange={(e) => set("aboutMission", e.target.value)}
            placeholder="e.g. To democratize access to justice in Rwanda by providing a trusted, transparent, and legally compliant digital platform..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-about-vision" className="text-xs font-semibold">
            {t("aboutVision")}
          </Label>
          <Textarea
            id="settings-about-vision"
            rows={2}
            value={draft.aboutVision}
            onChange={(e) => set("aboutVision", e.target.value)}
            placeholder="e.g. To become the premier digital legal infrastructure for East Africa..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-about-story" className="text-xs font-semibold">
            {t("aboutStory")}
          </Label>
          <Textarea
            id="settings-about-story"
            rows={4}
            value={draft.aboutStory}
            onChange={(e) => set("aboutStory", e.target.value)}
            placeholder="e.g. Founded in Kigali, MyJudicial was established to bridge the gap between citizens seeking trusted counsel and certified Rwanda Bar Association advocates..."
          />
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