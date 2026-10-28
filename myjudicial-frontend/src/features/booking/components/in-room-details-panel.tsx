"use client";

import React from "react";
import {
  Calendar,
  Clock,
  User,
  Shield,
  FileText,
  X,
} from "lucide-react";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { useTranslations, useLocale } from "next-intl";

interface InRoomDetailsPanelProps {
  bookingId: string;
  isExpert?: boolean;
  onClose: () => void;
}

export function InRoomDetailsPanel({
  bookingId,
  isExpert = false,
  onClose,
}: InRoomDetailsPanelProps) {
  const t = useTranslations("expertDashboard_consultation-room");
  const locale = useLocale();
  const { booking, isLoading } = useBooking(bookingId);

  if (isLoading || !booking) {
    return (
      <div className="flex h-full w-full flex-col bg-gray-950 text-white border-l border-white/10 p-6 items-center justify-center">
        <p className="text-xs text-white/50">{t("loadingDetails", { defaultValue: "Loading session details..." })}</p>
      </div>
    );
  }

  const clientName = booking.citizen
    ? `${booking.citizen.firstName} ${booking.citizen.lastName}`.trim()
    : t("client");
  const expertName = booking.expert?.displayName ?? t("legalExpert");
  const counterpartyName = isExpert ? clientName : expertName;

  return (
    <div className="flex h-full w-full flex-col bg-gray-950 text-white border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            {t("inRoomDetailsTitle", { defaultValue: "Consultation Details" })}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          title={t("closePanel", { defaultValue: "Close panel" })}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 text-xs">
        {/* Counterparty Card */}
        <div className="rounded-xl border border-white/10 bg-gray-900/60 p-3.5 space-y-2">
          <p className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
            {isExpert ? t("client") : t("expert")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">
              <User size={18} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{counterpartyName}</p>
              <p className="text-[11px] text-white/50">{booking.service?.name ?? t("consultation")}</p>
            </div>
          </div>
        </div>

        {/* Schedule & Duration */}
        <div className="rounded-xl border border-white/10 bg-gray-900/60 p-3.5 space-y-2.5">
          <p className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
            {t("sessionSchedule", { defaultValue: "Schedule" })}
          </p>
          <div className="flex items-center gap-2 text-white/80">
            <Calendar size={14} className="text-blue-400 shrink-0" />
            <span>
              {new Date(booking.scheduledStart).toLocaleDateString(locale, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Clock size={14} className="text-blue-400 shrink-0" />
            <span>
              {new Date(booking.scheduledStart).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {new Date(booking.scheduledEnd).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Client Situation Notes */}
        {booking.citizenNotes && (
          <div className="rounded-xl border border-white/10 bg-gray-900/60 p-3.5 space-y-2">
            <p className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
              {t("clientSituationNotes", { defaultValue: "Client Situation & Brief" })}
            </p>
            <p className="text-white/80 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
              {booking.citizenNotes}
            </p>
          </div>
        )}

        {/* Dispute Protection & Escrow Badge */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
            <Shield size={14} />
            <span>{t("escrowProtectedTitle", { defaultValue: "Escrow & Dispute Protected" })}</span>
          </div>
          <p className="text-[11px] text-emerald-200/70 leading-relaxed">
            {t("escrowProtectedDesc", {
              defaultValue:
                "Consultation funds remain held in escrow. Payout occurs only after explicit advocate delivery confirmation and a 24-hour review window.",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
