"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X, Check, Clock, AlertTriangle, Video, Phone, MapPin, Mail, Briefcase, Sparkles, Scale, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useGetExpertsServices,
  usePostExpertsServices,
  usePatchExpertsServicesId,
  useDeleteExpertsServicesId,
  getGetExpertsServicesQueryKey,
  useGetExpertsCompliance,
  type LegalService,
  type CreateServiceDto,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";

type ServiceForm = {
  name: string;
  description: string;
  category: string;
  customCategory: string;
  deliveryMode: string;
  durationMin: number;
  flatFee: number;
  currency: string;
  isActive: boolean;
};

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  category: "consultation",
  customCategory: "",
  deliveryMode: "VIDEO",
  durationMin: 60,
  flatFee: 0,
  currency: "RWF",
  isActive: true,
};

const CATEGORIES = [
  { value: "consultation", label: "Consultation" },
  { value: "document_review", label: "Document Review" },
  { value: "contract_drafting", label: "Contract Drafting" },
  { value: "court_representation", label: "Court Representation" },
  { value: "legal_advice", label: "Legal Advice" },
  { value: "mediation", label: "Mediation" },
  { value: "other", label: "Other / Custom" },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

type ServicePreset = {
  id: string;
  labelKey: string;
  nameKey: string;
  descKey: string;
  category: string;
  deliveryMode: string;
  durationMin: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
};

const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: "case_assessment",
    labelKey: "presetCaseAssessment",
    nameKey: "presetCaseAssessmentName",
    descKey: "presetCaseAssessmentDesc",
    category: "consultation",
    deliveryMode: "VIDEO",
    durationMin: 30,
    icon: Clock,
  },
  {
    id: "contract_review",
    labelKey: "presetContractReview",
    nameKey: "presetContractReviewName",
    descKey: "presetContractReviewDesc",
    category: "document_review",
    deliveryMode: "EMAIL",
    durationMin: 60,
    icon: FileText,
  },
  {
    id: "demand_letter",
    labelKey: "presetDemandLetter",
    nameKey: "presetDemandLetterName",
    descKey: "presetDemandLetterDesc",
    category: "contract_drafting",
    deliveryMode: "EMAIL",
    durationMin: 60,
    icon: AlertTriangle,
  },
  {
    id: "contract_drafting",
    labelKey: "presetContractDrafting",
    nameKey: "presetContractDraftingName",
    descKey: "presetContractDraftingDesc",
    category: "contract_drafting",
    deliveryMode: "EMAIL",
    durationMin: 120,
    icon: Pencil,
  },
  {
    id: "court_hearing",
    labelKey: "presetCourtHearing",
    nameKey: "presetCourtHearingName",
    descKey: "presetCourtHearingDesc",
    category: "court_representation",
    deliveryMode: "IN_PERSON",
    durationMin: 180,
    icon: Scale,
  },
  {
    id: "mediation",
    labelKey: "presetMediation",
    nameKey: "presetMediationName",
    descKey: "presetMediationDesc",
    category: "mediation",
    deliveryMode: "IN_PERSON",
    durationMin: 90,
    icon: Briefcase,
  },
];

const CURRENCIES = ["RWF", "USD", "EUR"];

function serviceToForm(s: LegalService): ServiceForm {
  const isStandard = CATEGORIES.some((c) => c.value === s.category);
  return {
    name: s.name,
    description: s.description ?? "",
    category: isStandard ? (s.category ?? "consultation") : "other",
    customCategory: isStandard ? "" : (s.category ?? ""),
    deliveryMode: s.deliveryMode ?? "VIDEO",
    durationMin: s.durationMin,
    flatFee: s.flatFee,
    currency: s.currency,
    isActive: s.isActive,
  };
}

const PHONE_OR_URL_REGEX = /(\+?\d[\d\s-]{6,}\d|https?:\/\/|www\.|\S+@\S+\.\S+)/i;

function normalizeCategoryName(raw: string): string {
  const ACRONYMS = new Set(["RRA", "IP", "NGO", "VAT", "ICT", "LLC", "EAC", "AI", "ADR"]);
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function validate(form: ServiceForm, t: any): string | null {
  if (!form.name.trim() || form.name.trim().length < 2) return t("validationName");
  if (form.category === "other" && form.customCategory.trim()) {
    const custom = form.customCategory.trim();
    if (custom.length < 3) return t("validationCustomCategoryTooShort");
    if (custom.length > 50) return t("validationCustomCategoryTooLong");
    if (PHONE_OR_URL_REGEX.test(custom)) return t("validationCustomCategoryNoContact");
  }
  if (form.durationMin < 15 || form.durationMin > 480) return t("validationDuration");
  if (form.flatFee <= 0) return t("validationFee");
  return null;
}

function toPayload(form: ServiceForm): CreateServiceDto {
  const finalCategory =
    form.category === "other" && form.customCategory.trim()
      ? normalizeCategoryName(form.customCategory)
      : form.category;

  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    category: finalCategory as any,
    deliveryMode: form.deliveryMode as CreateServiceDto["deliveryMode"],
    durationMin: form.durationMin,
    flatFee: form.flatFee,
    currency: form.currency,
    isActive: form.isActive,
  };
}

function groupServicesByCategory(services: LegalService[]): Map<string, LegalService[]> {
  const groups = new Map<string, LegalService[]>();
  for (const s of services) {
    const cat = s.category ?? "other";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(s);
  }
  return groups;
}

function formatCategoryHeading(category: string, labels: Record<string, string>, tOther: string): string {
  if (labels[category]) return labels[category];
  if (!category || category === "other") return tOther;
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function DeliveryIcon({ mode }: { mode: string }) {
  const icons: Record<string, React.ComponentType<{ size: number }>> = {
    VIDEO: Video,
    PHONE: Phone,
    IN_PERSON: MapPin,
    EMAIL: Mail,
  };
  const Icon = icons[mode] || Video;
  return <Icon size={12} />;
}

function toggleActive(s: LegalService, mutate: (data: { id: string; data: { isActive: boolean } }, options?: any) => void, queryClient: ReturnType<typeof useQueryClient>) {
  mutate(
    { id: s.id, data: { isActive: !s.isActive } },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpertsServicesQueryKey() });
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err));
      },
    }
  );
}

function handleDelete(serviceId: string, mutate: (data: { id: string }, options?: any) => void, queryClient: ReturnType<typeof useQueryClient>, setDeletingId: (id: string | null) => void, t: any) {
  mutate(
    { id: serviceId },
    {
      onSuccess: () => {
        toast.success(t("serviceDeleted"));
        setDeletingId(null);
        queryClient.invalidateQueries({ queryKey: getGetExpertsServicesQueryKey() });
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err));
        setDeletingId(null);
      },
    }
  );
}

export default function ServicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("expertServices");
  const tCommon = useTranslations("common");
  const { data, isLoading, isError, refetch } = useGetExpertsServices();
  const { mutate: createService, isPending: isCreating } = usePostExpertsServices();
  const { mutate: updateService, isPending: isUpdating } = usePatchExpertsServicesId();
  const { mutate: deleteService, isPending: isDeleting } = useDeleteExpertsServicesId();

  const { data: complianceData } = useGetExpertsCompliance();
  const compliance = complianceData?.status === 200 ? complianceData.data.data : null;
  const isUnverified = compliance?.status !== "VERIFIED";

  const services: LegalService[] = data?.status === 200 ? data.data.data : [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  const isSaving = isCreating || isUpdating;
  const editingService = editingId ? services.find((s) => s.id === editingId) : null;
  const isEditingDefault = editingService?.isDefault ?? false;

  const CATEGORY_LABELS: Record<string, string> = {
    consultation: t("category.consultation"),
    document_review: t("category.documentReview"),
    contract_drafting: t("category.contractDrafting"),
    court_representation: t("category.courtRepresentation"),
    legal_advice: t("category.legalAdvice"),
    mediation: t("category.mediation"),
    other: t("category.other"),
  };

  const CATEGORY_ORDER = CATEGORIES.map((c) => c.value);

  const DELIVERY_MODES = [
    { value: "VIDEO", label: t("deliveryMode.video"), icon: Video },
    { value: "PHONE", label: t("deliveryMode.phone"), icon: Phone },
    { value: "IN_PERSON", label: t("deliveryMode.inPerson"), icon: MapPin },
    { value: "EMAIL", label: t("deliveryMode.email"), icon: Mail },
  ];

  const DELIVERY_MODE_LABELS: Record<string, string> = {
    VIDEO: t("deliveryMode.video"),
    PHONE: t("deliveryMode.phone"),
    IN_PERSON: t("deliveryMode.inPerson"),
    EMAIL: t("deliveryMode.email"),
  };

  function applyPreset(preset: ServicePreset) {
    setForm((prev) => ({
      ...prev,
      name: t(preset.nameKey),
      description: t(preset.descKey),
      category: preset.category,
      customCategory: "",
      deliveryMode: preset.deliveryMode,
      durationMin: preset.durationMin,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: LegalService) {
    setEditingId(s.id);
    setForm(serviceToForm(s));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function handleSubmit() {
    const error = validate(form, t);
    if (error) { toast.error(error); return; }

    const payload = toPayload(form);

    if (editingId) {
      updateService(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success(t("saveService"));
            closeForm();
            queryClient.invalidateQueries({ queryKey: getGetExpertsServicesQueryKey() });
          },
          onError: (err) => {
            toast.error(getErrorMessage(err, t("editService")));
          },
        }
      );
    } else {
      createService(
        { data: payload },
        {
          onSuccess: () => {
            toast.success(t("addService"));
            closeForm();
            queryClient.invalidateQueries({ queryKey: getGetExpertsServicesQueryKey() });
          },
          onError: (err) => {
            toast.error(getErrorMessage(err, t("addService")));
          },
        }
      );
    }
  }

  const groupedServices = useMemo(() => groupServicesByCategory(services), [services]);

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus />
            {t("addService")}
          </Button>
        }
      />

      {isUnverified && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertDescription>
            {t("unverifiedNotice")}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <SkeletonList count={3} itemClassName="h-28" />
      ) : isError ? (
        <ErrorState
          message={t("failedToLoad")}
          onRetry={() => refetch()}
        />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t("noServicesAdded")}
          description={t("noServicesDesc")}
        />
      ) : (
        <div className="space-y-8">
          {Array.from(groupedServices.entries())
            .sort(([a], [b]) => {
              const indexA = CATEGORY_ORDER.indexOf(a);
              const indexB = CATEGORY_ORDER.indexOf(b);
              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              return a.localeCompare(b);
            })
            .map(([category, catServices]) => (
              <div key={category}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {formatCategoryHeading(category, CATEGORY_LABELS, t("category.other"))}
                  <span className="ml-2 font-normal text-muted-foreground/70">
                    ({catServices.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {catServices.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Briefcase size={14} className="text-primary/70 shrink-0" />
                            <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                            <StatusBadge
                              tone={s.isActive ? (isUnverified ? "pending" : "active") : "neutral"}
                              title={
                                s.isActive
                                  ? isUnverified
                                    ? t("activePendingTooltip")
                                    : t("activeLiveTooltip")
                                  : t("inactiveTooltip")
                              }
                            >
                              {s.isActive ? (isUnverified ? t("activePending") : t("active")) : t("inactive")}
                            </StatusBadge>
                            {s.isDefault && (
                              <StatusBadge tone="info" title={t("defaultServiceTooltip")}>
                                {t("defaultService")}
                              </StatusBadge>
                            )}
                          </div>
                          {s.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {s.durationMin} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DeliveryIcon mode={s.deliveryMode ?? "VIDEO"} />
                              {DELIVERY_MODE_LABELS[s.deliveryMode ?? "VIDEO"] || t("deliveryMode.video")}
                            </span>
                            <span className="font-semibold text-foreground">
                              {s.flatFee.toLocaleString()} {s.currency}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {!s.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => toggleActive(s, updateService, queryClient)}
                              aria-label={s.isActive ? "Deactivate service" : "Activate service"}
                              title={s.isActive ? "Deactivate" : "Activate"}
                            >
                              {s.isActive ? <X /> : <Check />}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(s)}
                            aria-label="Edit service"
                            title="Edit"
                          >
                            <Pencil />
                          </Button>
                          {!s.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeletingId(deletingId === s.id ? null : s.id)}
                              aria-label="Delete service"
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      </div>

                      {deletingId === s.id && (
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="mb-2 text-xs text-muted-foreground">
                            {t("confirmDelete")}
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="xs" onClick={() => setDeletingId(null)}>
                              {tCommon("cancel")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => handleDelete(s.id, deleteService, queryClient, setDeletingId, t)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                              {t("deleteService")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("editService") : t("addService")}
            </DialogTitle>
          </DialogHeader>

          {!editingId && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={14} className="shrink-0" />
                <span>{t("quickPresetsTitle")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("quickPresetsSubtitle")}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SERVICE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-xs transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus:outline-hidden"
                    >
                      <Icon size={12} className="text-primary/70 shrink-0" />
                      <span>{t(preset.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="service-name">{t("serviceName")}</Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("serviceName")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-description">{t("serviceDescription")}</Label>
              <Textarea
                id="service-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder={t("serviceDescription")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("serviceCategory")}</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{CATEGORY_LABELS[c.value] || c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("deliveryMethod")}</Label>
                <Select
                  value={form.deliveryMode}
                  onValueChange={(value) => setForm({ ...form, deliveryMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="flex items-center gap-1.5">
                          <m.icon size={13} className="text-muted-foreground" />
                          <span>{m.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.category === "other" && (
              <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Label htmlFor="custom-category" className="text-xs font-semibold text-primary">
                  {t("customCategoryLabel")}
                </Label>
                <Input
                  id="custom-category"
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  placeholder={t("customCategoryPlaceholder")}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("customCategoryHelp")}
                </p>
              </div>
            )}

            <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
              {form.deliveryMode === "VIDEO" && t("deliveryModeHelpVideo")}
              {form.deliveryMode === "PHONE" && t("deliveryModeHelpPhone")}
              {form.deliveryMode === "IN_PERSON" && t("deliveryModeHelpInPerson")}
              {form.deliveryMode === "EMAIL" && t("deliveryModeHelpEmail")}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="service-duration">{t("durationMinutes")}</Label>
                <span className="text-[11px] text-muted-foreground">{t("durationHelp")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="service-duration"
                  type="number"
                  min={15}
                  max={480}
                  value={form.durationMin}
                  onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
                  className="w-28"
                />
                <div className="flex flex-wrap gap-1">
                  {DURATION_PRESETS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setForm({ ...form, durationMin: mins })}
                      className={`rounded px-2 py-1 text-xs font-medium transition ${
                        form.durationMin === mins
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-fee">{t("fee")}</Label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Input
                    id="service-fee"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.flatFee}
                    onChange={(e) => setForm({ ...form, flatFee: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    {form.currency}
                  </span>
                </div>
                <Select
                  value={form.currency}
                  onValueChange={(value) => setForm({ ...form, currency: value })}
                >
                  <SelectTrigger className="w-24 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("feeHelp")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                disabled={isEditingDefault}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="isActive" className="text-xs text-muted-foreground">{t("active")} — {t("activeHelp")}</label>
            </div>
            {isEditingDefault && (
              <p className="text-xs text-muted-foreground/80">
                {t("defaultService")} — {t("defaultServiceHelp")}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : editingId ? (
                <Pencil />
              ) : (
                <Plus />
              )}
              {editingId ? t("saveService") : t("addService")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
