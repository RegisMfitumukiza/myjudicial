"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X, Check, Clock, AlertTriangle, Lock, Video, Phone, MapPin, Mail, GripVertical } from "lucide-react";
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

type ServiceForm = {
  name: string;
  description: string;
  category: string;
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
  { value: "other", label: "Other" },
];

const CURRENCIES = ["RWF", "USD", "EUR"];

function serviceToForm(s: LegalService): ServiceForm {
  return {
    name: s.name,
    description: s.description ?? "",
    category: s.category ?? "consultation",
    deliveryMode: s.deliveryMode ?? "VIDEO",
    durationMin: s.durationMin,
    flatFee: s.flatFee,
    currency: s.currency,
    isActive: s.isActive,
  };
}

function validate(form: ServiceForm): string | null {
  if (!form.name.trim() || form.name.trim().length < 2) return "Name must be at least 2 characters.";
  if (form.durationMin < 15 || form.durationMin > 480) return "Duration must be between 15 and 480 minutes.";
  if (form.flatFee <= 0) return "Fee must be a positive number.";
  return null;
}

function toPayload(form: ServiceForm): CreateServiceDto {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    category: form.category as CreateServiceDto["category"],
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
      onError: (err: Error) => {
        toast.error(err.message);
      },
    }
  );
}

function handleDelete(serviceId: string, mutate: (data: { id: string }, options?: any) => void, queryClient: ReturnType<typeof useQueryClient>, setDeletingId: (id: string | null) => void) {
  mutate(
    { id: serviceId },
    {
      onSuccess: () => {
        toast.success("Service deleted.");
        setDeletingId(null);
        queryClient.invalidateQueries({ queryKey: getGetExpertsServicesQueryKey() });
      },
      onError: (err: Error) => {
        toast.error(err.message);
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
  const { data, isLoading, isError } = useGetExpertsServices();
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
    const error = validate(form);
    if (error) { toast.error(error); return; }

    const payload = toPayload(form);

    if (editingId) {
      updateService(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success(t("editService"));
            closeForm();
            queryClient.invalidateQueries({ queryKey: getGetExpertsServicesQueryKey() });
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : t("editService"));
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
            toast.error(err instanceof Error ? err.message : t("addService"));
          },
        }
      );
    }
  }

  const groupedServices = useMemo(() => groupServicesByCategory(services), [services]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark dark:text-white">{t("addService")} & {t("editService").toLowerCase()}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your consultation services, fees, and delivery methods</p>
        </div>
        <button
          onClick={openCreate}
          disabled={isUnverified}
          className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {t("addService")}
        </button>
      </div>

      {isUnverified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle size={16} className="inline mr-1" />
          Your profile is not yet verified. You can manage services, but they won't be visible to clients until verification is complete.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-brand-border/20 bg-brand-dark/5 dark:border-white/20 dark:bg-white/5" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          Failed to load services. Please try again.
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-brand-border/20 bg-white p-10 text-center dark:border-white/20 dark:bg-black">
          <p className="text-sm text-brand-dark/40 dark:text-white/40">
            {t("noServicesAdded")}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groupedServices.entries())
            .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
            .map(([category, catServices]) => (
              <div key={category}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50">
                  {CATEGORY_LABELS[category] || t("category.other")}
                  <span className="ml-2 font-normal text-brand-dark/30 dark:text-white/30">
                    ({catServices.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {catServices.map((s) => (
                    <div key={s.id} className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <GripVertical size={14} className="text-brand-dark/20 dark:text-white/20 cursor-grab" />
                            <h3 className="text-sm font-semibold text-brand-dark dark:text-white">{s.name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                s.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-brand-dark/10 text-brand-dark/60 dark:bg-white/10 dark:text-white/60"
                              }`}
                            >
                              {s.isActive ? t("active") : t("inactive")}
                            </span>
                            {s.isDefault && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {t("defaultService")}
                              </span>
                            )}
                          </div>
                          {s.description && (
                            <p className="ml-6 mt-1 text-xs text-brand-dark/60 dark:text-white/60 line-clamp-2">{s.description}</p>
                          )}
                          <div className="ml-6 mt-2 flex flex-wrap items-center gap-4 text-xs text-brand-dark/60 dark:text-white/60">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {s.durationMin} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DeliveryIcon mode={s.deliveryMode ?? "VIDEO"} />
                              {t(`deliveryMode.${s.deliveryMode?.toLowerCase() ?? "video"}` as any) || "Video Call"}
                            </span>
                            <span className="font-semibold text-brand-dark dark:text-white">
                              {s.flatFee.toLocaleString()} {s.currency}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {s.isDefault ? (
                            <span
                              title="The default service always stays active"
                              className="rounded-lg p-2 text-brand-dark/20 dark:text-white/20"
                            >
                              <Lock size={14} />
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleActive(s, updateService, queryClient)}
                              title={s.isActive ? "Deactivate" : "Activate"}
                              className={`rounded-lg p-2 ${
                                s.isActive
                                  ? "text-brand-dark/40 hover:bg-brand-dark/5 dark:text-white/40 dark:hover:bg-white/10"
                                  : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }`}
                            >
                              {s.isActive ? <X size={14} /> : <Check size={14} />}
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-lg p-2 text-brand-dark/40 hover:bg-brand-dark/5 dark:text-white/40 dark:hover:bg-white/10"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {s.isDefault ? (
                            <span
                              title="The default service can't be deleted"
                              className="rounded-lg p-2 text-brand-dark/20 dark:text-white/20"
                            >
                              <Lock size={14} />
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeletingId(deletingId === s.id ? null : s.id)}
                              className="rounded-lg p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {deletingId === s.id && (
                        <div className="mt-4 border-t border-brand-border/10 pt-4 dark:border-white/10">
                          <p className="mb-2 text-xs text-brand-dark/70 dark:text-white/70">
                            {t("confirmDelete")}
                          </p>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-dark/60 hover:bg-brand-dark/5 dark:text-white/60 dark:hover:bg-white/10"
                            >
                              {tCommon("cancel")}
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, deleteService, queryClient, setDeletingId)}
                              disabled={isDeleting}
                              className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              {t("deleteService")}
                            </button>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-brand-border/20 bg-white p-6 shadow-xl dark:border-white/20 dark:bg-black">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-brand-dark dark:text-white">
                {editingId ? t("editService") : t("addService")}
              </h2>
              <button onClick={closeForm} className="rounded-lg p-1 text-brand-dark/40 hover:bg-brand-dark/5 dark:text-white/40 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-dark/70 dark:text-white/70">{t("serviceName")}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("serviceName")}
                  className="h-10 w-full rounded-lg border border-brand-border/30 bg-white px-3 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-dark/70 dark:text-white/70">{t("serviceDescription")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder={t("serviceDescription")}
                  className="w-full rounded-lg border border-brand-border/30 bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-brand-dark/70 dark:text-white/70">{t("serviceCategory")}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="h-10 w-full rounded-lg border border-brand-border/30 bg-white px-3 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{t(`category.${c.value}` as any) || c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-brand-dark/70 dark:text-white/70">{t("deliveryMethod")}</label>
                  <select
                    value={form.deliveryMode}
                    onChange={(e) => setForm({ ...form, deliveryMode: e.target.value })}
                    className="h-10 w-full rounded-lg border border-brand-border/30 bg-white px-3 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                  >
                    {DELIVERY_MODES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-dark/70 dark:text-white/70">{t("durationMinutes")}</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={form.durationMin}
                  onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
                  className="h-10 w-full rounded-lg border border-brand-border/30 bg-white px-3 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-dark/70 dark:text-white/70">{t("fee")}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.flatFee}
                    onChange={(e) => setForm({ ...form, flatFee: Number(e.target.value) })}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-brand-border/30 bg-white px-3 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                  />
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="h-10 w-20 shrink-0 rounded-lg border border-brand-border/30 bg-white px-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  disabled={isEditingDefault}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-brand-border/30 text-brand-blue focus:ring-brand-blue"
                />
                <label htmlFor="isActive" className="text-xs text-brand-dark/70 dark:text-white/70">{t("active")} - {tCommon("description")}</label>
              </div>
              {isEditingDefault && (
                <p className="text-xs text-brand-dark/50 dark:text-white/50">
                  {t("defaultService")} - {tCommon("description")}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-brand-dark/60 hover:bg-brand-dark/5 dark:text-white/60 dark:hover:bg-white/10"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : editingId ? (
                  <Pencil size={14} />
                ) : (
                  <Plus size={14} />
                )}
                {editingId ? t("saveService") : t("addService")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}