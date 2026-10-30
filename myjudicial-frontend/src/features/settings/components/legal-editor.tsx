"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ExternalLink,
  HelpCircle,
  Loader2,
  Lock,
  Plus,
  Scale,
  Shield,
  ShieldCheck,
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
import type { SettingsData, SupplementalFaqItem } from "../settings";
import { ContentEditor } from "@/features/admin-content/content-editor";

export interface LegalEditorProps {
  settings: SettingsData;
  onSaved: (updated: SettingsData) => void;
}

function copyDeep<T>(value: T[]): T[] {
  return JSON.parse(JSON.stringify(value)) as T[];
}

export function LegalEditor({ settings, onSaved }: LegalEditorProps) {
  const t = useTranslations("admin.settings");

  const [saved, setSaved] = useState({
    legalEffectiveDate: settings.legalEffectiveDate,
    dpoContactEmail: settings.dpoContactEmail,
    legalDisclaimer: settings.legalDisclaimer,
    supplementalFaqs: copyDeep(settings.supplementalFaqs),
  });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const dirty =
    draft.legalEffectiveDate !== saved.legalEffectiveDate ||
    draft.dpoContactEmail !== saved.dpoContactEmail ||
    draft.legalDisclaimer !== saved.legalDisclaimer ||
    JSON.stringify(draft.supplementalFaqs) !== JSON.stringify(saved.supplementalFaqs);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setFaqs = (faqs: SupplementalFaqItem[]) => set("supplementalFaqs", faqs);

  const handleAddFaq = () =>
    setFaqs([
      ...draft.supplementalFaqs,
      { id: `faq_${Date.now()}`, question: "", answer: "", category: "general" },
    ]);

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
    <div className="space-y-6">
      {/* ── Context & Action Banner ── */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-bold text-foreground">{t("legalDisclaimerTitle")}</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 whitespace-nowrap shrink-0">
              Effective: {draft.legalEffectiveDate || "Active"} • {draft.supplementalFaqs.length} FAQs
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{t("legalTabDesc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <Link href="/terms" target="_blank" rel="noopener noreferrer">
                <Scale className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                Terms
                <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                <Shield className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                Privacy
                <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <Link href="/cookies" target="_blank" rel="noopener noreferrer">
                <Lock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                Cookies
                <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
              </Link>
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="h-8 text-xs font-semibold shrink-0"
          >
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {t("saveChanges")}
          </Button>
        </div>
      </div>

      {/* ── Governance & Contact ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Statutory Headers & Disclaimers
          </CardTitle>
          <CardDescription className="text-xs">
            Global regulatory parameters injected into the header and footer of legal pages under Rwandan Law.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="legal-effective-date" className="text-xs font-semibold">
                {t("legalEffectiveDate")}
              </Label>
              <Input
                id="legal-effective-date"
                value={draft.legalEffectiveDate}
                onChange={(e) => set("legalEffectiveDate", e.target.value)}
                placeholder="September 2026"
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">{t("legalEffectiveDateDesc")}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legal-dpo-email" className="text-xs font-semibold">
                {t("dpoEmail")}
              </Label>
              <Input
                id="legal-dpo-email"
                type="email"
                value={draft.dpoContactEmail}
                onChange={(e) => set("dpoContactEmail", e.target.value)}
                placeholder="legal@myjudicial.com"
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">{t("dpoEmailDesc")}</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="legal-disclaimer" className="text-xs font-semibold">
              {t("legalDisclaimer")}
            </Label>
            <Textarea
              id="legal-disclaimer"
              rows={3}
              value={draft.legalDisclaimer}
              onChange={(e) => set("legalDisclaimer", e.target.value)}
              placeholder="MyJudicial is an independent technology marketplace connecting clients with accredited legal practitioners. MyJudicial does not directly provide legal representation."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Supplemental Public FAQs ── */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              {t("supplementalFaqs")}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {t("supplementalFaqsDesc")}
            </CardDescription>
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
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.supplementalFaqs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              {t("noFaqs")}
            </div>
          ) : (
            draft.supplementalFaqs.map((faq, idx) => (
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
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Official Regulatory Policy Documents CMS ── */}
      <div className="space-y-4 pt-6 border-t border-border">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Official Regulatory Policy Documents (CMS)
          </h3>
          <p className="text-xs text-muted-foreground">
            Multi-locale legal document editor with draft & publishing revisions, structured sections, and Table of Contents generation.
          </p>
        </div>

        <ContentEditor embedded />
      </div>
    </div>
  );
}
