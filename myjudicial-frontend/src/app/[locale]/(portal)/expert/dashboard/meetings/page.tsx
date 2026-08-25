"use client";

import { useRouter } from "@/i18n/routing";
import { Info, Video } from "lucide-react";
import { useGetBookings } from "@/api/generated";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonList,
} from "@/shared/components/dashboard";

const JOINABLE_WINDOW_MS = 15 * 60 * 1000; // can join 15 min before start

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MeetingsPage() {
  const t = useTranslations("expertDashboard_meetings");
  const router = useRouter();
  const { data, isLoading, isError } = useGetBookings({ limit: 100 });

  const meetings = (data?.status === 200 ? data.data.data : [])
    .filter((b) => b.status === "CONFIRMED" || b.status === "ACTIVE")
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

  function handleJoin(bookingId: string) {
    router.push(`/expert/dashboard/consultations/${bookingId}/join`);
  }

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        className="[&>div>h1]:capitalize"
      />

      <div className="mt-6">
        {isLoading ? (
          <SkeletonList count={2} />
        ) : isError ? (
          <ErrorState message={t("failedToLoad")} />
        ) : meetings.length > 0 ? (
          <div className="flex flex-col gap-4">
            {meetings.map((m) => {
              const clientName = m.citizen ? `${m.citizen.firstName} ${m.citizen.lastName}` : "Client";
              const startsInMs = new Date(m.scheduledStart).getTime() - Date.now();
              const canJoin = m.status === "ACTIVE" || (startsInMs <= JOINABLE_WINDOW_MS);

              return (
                <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Video size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.service?.name ?? t("consultation")} &middot; {formatScheduled(m.scheduledStart)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleJoin(m.id)} disabled={!canJoin}>
                      <Video size={14} aria-hidden="true" />
                      {canJoin ? t("joinCall") : t("notYetTime")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Info} title={t("noMeetings")} description={t("noMeetingsDesc")} />
        )}
      </div>
    </div>
  );
}
