"use client";

import { Calendar, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PresenceToggle } from "@/features/experts/components/presence-toggle";
import { WeeklySchedule } from "@/features/experts/components/weekly-schedule";
import { useAvailability } from "@/features/experts/hooks/useAvailability";

export default function AvailabilityPage() {
  const { data: availability, isLoading, error } = useAvailability();

  // Get current presence status (all slots have same presence)
  const presenceStatus = availability?.[0]?.presenceStatus || "OFFLINE";

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Availability</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your weekly schedule and online status
          </p>
        </div>
        {!isLoading && availability && (
          <PresenceToggle currentStatus={presenceStatus} />
        )}
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load availability. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )}

      {/* Schedule Section */}
      {!isLoading && !error && availability && (
        <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10">
              <Calendar className="h-5 w-5 text-brand-blue" />
            </div>
            <div>
              <h2 className="font-semibold text-brand-dark">Weekly Schedule</h2>
              <p className="text-sm text-slate-600">
                Set your available hours for each day of the week
              </p>
            </div>
          </div>
          <WeeklySchedule availability={availability} />
        </div>
      )}
    </div>
  );
}
