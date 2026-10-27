"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  Briefcase,
  Cog,
  Info,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader, LoadingSpinner } from "@/shared/components/dashboard";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { fetchAdminSettings } from "@/features/settings/api";
import { DEFAULTS, normalizeSettings, type SettingsData } from "@/features/settings/settings";

import { SeoSettingsSection } from "@/features/settings/components/seo-section";
import { BrandIdentitySection } from "@/features/settings/components/brand-section";
import { ContactChannelsSection } from "@/features/settings/components/contact-section";
import { HeadquartersSection } from "@/features/settings/components/location-section";
import { PlatformOperationsSection } from "@/features/settings/components/platform-section";
import { ConsultationRulesSection } from "@/features/settings/components/consultation-section";
import { SocialMediaSection } from "@/features/settings/components/social-section";
import { AboutEditor } from "@/features/settings/components/about-editor";
import { LegalEditor } from "@/features/settings/components/legal-editor";
import { CareersHub } from "@/features/admin-careers/careers-hub";

const VALID_TABS = ["general", "about", "careers", "legal"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function SettingsContent() {
  const t = useTranslations("admin.settings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const activeTab: SettingsTab =
    (tabParam as string) === "content"
      ? "legal"
      : VALID_TABS.includes(tabParam as SettingsTab)
      ? (tabParam as SettingsTab)
      : "general";

  const [loading, setLoading] = useState(true);
  const [backendUnreachable, setBackendUnreachable] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);

  const loadSettings = () => {
    setLoading(true);
    setBackendUnreachable(false);
    fetchAdminSettings()
      .then((data) => setSettings(normalizeSettings(data)))
      .catch(() => setBackendUnreachable(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const applySaved = (updated: SettingsData) => setSettings(normalizeSettings(updated));

  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newTab === "general") {
        params.delete("tab");
      } else {
        params.set("tab", newTab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {backendUnreachable && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("serverUnreachable")}</p>
              <p className="text-xs text-muted-foreground">{t("showingDefaults")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadSettings}>
              <RefreshCw className="h-3 w-3 mr-1" /> {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Domain Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="w-full overflow-x-auto pb-1.5 scrollbar-none">
          <TabsList className="inline-flex h-10 sm:h-11 items-center justify-start rounded-xl border border-border bg-muted/60 p-1 text-muted-foreground w-max min-w-full sm:min-w-0 sm:w-auto gap-1">
            <TabsTrigger
              value="general"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Cog size={14} className="shrink-0" />
              <span>{t("tabGeneral")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="about"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Info size={14} className="shrink-0" />
              <span>{t("tabAbout")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="careers"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Briefcase size={14} className="shrink-0" />
              <span>{t("tabCareers")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="legal"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <ShieldCheck size={14} className="shrink-0" />
              <span>{t("tabLegal")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: General Platform & Operations ── */}
        <TabsContent value="general" className="w-full space-y-8 outline-none">
          <PlatformOperationsSection settings={settings} onSaved={applySaved} />
          <ConsultationRulesSection settings={settings} onSaved={applySaved} />
          <BrandIdentitySection settings={settings} onSaved={applySaved} />
          <SeoSettingsSection settings={settings} onSaved={applySaved} />
          <ContactChannelsSection settings={settings} onSaved={applySaved} />
          <HeadquartersSection settings={settings} onSaved={applySaved} />
          <SocialMediaSection settings={settings} onSaved={applySaved} />
        </TabsContent>

        {/* ── Tab 2: About Platform Editorial ── */}
        <TabsContent value="about" className="w-full space-y-6 outline-none">
          <AboutEditor settings={settings} onSaved={applySaved} />
        </TabsContent>

        {/* ── Tab 3: Careers Hub (Single Source of Truth) ── */}
        <TabsContent value="careers" className="w-full space-y-6 outline-none">
          <CareersHub initialSettings={settings} onSaved={applySaved} />
        </TabsContent>

        {/* ── Tab 4: Legal & Regulatory Policies ── */}
        <TabsContent value="legal" className="w-full space-y-6 outline-none">
          <LegalEditor settings={settings} onSaved={applySaved} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
          <LoadingSpinner />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}