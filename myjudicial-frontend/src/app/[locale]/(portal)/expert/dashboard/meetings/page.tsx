"use client";

import { useRouter } from "@/i18n/routing";
import { Info, Video } from "lucide-react";
import { useGetBookings } from "@/api/generated";
import { useTranslations } from "next-intl";

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
      <div className="mb-6 shrink-0">
        <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100 capitalize">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-brand-border/20 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t("failedToLoad")}
        </div>
      ) : meetings.length > 0 ? (
        <div className="flex flex-col gap-4">
          {meetings.map((m) => {
            const clientName = m.citizen ? `${m.citizen.firstName} ${m.citizen.lastName}` : "Client";
            const startsInMs = new Date(m.scheduledStart).getTime() - Date.now();
            const canJoin = m.status === "ACTIVE" || (startsInMs <= JOINABLE_WINDOW_MS);

            return (
              <div key={m.id} className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20">
                    <Video size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">{clientName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {m.service?.name ?? t("consultation")} &middot; {formatScheduled(m.scheduledStart)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoin(m.id)}
                    disabled={!canJoin}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Video size={14} />
                    {canJoin ? t("joinCall") : t("notYetTime")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-gray-800/30">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100/80 dark:bg-gray-800/80 shadow-sm">
              <Info size={28} className="text-slate-400 dark:text-gray-500" />
            </div>
            <h2 className="text-[16px] font-bold text-brand-dark dark:text-gray-100 mb-2">{t("noMeetings")}</h2>
            <p className="text-[13px] text-slate-500 dark:text-gray-400 max-w-sm">
              {t("noMeetingsDesc")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
