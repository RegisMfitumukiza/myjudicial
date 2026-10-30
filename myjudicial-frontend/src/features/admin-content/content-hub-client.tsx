"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import {
  Briefcase,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  Shield,
  ShieldCheck,
  Trash2,
  WifiOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageHeader, FormSectionSkeleton } from "@/shared/components/dashboard";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import { fetchAdminSettings, saveSettingsSection } from "@/features/settings/api";
import { DEFAULTS, normalizeSettings, type SettingsData, type SupplementalFaqItem } from "@/features/settings/settings";
import { ContentEditor } from "./content-editor";
import { CareersHub } from "@/features/admin-careers/careers-hub";

const VALID_TABS = ["pages", "faqs", "careers", "governance"] as const;
type ContentTab = (typeof VALID_TABS)[number];

function copyDeep<T>(val: T[]): T[] {
  return JSON.parse(JSON.stringify(val)) as T[];
}

export function ContentHubClient() {
  const t = useTranslations("adminContent");
  const tSettings = useTranslations("admin.settings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tabParam = searchParams.get("tab") as ContentTab | null;
  const activeTab: ContentTab =
    tabParam && VALID_TABS.includes(tabParam)
      ? tabParam
      : "pages";

  const [loading, setLoading] = useState(true);
  const [backendUnreachable, setBackendUnreachable] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
  const [savingFaqs, setSavingFaqs] = useState(false);
  const [faqDraft, setFaqDraft] = useState<SupplementalFaqItem[]>([]);
  const [govDraft, setGovDraft] = useState({
    legalEffectiveDate: "",
    dpoContactEmail: "",
    legalDisclaimer: "",
  });
  const [savingGov, setSavingGov] = useState(false);

  const loadData = () => {
    setLoading(true);
    setBackendUnreachable(false);
    fetchAdminSettings()
      .then((data) => {
        const norm = normalizeSettings(data);
        setSettings(norm);
        setFaqDraft(copyDeep(norm.supplementalFaqs));
        setGovDraft({
          legalEffectiveDate: norm.legalEffectiveDate || "",
          dpoContactEmail: norm.dpoContactEmail || "",
          legalDisclaimer: norm.legalDisclaimer || "",
        });
      })
      .catch(() => setBackendUnreachable(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newTab === "pages") {
        params.delete("tab");
      } else {
        params.set("tab", newTab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const handleAddFaq = () => {
    setFaqDraft([
      ...faqDraft,
      { id: `faq_${Date.now()}`, question: "", answer: "", category: "general" },
    ]);
  };

  const handleUpdateFaq = (index: number, field: keyof SupplementalFaqItem, value: string) => {
    const updated = copyDeep(faqDraft);
    updated[index] = { ...updated[index], [field]: value };
    setFaqDraft(updated);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqDraft(faqDraft.filter((_, i) => i !== index));
  };

  const handleSaveFaqs = async () => {
    setSavingFaqs(true);
    try {
      const updated = await saveSettingsSection({ supplementalFaqs: faqDraft });
      setSettings(normalizeSettings(updated));
      setFaqDraft(copyDeep(updated.supplementalFaqs));
      toast.success(tSettings("settingsSaved"));
    } catch {
      toast.error(tSettings("settingsUnavailable"));
    } finally {
      setSavingFaqs(false);
    }
  };

  const handleSaveGovernance = async () => {
    setSavingGov(true);
    try {
      const updated = await saveSettingsSection(govDraft);
      setSettings(normalizeSettings(updated));
      toast.success(tSettings("settingsSaved"));
    } catch {
      toast.error(tSettings("settingsUnavailable"));
    } finally {
      setSavingGov(false);
    }
  };

  const faqsDirty = JSON.stringify(faqDraft) !== JSON.stringify(settings.supplementalFaqs);
  const govDirty =
    govDraft.legalEffectiveDate !== settings.legalEffectiveDate ||
    govDraft.dpoContactEmail !== settings.dpoContactEmail ||
    govDraft.legalDisclaimer !== settings.legalDisclaimer;

  if (loading) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
        <PageHeader
          title="Content Management System (CMS)"
          description="Author, localize, and publish public-facing content, statutory legal policies, careers, and FAQs."
        />
        <FormSectionSkeleton fields={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Content Management System (CMS)"
          description="Author, localize, and publish public-facing content, statutory legal policies, careers, and FAQs across English, French, and Kinyarwanda."
        />

        {/* Quick Public Previews */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
            <Link href="/about" target="_blank" rel="noopener noreferrer">
              About
              <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link href="/careers" target="_blank" rel="noopener noreferrer">
              Careers
              <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link href="/faqs" target="_blank" rel="noopener noreferrer">
              FAQs
              <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </div>

      {backendUnreachable && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">{tSettings("serverUnreachable")}</p>
              <p className="text-xs text-muted-foreground">{tSettings("showingDefaults")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-3 w-3 mr-1" /> {tSettings("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Content Domain Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="w-full overflow-x-auto pb-1.5 scrollbar-none">
          <TabsList className="inline-flex h-10 sm:h-11 items-center justify-start rounded-xl border border-border bg-muted/60 p-1 text-muted-foreground w-max min-w-full sm:min-w-0 sm:w-auto gap-1">
            <TabsTrigger
              value="pages"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <FileText size={14} className="shrink-0" />
              <span>Content Pages</span>
            </TabsTrigger>

            <TabsTrigger
              value="faqs"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <HelpCircle size={14} className="shrink-0" />
              <span>Public FAQs</span>
            </TabsTrigger>

            <TabsTrigger
              value="careers"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Briefcase size={14} className="shrink-0" />
              <span>Careers Hub</span>
            </TabsTrigger>

            <TabsTrigger
              value="governance"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <ShieldCheck size={14} className="shrink-0" />
              <span>Statutory Governance</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: All Content Pages (7 slugs) ── */}
        <TabsContent value="pages" className="w-full space-y-6 outline-none">
          <ContentEditor />
        </TabsContent>

        {/* ── Tab 2: Public FAQs Moderation ── */}
        <TabsContent value="faqs" className="w-full space-y-6 outline-none">
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  {tSettings("supplementalFaqs")}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {tSettings("supplementalFaqsDesc")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFaq}
                  className="text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {tSettings("addFaq")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveFaqs}
                  disabled={savingFaqs || !faqsDirty}
                  className="h-8 text-xs font-semibold"
                >
                  {savingFaqs ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  {tSettings("saveChanges")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {faqDraft.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  {tSettings("noFaqs")}
                </div>
              ) : (
                faqDraft.map((faq, idx) => (
                  <div
                    key={faq.id || idx}
                    className="p-3.5 sm:p-4 rounded-xl border border-border bg-muted/20 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid gap-3 sm:grid-cols-3 flex-1">
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            {tSettings("faqQuestion")}
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
                            {tSettings("faqCategory")}
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
                        title={tSettings("removeFaq")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        {tSettings("faqAnswer")}
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
        </TabsContent>

        {/* ── Tab 3: Careers Hub ── */}
        <TabsContent value="careers" className="w-full space-y-6 outline-none">
          <CareersHub
            initialSettings={settings}
            onSaved={(updated) => setSettings(normalizeSettings(updated))}
          />
        </TabsContent>

        {/* ── Tab 4: Statutory Legal Headers ── */}
        <TabsContent value="governance" className="w-full space-y-6 outline-none">
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  Statutory Regulatory Headers & Disclaimers
                </CardTitle>
                <CardDescription className="text-xs">
                  Global regulatory parameters injected into the header and footer of legal pages under Rwandan Law.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleSaveGovernance}
                disabled={savingGov || !govDirty}
                className="h-8 text-xs font-semibold self-start sm:self-auto"
              >
                {savingGov ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {tSettings("saveChanges")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gov-effective-date" className="text-xs font-semibold">
                    {tSettings("legalEffectiveDate")}
                  </Label>
                  <Input
                    id="gov-effective-date"
                    value={govDraft.legalEffectiveDate}
                    onChange={(e) =>
                      setGovDraft((d) => ({ ...d, legalEffectiveDate: e.target.value }))
                    }
                    placeholder="September 2026"
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {tSettings("legalEffectiveDateDesc")}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gov-dpo-email" className="text-xs font-semibold">
                    {tSettings("dpoEmail")}
                  </Label>
                  <Input
                    id="gov-dpo-email"
                    type="email"
                    value={govDraft.dpoContactEmail}
                    onChange={(e) =>
                      setGovDraft((d) => ({ ...d, dpoContactEmail: e.target.value }))
                    }
                    placeholder="legal@myjudicial.com"
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {tSettings("dpoEmailDesc")}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="gov-disclaimer" className="text-xs font-semibold">
                  {tSettings("legalDisclaimer")}
                </Label>
                <Textarea
                  id="gov-disclaimer"
                  rows={3}
                  value={govDraft.legalDisclaimer}
                  onChange={(e) =>
                    setGovDraft((d) => ({ ...d, legalDisclaimer: e.target.value }))
                  }
                  placeholder="MyJudicial is an independent technology marketplace connecting clients with accredited legal practitioners. MyJudicial does not directly provide legal representation."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
