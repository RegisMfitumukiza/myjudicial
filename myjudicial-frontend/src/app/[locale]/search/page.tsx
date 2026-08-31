import { Suspense } from "react";
import { SearchPageClient } from "@/features/search/components/search-page-client";
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
    <main className="min-h-screen bg-background">
      <Suspense fallback={<SearchPageFallback />}>
        <SearchPageClient />
      </Suspense>
    </main>
  );
}

function SearchPageFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
      Loading search...
    </div>
  );
}
