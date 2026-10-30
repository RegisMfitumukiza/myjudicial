"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import {
  Building2,
  FileText,
  Globe,
  RefreshCw,
  Sliders,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader, FormSectionSkeleton } from "@/shared/components/dashboard";
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

const SYSTEM_TABS = ["operations", "brand", "contact", "seo"] as const;
type SettingsTab = (typeof SYSTEM_TABS)[number];
const STORAGE_KEY_SETTINGS_TAB = "myjudicial_admin_settings_tab";

function getInitialSettingsTab(searchParam: string | null): SettingsTab {
  if (searchParam && SYSTEM_TABS.includes(searchParam as SettingsTab)) {
    return searchParam as SettingsTab;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS_TAB) as SettingsTab | null;
      if (stored && SYSTEM_TABS.includes(stored)) {
        return stored;
      }
    } catch {}
  }
  return "operations";
}

function SettingsContent() {
  const t = useTranslations("admin.settings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tabParam = searchParams.get("tab");
  const isLegacyTab = tabParam === "about" || tabParam === "careers" || tabParam === "legal" || tabParam === "content";
  
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => getInitialSettingsTab(tabParam));

  const [loading, setLoading] = useState(true);
  const [backendUnreachable, setBackendUnreachable] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);

  // Synchronize active tab across refreshes, deep-links, and client navigation
  useEffect(() => {
    if (tabParam && SYSTEM_TABS.includes(tabParam as SettingsTab)) {
      setActiveTab(tabParam as SettingsTab);
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS_TAB, tabParam);
      } catch {}
    } else if (!tabParam) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS_TAB) as SettingsTab | null;
        const target = stored && SYSTEM_TABS.includes(stored) ? stored : "operations";
        setActiveTab(target);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", target);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } catch {}
    }
  }, [tabParam, pathname, router, searchParams]);

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
    const valid = SYSTEM_TABS.includes(newTab as SettingsTab) ? (newTab as SettingsTab) : "operations";
    setActiveTab(valid);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS_TAB, valid);
    } catch {}
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", valid);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <FormSectionSkeleton fields={6} />
        <FormSectionSkeleton fields={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title={t("title")} description={t("subtitle")} />

        {/* Quick link to CMS */}
        <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold self-start sm:self-auto shrink-0">
          <Link href="/admin/dashboard/content">
            <FileText className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Page Content (CMS) &rarr;
          </Link>
        </Button>
      </div>

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

      {/* ── Legacy Migration Notice Banner (if arriving via old bookmarked ?tab=about|careers|legal) ── */}
      {isLegacyTab && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Content Management has moved!</p>
              <p className="text-muted-foreground">
                Public pages, Careers, and Legal policies are now managed in the dedicated Content & CMS Hub.
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="h-8 text-xs font-semibold shrink-0">
            <Link
              href={
                tabParam === "careers"
                  ? "/admin/dashboard/content?tab=careers"
                  : tabParam === "legal"
                  ? "/admin/dashboard/content?tab=governance"
                  : "/admin/dashboard/content?tab=pages"
              }
            >
              Go to Content Hub &rarr;
            </Link>
          </Button>
        </div>
      )}

      {/* ── Focused System Configuration Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="w-full overflow-x-auto pb-1.5 scrollbar-none">
          <TabsList className="inline-flex h-10 sm:h-11 items-center justify-start rounded-xl border border-border bg-muted/60 p-1 text-muted-foreground w-max min-w-full sm:min-w-0 sm:w-auto gap-1">
            <TabsTrigger
              value="operations"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Sliders size={14} className="shrink-0" />
              <span>{t("tabOperations")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="brand"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Sparkles size={14} className="shrink-0" />
              <span>{t("tabBrand")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="contact"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Building2 size={14} className="shrink-0" />
              <span>{t("tabContact")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="seo"
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all shrink-0"
            >
              <Globe size={14} className="shrink-0" />
              <span>{t("tabSeo")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: Platform Operations & Escrow Rules ── */}
        <TabsContent value="operations" className="w-full space-y-8 outline-none">
          <PlatformOperationsSection settings={settings} onSaved={applySaved} />
          <ConsultationRulesSection settings={settings} onSaved={applySaved} />
        </TabsContent>

        {/* ── Tab 2: Brand Identity (Logo, Favicon, Tagline, Copyright) ── */}
        <TabsContent value="brand" className="w-full space-y-6 outline-none">
          <BrandIdentitySection settings={settings} onSaved={applySaved} />
        </TabsContent>

        {/* ── Tab 3: Contact Channels, Headquarters & Socials ── */}
        <TabsContent value="contact" className="w-full space-y-8 outline-none">
          <ContactChannelsSection settings={settings} onSaved={applySaved} />
          <HeadquartersSection settings={settings} onSaved={applySaved} />
          <SocialMediaSection settings={settings} onSaved={applySaved} />
        </TabsContent>

        {/* ── Tab 4: Global Search Engine Optimization (SEO) ── */}
        <TabsContent value="seo" className="w-full space-y-6 outline-none">
          <SeoSettingsSection settings={settings} onSaved={applySaved} />
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
          <FormSectionSkeleton fields={6} />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
