"use client";

import { Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdatePresence } from "../hooks/useUpdatePresence";
import type { PresenceStatus } from "../hooks/useAvailability";
import { useTranslations } from "next-intl";

interface PresenceToggleProps {
  currentStatus: PresenceStatus;
}

const PRESENCE_STATUSES: PresenceStatus[] = ["ONLINE", "OFFLINE", "BUSY", "ON_LEAVE"];
const PRESENCE_COLORS: Record<PresenceStatus, { color: string; bgColor: string }> = {
  ONLINE: { color: "text-green-600", bgColor: "bg-green-600" },
  OFFLINE: { color: "text-slate-500", bgColor: "bg-slate-500" },
  BUSY: { color: "text-amber-600", bgColor: "bg-amber-600" },
  ON_LEAVE: { color: "text-red-600", bgColor: "bg-red-600" },
};

export function PresenceToggle({ currentStatus }: PresenceToggleProps) {
  const t = useTranslations("experts");
  const updatePresence = useUpdatePresence();

  const handleStatusChange = async (status: PresenceStatus) => {
    try {
      await updatePresence.mutateAsync(status);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const config = PRESENCE_COLORS[currentStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={updatePresence.isPending}>
          {updatePresence.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Circle className={`h-3 w-3 fill-current ${config.color}`} />
          )}
          <span className={config.color}>{t(`presence.${currentStatus.toLowerCase()}` as any)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PRESENCE_STATUSES.map((status) => {
          const statusConfig = PRESENCE_COLORS[status];
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={status === currentStatus}
            >
              <Circle
                className={`mr-2 h-3 w-3 fill-current ${statusConfig.color}`}
              />
              {t(`presence.${status.toLowerCase()}` as any)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
