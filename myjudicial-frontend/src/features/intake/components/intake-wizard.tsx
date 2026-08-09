"use client";

import { useRef, useState } from "react";
import {
  Camera, Upload, ShieldCheck, Info, FileText, X,
  Lock, FileCheck2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STEPS = [
  { id: 1, label: "Case Brief" },
  { id: 2, label: "Lawyer Selection" },
  { id: 3, label: "Payment" },
];

const TIPS = [
  {
    title: "Key Dates",
    desc: "Mention when the incident occurred or when legal deadlines are approaching.",
  },
  {
    title: "Parties Involved",
    desc: "List names of individuals or organizations relevant to your legal matter.",
  },
  {
    title: "Desired Outcome",
    desc: "What is your main goal? Compensation, mediation, or legal defense?",
  },
];

type UploadedFile = {
  id: string;
  name: string;
  sizeLabel: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IntakeWizard() {
  const t = useTranslations("expertDashboard_intake-wizard");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList).map((f) => ({
      id: `${f.name}-${f.lastModified}-${f.size}`,
      name: f.name,
      sizeLabel: formatSize(f.size),
    }));
    setFiles((prev) => [...prev, ...next]);
    setErrorState(false);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function clearAll() {
    setFiles([]);
    setErrorState(false);
  }

  const canContinue = files.length > 0 && !errorState;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* LEFT: upload card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("uploadBrief")}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{t("dragAndDropSubtitle")}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("iremboPayVerified")}
          </span>
        </div>

        <div className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              isDragOver ? "border-blue-400 bg-blue-50/50" : "border-slate-200"
            )}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-base font-semibold text-slate-900">{t("dragAndDropTitle")}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
              {t("uploadInstruction")}
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="gap-2 rounded-lg border-slate-300 text-sm font-semibold text-slate-700"
              >
                <Upload className="h-4 w-4" /> {t("browseFiles")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="gap-2 rounded-lg border-slate-300 text-sm font-semibold text-slate-700"
              >
                <Camera className="h-4 w-4" /> {t("useCamera")}
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.sizeLabel}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label={`Remove ${f.name}`}
                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errorState && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
              <Info className="h-4 w-4 shrink-0" />
              {t("somethingWentWrong")}
            </div>
          )}

          {/* Dev-only preview state toggles, mirrors states the real upload flow can hit */}
          <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-100 pt-4 text-xs">
            <span className="font-semibold uppercase tracking-widest text-slate-400">{t("previewStates")}</span>
            <button type="button" onClick={clearAll} className="font-semibold text-slate-700 hover:underline">
              {t("reset")}
            </button>
            <button
              type="button"
              onClick={() => setErrorState(true)}
              className="font-semibold text-red-500 hover:underline"
            >
              {t("simulateError")}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
          <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            {t("saveDraft")}
          </button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearAll}
              className="rounded-lg border-slate-300 text-sm font-semibold text-slate-700"
            >
              {t("clearAll")}
            </Button>
            <Button
              type="button"
              disabled={!canContinue}
              className="gap-1.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {t("continueToBooking")} <span aria-hidden>›</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> {t("secureDragDrop")}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> {t("supportsFiles")}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("e2eEncrypted")}
          </span>
        </div>
      </div>

      {/* RIGHT: tips + AI triage */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            <Info className="h-3.5 w-3.5" /> {t("briefingTips")}
          </p>
          <p className="mt-3 text-base font-bold text-slate-900">{t("whatShouldIInclude")}</p>
          <div className="mt-4 space-y-4">
            {TIPS.map((tip, idx) => (
              <div key={tip.title} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t(`tip${idx + 1}Title`)}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{t(`tip${idx + 1}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
              <FileText className="h-3.5 w-3.5" /> {t("aiRecommendationTitle")}
            </p>
            <div className="mt-2 rounded-lg bg-blue-50 p-3">
              <p className="text-sm italic text-blue-900">
                {t("aiRecommendationQuote")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-brand-dark p-5 text-white shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" /> {t("aiPoweredTriage")}
          </span>
          <h3 className="mt-3 text-base font-bold">{t("fastTrack")}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            {t("aiCategorizes")}
          </p>
          <Button
            type="button"
            className="mt-4 w-full rounded-lg bg-white text-sm font-semibold text-brand-dark hover:bg-slate-100"
          >
            {t("learnAboutAi")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { STEPS as INTAKE_STEPS };
