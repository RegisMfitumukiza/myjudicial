import { Suspense } from "react";
import { SearchPageClient } from "@/features/search/components/search-page-client";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Legal Experts | MyJudicial",
  description: "Find verified lawyers and legal experts by specialty, location, rating, and availability. Book consultations instantly.",
  openGraph: {
    title: "Search Legal Experts | MyJudicial",
    description: "Find verified lawyers and legal experts by specialty, location, and availability.",
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}

function SearchPageFallback() {
  const t = useTranslations("search");
  return (
    <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
      {t("loadingSearch")}
    </div>
  );
}
