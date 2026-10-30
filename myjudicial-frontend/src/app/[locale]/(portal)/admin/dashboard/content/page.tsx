import { Suspense } from "react";
import type { Metadata } from "next";
import { FormSectionSkeleton } from "@/shared/components/dashboard";
import { ContentHubClient } from "@/features/admin-content/content-hub-client";

export const metadata: Metadata = {
  title: "Content & CMS | Admin Dashboard | MyJudicial",
  robots: { index: false, follow: false },
};

export default function AdminContentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 max-w-7xl mx-auto min-w-0">
          <FormSectionSkeleton fields={6} />
        </div>
      }
    >
      <ContentHubClient />
    </Suspense>
  );
}
