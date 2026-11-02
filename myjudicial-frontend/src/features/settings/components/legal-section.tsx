"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { HelpCircle, Plus, ShieldCheck, Trash2, Sparkles, Loader2 } from "lucide-react";
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
import { translateText } from "@/lib/api/ai";
import type { SettingsData, SupplementalFaqItem } from "../settings";

interface Props {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

function copyDeep<T>(value: T[]): T[] {
  return JSON.parse(JSON.stringify(value)) as T[];
}

export function LegalSection({ settings, onSaved }: Props) {
  const t = useTranslations("admin.settings");
  const [disclaimerTab, setDisclaimerTab] = useState<"en" | "fr" | "rw">("en");
  const [translatingDisclaimer, setTranslatingDisclaimer] = useState(false);

  const [saved, setSaved] = useState({
    legalEffectiveDate: settings.legalEffectiveDate,
    dpoContactEmail: settings.dpoContactEmail,
    legalDisclaimer: settings.legalDisclaimer,
    legalDisclaimerFr: settings.legalDisclaimerFr || "",
    legalDisclaimerRw: settings.legalDisclaimerRw || "",
    supplementalFaqs: copyDeep(settings.supplementalFaqs),
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.legalEffectiveDate !== saved.legalEffectiveDate ||
    draft.dpoContactEmail !== saved.dpoContactEmail ||
    draft.legalDisclaimer !== saved.legalDisclaimer ||
    draft.legalDisclaimerFr !== saved.legalDisclaimerFr ||
    draft.legalDisclaimerRw !== saved.legalDisclaimerRw ||
    JSON.stringify(draft.supplementalFaqs) !== JSON.stringify(saved.supplementalFaqs);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setFaqs = (faqs: SupplementalFaqItem[]) => set("supplementalFaqs", faqs);

  const handleAutoTranslateDisclaimer = async () => {
    const textToTranslate = draft.legalDisclaimer?.trim();
    if (!textToTranslate) {
      toast.error("Please enter an English disclaimer first");
      return;
    }
    setTranslatingDisclaimer(true);
    try {
      const [frRes, rwRes] = await Promise.all([
        translateText(textToTranslate, "en", "fr"),
        translateText(textToTranslate, "en", "rw"),
      ]);
      setDraft((d) => ({
        ...d,
        legalDisclaimerFr: frRes.translated_text?.trim() || d.legalDisclaimerFr,
        legalDisclaimerRw: rwRes.translated_text?.trim() || d.legalDisclaimerRw,
      }));
      toast.success("Disclaimer translated into French and Kinyarwanda! Review and save.");
    } catch {
      toast.error("AI translation service unavailable. You can enter translations manually.");
    } finally {
      setTranslatingDisclaimer(false);
    }
  };

  const handleAddFaq = () =>
    setFaqs([...draft.supplementalFaqs, { id: `faq_${Date.now()}`, question: "", answer: "", category: "general" }]);

  const handleUpdateFaq = (index: number, field: keyof SupplementalFaqItem, value: string) => {
    const updated = copyDeep(draft.supplementalFaqs);
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const handleRemoveFaq = (index: number) =>
    setFaqs(draft.supplementalFaqs.filter((_, i) => i !== index));

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await saveSettingsSection(draft);
      setSaved({ ...draft, supplementalFaqs: copyDeep(draft.supplementalFaqs) });
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
      icon={ShieldCheck}
      title={t("legalDisclaimerTitle")}
      description={t("legalDisclaimerDesc")}
      dirty={dirty}
      saving={saving}
      onSave={handleSave}
      saveLabel={t("saveChanges")}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="settings-legal-effective" className="text-xs font-semibold">
              {t("legalEffectiveDate")}
            </Label>
            <Input
              id="settings-legal-effective"
              value={draft.legalEffectiveDate}
              onChange={(e) => set("legalEffectiveDate", e.target.value)}
              placeholder="September 2026"
            />
            <p className="text-[11px] text-muted-foreground">{t("legalEffectiveDateDesc")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-dpo-email" className="text-xs font-semibold">
              {t("dpoEmail")}
            </Label>
            <Input
              id="settings-dpo-email"
              type="email"
              value={draft.dpoContactEmail}
              onChange={(e) => set("dpoContactEmail", e.target.value)}
              placeholder="legal@myjudicial.com"
            />
            <p className="text-[11px] text-muted-foreground">{t("dpoEmailDesc")}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="settings-legal-disclaimer" className="text-xs font-semibold">
              {t("legalDisclaimer")}
            </Label>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAutoTranslateDisclaimer}
                disabled={translatingDisclaimer || !draft.legalDisclaimer?.trim()}
                className="h-6 text-[10px] px-2 text-primary hover:text-primary font-medium gap-1"
                title="Translate English disclaimer into French and Kinyarwanda using AI"
              >
                {translatingDisclaimer ? (
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
                    onClick={() => setDisclaimerTab(l)}
                    className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                      disclaimerTab === l
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

          {disclaimerTab === "en" && (
            <Textarea
              id="settings-legal-disclaimer"
              rows={3}
              value={draft.legalDisclaimer}
              onChange={(e) => set("legalDisclaimer", e.target.value)}
              placeholder="MyJudicial is an independent technology marketplace connecting clients with accredited legal practitioners. MyJudicial does not directly provide legal representation."
            />
          )}
          {disclaimerTab === "fr" && (
            <Textarea
              id="settings-legal-disclaimer-fr"
              rows={3}
              value={draft.legalDisclaimerFr}
              onChange={(e) => set("legalDisclaimerFr", e.target.value)}
              placeholder="MyJudicial est une plateforme technologique indépendante mettant en relation les justiciables avec des praticiens du droit accrédités..."
            />
          )}
          {disclaimerTab === "rw" && (
            <Textarea
              id="settings-legal-disclaimer-rw"
              rows={3}
              value={draft.legalDisclaimerRw}
              onChange={(e) => set("legalDisclaimerRw", e.target.value)}
              placeholder="MyJudicial ni urubuga rw'ikoranabuhanga ruhuza abakiriya n'abanyamategeko bemewe..."
            />
          )}
          <p className="text-[11px] text-muted-foreground">
            {disclaimerTab === "en"
              ? "Disclaimer displayed on public footers and checkout disclaimers."
              : disclaimerTab === "fr"
              ? "Avis de non-responsabilité en français (laisser vide pour la traduction standard)."
              : "Icyitonderwa mu Kinyarwanda (sigamo ubusa ngo ukoreshe ibisanzwe)."}
          </p>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">{t("supplementalFaqs")}</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("supplementalFaqsDesc")}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddFaq}
              className="text-xs h-8 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("addFaq")}
            </Button>
          </div>

          {draft.supplementalFaqs.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
              {t("noFaqs")}
            </div>
          ) : (
            <div className="space-y-3">
              {draft.supplementalFaqs.map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className="p-3.5 sm:p-4 rounded-xl border border-border bg-muted/20 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-3 sm:grid-cols-3 flex-1">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          {t("faqQuestion")}
                        </Label>
                        <Input
                          value={faq.question}
                          onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                          placeholder="e.g. Can non-citizens register on MyJudicial?"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          {t("faqCategory")}
                        </Label>
                        <Select
                          value={faq.category || "general"}
                          onValueChange={(cat) => handleUpdateFaq(idx, "category", cat)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="clients">Clients & Bookings</SelectItem>
                            <SelectItem value="experts">Advocates & Experts</SelectItem>
                            <SelectItem value="billing">Payments & Escrow</SelectItem>
                            <SelectItem value="security">Security & Compliance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFaq(idx)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 mt-5"
                      title={t("removeFaq")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("faqAnswer")}
                    </Label>
                    <Textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                      placeholder="e.g. Yes, anyone residing in Rwanda or internationally seeking legal services in Rwanda can register."
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}