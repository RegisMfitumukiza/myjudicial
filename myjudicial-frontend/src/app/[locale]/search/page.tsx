import { Suspense } from "react";
import { SearchPageClient } from "@/features/search/components/search-page-client";

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
