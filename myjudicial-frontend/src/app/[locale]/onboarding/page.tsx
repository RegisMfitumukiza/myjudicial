"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import {
  Scale, ArrowRight, ArrowLeft, CheckCircle2, Check,
  MapPin, Calendar, Clock, Banknote, FileText, Mic,
  Home, Briefcase, ShieldCheck, Users, Globe, Building2,
  Video, Phone, UserCheck, Star, Sparkles,
} from "lucide-react";

/* ─────────────────────────────────────── types ── */
type Role = "CITIZEN" | "EXPERT";

/* ─────────────────────────────────────── data ── */
const PRACTICE_AREAS = [
  { id: "family",     icon: Users },
  { id: "property",   icon: Home },
  { id: "criminal",   icon: ShieldCheck },
  { id: "business",   icon: Building2 },
  { id: "employment", icon: Briefcase },
  { id: "immigration",icon: Globe },
  { id: "debt",       icon: Banknote },
  { id: "other",      icon: FileText },
] as const;

const RWANDA_DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro", "Rucibishu",
];

const EXPERT_TITLES = [
  "advocate",
  "notary",
  "consultant",
  "stateAttorney",
  "inHouse",
  "other",
];

const EXPERIENCE_OPTIONS = [
  { value: "0-2",  id: "0-2" },
  { value: "3-5",  id: "3-5" },
  { value: "6-10", id: "6-10" },
  { value: "10+",  id: "10plus" },
];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/* ─────────────────────────────────────── citizen data ── */
type CitizenData = {
  practiceArea: string;
  situation: string;
  urgency: string;
  district: string;
  language: string;
  consultationType: string;
  budget: string;
};

const CITIZEN_DEFAULTS: CitizenData = {
  practiceArea: "",
  situation: "",
  urgency: "moderate",
  district: "",
  language: "english",
  consultationType: "video",
  budget: "flexible",
};

/* ─────────────────────────────────────── expert data ── */
type ExpertData = {
  barNumber: string;
  experience: string;
  title: string;
  firmName: string;
  practiceAreas: string[];
  primaryArea: string;
  hourlyRate: string;
  availableDays: string[];
  sessionTypes: string[];
  bio: string;
  languages: string[];
};

const EXPERT_DEFAULTS: ExpertData = {
  barNumber: "",
  experience: "",
  title: "",
  firmName: "",
  practiceAreas: [],
  primaryArea: "",
  hourlyRate: "",
  availableDays: ["mon", "tue", "wed", "thu", "fri"],
  sessionTypes: ["video"],
  bio: "",
  languages: ["english"],
};

/* ─────────────────────────────────────── progress bar ── */
function ProgressBar({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div className="mb-10">
      {/* Step dots */}
      <div className="flex items-center">
        {labels.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      done
                        ? "bg-brand-blue text-on-brand"
                        : active
                        ? "border-2 border-brand-blue bg-white text-brand-blue shadow-sm shadow-brand-blue/20"
                        : "border-2 border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                  {done ? <Check size={13} /> : n}
                </div>
                <span className={`hidden whitespace-nowrap text-[10px] font-semibold sm:block ${active ? "text-brand-blue" : done ? "text-slate-600" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 transition-colors ${step > n ? "bg-brand-blue" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      {/* thin full-width progress bar */}
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-blue transition-all duration-500"
          style={{ width: `${((step - 1) / (total - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── nav footer ── */
function NavFooter({
  step, totalSteps, onBack, onNext, nextLabel, nextDisabled = false, isLast = false, t,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLast?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const resolvedNextLabel = nextLabel || t("nav.continue");
  return (
    <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-0"
      >
        <ArrowLeft size={15} /> {t("nav.back")}
      </button>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">{t("nav.step", { step, total: totalSteps })}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-on-brand transition disabled:opacity-40 ${
            isLast ? "bg-brand-dark hover:bg-brand-dark/90" : "bg-brand-blue hover:bg-brand-blue/90"
          }`}
        >
          {resolvedNextLabel} {!isLast && <ArrowRight size={15} />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── CITIZEN STEPS ── */

function CitizenStep1({ data, setData }: { data: CitizenData; setData: (d: CitizenData) => void }) {
  const t = useTranslations("onboarding");
  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <Sparkles size={11} /> {t("practiceArea.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("practiceArea.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{t("practiceArea.subtitle")}</p>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRACTICE_AREAS.map(({ id, icon: Icon }) => {
          const selected = data.practiceArea === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setData({ ...data, practiceArea: id })}
              className={`relative flex flex-col items-start gap-2.5 rounded-2xl border-2 p-4 text-left transition-all ${
                selected
                  ? "border-brand-blue bg-blue-50 shadow-sm shadow-brand-blue/10"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {selected && (
                <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue">
                  <Check size={10} className="text-on-brand" />
                </span>
              )}
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-brand-blue text-on-brand" : "bg-slate-100 text-slate-500"}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className={`text-[13px] font-bold ${selected ? "text-brand-blue" : "text-brand-dark"}`}>{t(`practiceArea.${id}`)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{t(`practiceArea.${id}Desc`)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CitizenStep2({ data, setData }: { data: CitizenData; setData: (d: CitizenData) => void }) {
  const t = useTranslations("onboarding");
  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <FileText size={11} /> {t("citizenStep2.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("citizenStep2.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">
        {t("citizenStep2.subtitle")}
      </p>

      <div className="mt-7 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("citizenStep2.briefLabel")}</label>
          <textarea
            rows={5}
            value={data.situation}
            onChange={(e) => setData({ ...data, situation: e.target.value })}
            placeholder={t("citizenStep2.placeholder")}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm text-brand-dark placeholder-slate-400 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{t("citizenStep2.characters", { count: data.situation.length })}</p>
        </div>

        <div>
          <label className="mb-2.5 block text-sm font-semibold text-brand-dark">{t("citizenStep2.urgencyLabel")}</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: "not-urgent",  label: t("citizenStep2.notUrgent"),    color: "text-green-600", bg: "bg-green-50",  border: "border-green-300" },
              { value: "moderate",    label: t("citizenStep2.moderate"),      color: "text-amber-600", bg: "bg-amber-50",  border: "border-amber-300" },
              { value: "urgent",      label: t("citizenStep2.urgent"),        color: "text-orange-600",bg: "bg-orange-50", border: "border-orange-300" },
              { value: "emergency",   label: t("citizenStep2.emergency"),     color: "text-red-600",   bg: "bg-red-50",    border: "border-red-300" },
            ].map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setData({ ...data, urgency: u.value })}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-all ${
                  data.urgency === u.value ? `${u.bg} ${u.border} ${u.color}` : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-blue" />
          <p className="text-xs leading-5 text-slate-600">
            {t("citizenStep2.privacyNote")}
          </p>
        </div>
      </div>
    </div>
  );
}

function CitizenStep3({ data, setData }: { data: CitizenData; setData: (d: CitizenData) => void }) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <MapPin size={11} /> {t("citizenStep3.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("citizenStep3.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{t("citizenStep3.subtitle")}</p>

      <div className="mt-7 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("citizenStep3.districtLabel")}</label>
          <select
            value={data.district}
            onChange={(e) => setData({ ...data, district: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
          >
            <option value="">{t("citizenStep3.selectDistrict")}</option>
            <optgroup label={t("citizenStep3.kigaliCity")}>
              {["Gasabo", "Kicukiro", "Nyarugenge"].map((d) => <option key={d} value={d}>{d}</option>)}
            </optgroup>
            <optgroup label={t("citizenStep3.otherDistricts")}>
              {RWANDA_DISTRICTS.slice(3).map((d) => <option key={d} value={d}>{d}</option>)}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="mb-2.5 block text-sm font-semibold text-brand-dark">{t("citizenStep3.languageLabel")}</label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "kinyarwanda", label: tCommon("languages.rw") },
              { value: "english",     label: tCommon("languages.en") },
              { value: "french",      label: tCommon("languages.fr") },
            ].map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => setData({ ...data, language: lang.value })}
                className={`flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                  data.language === lang.value
                    ? "border-brand-blue bg-blue-50 text-brand-blue"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {data.language === lang.value && <Check size={13} />}
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CitizenStep4({ data, setData }: { data: CitizenData; setData: (d: CitizenData) => void }) {
  const t = useTranslations("onboarding");
  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <Calendar size={11} /> {t("citizenStep4.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("citizenStep4.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{t("citizenStep4.subtitle")}</p>

      <div className="mt-7 space-y-7">
        <div>
          <label className="mb-2.5 block text-sm font-semibold text-brand-dark">{t("citizenStep4.consultationTypeLabel")}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "video",     label: t("citizenStep4.videoCall"),    icon: Video,    desc: t("citizenStep4.videoDesc") },
              { value: "phone",     label: t("citizenStep4.phoneCall"),    icon: Phone,    desc: t("citizenStep4.phoneDesc") },
              { value: "inperson",  label: t("citizenStep4.inPerson"),     icon: MapPin,   desc: t("citizenStep4.inPersonDesc") },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setData({ ...data, consultationType: value })}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all ${
                  data.consultationType === value
                    ? "border-brand-blue bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${data.consultationType === value ? "bg-brand-blue text-on-brand" : "bg-slate-100 text-slate-500"}`}>
                  <Icon size={18} />
                </div>
                <p className={`text-sm font-bold ${data.consultationType === value ? "text-brand-blue" : "text-brand-dark"}`}>{label}</p>
                <p className="text-[11px] text-slate-400">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-sm font-semibold text-brand-dark">{t("citizenStep4.budgetLabel")}</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: "under20k",  label: t("citizenStep4.under20k") },
              { value: "20k-50k",   label: t("citizenStep4.20to50k") },
              { value: "50k-100k",  label: t("citizenStep4.50to100k") },
              { value: "flexible",  label: t("citizenStep4.flexible") },
            ].map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setData({ ...data, budget: b.value })}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                  data.budget === b.value
                    ? "border-brand-blue bg-blue-50 text-brand-blue"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CitizenStep5() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 size={40} className="text-green-600" />
      </div>
      <h2 className="mt-5 text-3xl font-extrabold text-brand-dark">{t("citizenStep5.title")}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
        {t("citizenStep5.subtitle")}
      </p>

      <div className="mx-auto mt-8 max-w-sm space-y-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("citizenStep5.whatHappensNext")}</p>
          <ul className="mt-3 space-y-2.5">
            {[
              t("citizenStep5.browseLawyers"),
              t("citizenStep5.bookConsultation"),
              t("citizenStep5.paySecurely"),
              t("citizenStep5.getAdvice"),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-brand-dark">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/lawyers")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-on-brand hover:bg-brand-blue/90"
        >
          {t("citizenStep5.browseButton")} <ArrowRight size={15} />
        </button>
        <button
          type="button"
          onClick={() => router.push("/ai")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-blue px-6 py-3 text-sm font-bold text-brand-blue hover:bg-blue-50"
        >
          <Sparkles size={15} /> {t("citizenStep5.aiButton")}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── EXPERT STEPS ── */

function ExpertStep1({ data, setData }: { data: ExpertData; setData: (d: ExpertData) => void }) {
  const t = useTranslations("onboarding");
  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <UserCheck size={11} /> {t("expertStep1.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("expertStep1.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">
        {t("expertStep1.subtitle")}
      </p>

      <div className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expertStep1.barNumberLabel")}</label>
            <input
              type="text"
              value={data.barNumber}
              onChange={(e) => setData({ ...data, barNumber: e.target.value })}
              placeholder={t("expertStep1.barPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark placeholder-slate-400 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expertStep1.titleLabel")}</label>
            <select
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
            >
              <option value="">{t("expertStep1.selectTitle")}</option>
              {EXPERT_TITLES.map((titleKey) => <option key={titleKey} value={titleKey}>{t(`titles.${titleKey}`)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expertStep1.experienceLabel")}</label>
          <div className="grid grid-cols-4 gap-3">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setData({ ...data, experience: opt.value })}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                  data.experience === opt.value
                    ? "border-brand-blue bg-blue-50 text-brand-blue"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {t(`experience.${opt.id}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
            {t("expertStep1.firmLabel")} <span className="font-normal text-slate-400">{t("expertStep1.firmOptional")}</span>
          </label>
          <input
            type="text"
            value={data.firmName}
            onChange={(e) => setData({ ...data, firmName: e.target.value })}
            placeholder={t("expertStep1.firmPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark placeholder-slate-400 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
          />
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-5 text-slate-600">
            {t("expertStep1.verificationNote")}
          </p>
        </div>
      </div>
    </div>
  );
}

function ExpertStep2({ data, setData }: { data: ExpertData; setData: (d: ExpertData) => void }) {
  const t = useTranslations("onboarding");
  const toggle = (id: string) => {
    const areas = data.practiceAreas.includes(id)
      ? data.practiceAreas.filter((a) => a !== id)
      : [...data.practiceAreas, id];
    const primary = areas.length === 1 ? areas[0] : data.practiceAreas.includes(data.primaryArea) && areas.includes(data.primaryArea) ? data.primaryArea : "";
    setData({ ...data, practiceAreas: areas, primaryArea: primary });
  };

  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <Briefcase size={11} /> {t("expertStep2.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("expertStep2.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{t("expertStep2.subtitle")}</p>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRACTICE_AREAS.map(({ id, icon: Icon }) => {
          const selected = data.practiceAreas.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all ${
                selected ? "border-brand-blue bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {selected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue">
                  <Check size={10} className="text-on-brand" />
                </span>
              )}
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-brand-blue text-on-brand" : "bg-slate-100 text-slate-500"}`}>
                <Icon size={16} />
              </div>
              <p className={`text-[12px] font-bold ${selected ? "text-brand-blue" : "text-brand-dark"}`}>{t(`practiceArea.${id}`)}</p>
            </button>
          );
        })}
      </div>

      {data.practiceAreas.length > 1 && (
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-brand-dark">{t("expertStep2.primaryLabel")}</label>
          <div className="flex flex-wrap gap-2">
            {data.practiceAreas.map((id) => {
              const area = PRACTICE_AREAS.find((a) => a.id === id);
              if (!area) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setData({ ...data, primaryArea: id })}
                  className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-all ${
                    data.primaryArea === id ? "border-brand-blue bg-brand-blue text-on-brand" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {data.primaryArea === id && <Star size={10} />} {t(`practiceArea.${id}`)}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">{t("expertStep2.primaryDesc")}</p>
        </div>
      )}
    </div>
  );
}

function ExpertStep3({ data, setData }: { data: ExpertData; setData: (d: ExpertData) => void }) {
  const t = useTranslations("onboarding");
  const toggleDay = (d: string) => {
    setData({
      ...data,
      availableDays: data.availableDays.includes(d)
        ? data.availableDays.filter((x) => x !== d)
        : [...data.availableDays, d],
    });
  };
  const toggleSession = (type: string) => {
    setData({
      ...data,
      sessionTypes: data.sessionTypes.includes(type)
        ? data.sessionTypes.filter((x) => x !== type)
        : [...data.sessionTypes, type],
    });
  };

  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <Clock size={11} /> {t("expertStep3.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("expertStep3.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{t("expertStep3.subtitle")}</p>

      <div className="mt-7 space-y-7">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expertStep3.hourlyRateLabel")}</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">RWF</span>
            <input
              type="number"
              value={data.hourlyRate}
              onChange={(e) => setData({ ...data, hourlyRate: e.target.value })}
              placeholder="e.g. 45000"
              min={5000}
              step={1000}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-sm text-brand-dark shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">{t("expertStep3.platformAverage")}</p>
        </div>

        <div>
          <label className="mb-2.5 block text-sm font-semibold text-brand-dark">{t("expertStep3.availableDaysLabel")}</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`h-10 w-12 rounded-xl border-2 text-sm font-bold transition-all ${
                  data.availableDays.includes(d)
                    ? "border-brand-blue bg-brand-blue text-on-brand"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                {t(`days.${d}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-sm font-semibold text-brand-dark">{t("expertStep3.sessionTypesLabel")}</label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "video",    label: t("expertStep3.videoCall"),   icon: Video },
              { value: "phone",    label: t("expertStep3.phoneCall"),   icon: Phone },
              { value: "inperson", label: t("expertStep3.inPerson"),    icon: MapPin },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleSession(value)}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  data.sessionTypes.includes(value)
                    ? "border-brand-blue bg-blue-50 text-brand-blue"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertStep4({ data, setData }: { data: ExpertData; setData: (d: ExpertData) => void }) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const toggleLang = (lang: string) => {
    setData({
      ...data,
      languages: data.languages.includes(lang)
        ? data.languages.filter((l) => l !== lang)
        : [...data.languages, lang],
    });
  };

  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
        <Mic size={11} /> {t("expertStep4.badge")}
      </div>
      <h2 className="text-2xl font-extrabold text-brand-dark">{t("expertStep4.title")}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{t("expertStep4.subtitle")}</p>

      <div className="mt-7 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-brand-dark">{t("expertStep4.bioLabel")}</label>
          <textarea
            rows={5}
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            placeholder={t("expertStep4.bioPlaceholder")}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm text-brand-dark placeholder-slate-400 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{t("expertStep4.bioCharacters", { count: data.bio.length })}</p>
        </div>

        <div>
          <label className="mb-2.5 block text-sm font-semibold text-brand-dark">{t("expertStep4.languagesLabel")}</label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "kinyarwanda", label: tCommon("languages.rw") },
              { value: "english",     label: tCommon("languages.en") },
              { value: "french",      label: tCommon("languages.fr") },
              { value: "swahili",     label: tCommon("languages.sw") },
            ].map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => toggleLang(lang.value)}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  data.languages.includes(lang.value)
                    ? "border-brand-blue bg-blue-50 text-brand-blue"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {data.languages.includes(lang.value) && <Check size={12} />}
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-dark">
            {t("expertStep4.photoLabel")} <span className="font-normal text-slate-400">{t("expertStep4.photoOptional")}</span>
          </label>
          <div className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 hover:border-brand-blue hover:bg-blue-50/30">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                <UserCheck size={22} className="text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-600">{t("expertStep4.photoClick")}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{t("expertStep4.photoFormats")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertStep5() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
        <ShieldCheck size={38} className="text-amber-600" />
      </div>
      <h2 className="mt-5 text-3xl font-extrabold text-brand-dark">{t("expertStep5.title")}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
        {t("expertStep5.subtitle")} <strong>{t("expertStep5.verificationDays")}</strong>.
      </p>

      <div className="mx-auto mt-8 max-w-sm space-y-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("expertStep5.verificationSteps")}</p>
          <ul className="mt-3 space-y-3">
            {[
              { label: t("expertStep5.profileReceived"),            done: true  },
              { label: t("expertStep5.barVerification"), done: false },
              { label: t("expertStep5.profileReview"),       done: false },
              { label: t("expertStep5.profileLive"),            done: false },
            ].map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-brand-dark" : "border-2 border-border"}`}>
                  {s.done && <Check size={10} className="text-on-brand" />}
                </div>
                <span className={s.done ? "font-semibold text-brand-dark" : "text-slate-500"}>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm text-brand-dark">
          {t("expertStep5.emailNotice")}
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/client/dashboard")}
        className="mx-auto mt-8 flex items-center gap-2 rounded-xl bg-brand-blue px-8 py-3 text-sm font-bold text-on-brand hover:bg-brand-blue/90"
      >
        {t("expertStep5.dashboardButton")} <ArrowRight size={15} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────── MAIN PAGE ── */

function OnboardingWizard() {
  const params = useSearchParams();
  const role = (params.get("role") ?? "CITIZEN") as Role;
  const t = useTranslations("onboarding");

  const [step, setStep] = useState(1);
  const [citizenData, setCitizenData] = useState<CitizenData>(CITIZEN_DEFAULTS);
  const [expertData, setExpertData]   = useState<ExpertData>(EXPERT_DEFAULTS);

  const totalSteps = 5;
  const labels     = role === "CITIZEN"
    ? [t("progress.legalArea"), t("progress.situation"), t("progress.location"), t("progress.preferences"), t("progress.done")]
    : [t("progress.background"), t("progress.specialisations"), t("progress.rates"), t("progress.profile"), t("progress.done")];

  const canNext = (): boolean => {
    if (role === "CITIZEN") {
      if (step === 1) return citizenData.practiceArea !== "";
      if (step === 3) return citizenData.district !== "";
      return true;
    } else {
      if (step === 1) return expertData.barNumber.trim() !== "" && expertData.experience !== "" && expertData.title !== "";
      if (step === 2) return expertData.practiceAreas.length > 0;
      if (step === 3) return expertData.hourlyRate !== "" && expertData.sessionTypes.length > 0;
      return true;
    }
  };

  const renderStep = () => {
    if (role === "CITIZEN") {
      switch (step) {
        case 1: return <CitizenStep1 data={citizenData} setData={setCitizenData} />;
        case 2: return <CitizenStep2 data={citizenData} setData={setCitizenData} />;
        case 3: return <CitizenStep3 data={citizenData} setData={setCitizenData} />;
        case 4: return <CitizenStep4 data={citizenData} setData={setCitizenData} />;
        case 5: return <CitizenStep5 />;
      }
    } else {
      switch (step) {
        case 1: return <ExpertStep1 data={expertData} setData={setExpertData} />;
        case 2: return <ExpertStep2 data={expertData} setData={setExpertData} />;
        case 3: return <ExpertStep3 data={expertData} setData={setExpertData} />;
        case 4: return <ExpertStep4 data={expertData} setData={setExpertData} />;
        case 5: return <ExpertStep5 />;
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
              <Scale size={15} className="text-on-brand" />
            </div>
            <span className="font-bold text-foreground">
              MyJudicial
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="compact" />
            {step < totalSteps && (
              <Link href="/client/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                {t("nav.skipForNow")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Wizard body */}
      <div className="flex flex-1 justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-3xl">
          {/* Role banner */}
          <div className={`mb-6 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            role === "CITIZEN" ? "bg-blue-50 text-brand-blue" : "bg-amber-50 text-amber-700"
          }`}>
            {role === "CITIZEN" ? <Users size={14} /> : <Briefcase size={14} />}
            {role === "CITIZEN" ? t("role.citizenBanner") : t("role.expertBanner")}
          </div>

          <ProgressBar step={step} total={totalSteps} labels={labels} />

          {/* Step content card */}
          <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-10">
            {renderStep()}

            {step < totalSteps && (
              <NavFooter
                step={step}
                totalSteps={totalSteps}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
                onNext={() => setStep((s) => Math.min(totalSteps, s + 1))}
                nextDisabled={!canNext()}
                nextLabel={step === totalSteps - 1 ? (role === "CITIZEN" ? t("nav.finishSetup") : t("nav.submitApplication")) : t("nav.continue")}
                isLast={step === totalSteps - 1}
                t={t}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingWizard />
    </Suspense>
  );
}
