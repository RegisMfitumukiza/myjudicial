"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Search,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  ArrowRight,
  Briefcase,
  Users,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { PageHeader, LoadingSpinner } from "@/shared/components/dashboard";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";

interface Specialty {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  icon: string | null;
  group: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceCategory {
  category: string;
  isStandard: boolean;
  serviceCount: number;
  activeServiceCount: number;
  expertCount: number;
  sampleServices: string[];
  sampleExperts: string[];
}

const EMPTY_FORM = { slug: "", label: "", description: "", icon: "", group: "", sortOrder: 0 };

const STANDARD_TARGET_CATEGORIES = [
  { value: "consultation", label: "Consultation" },
  { value: "document_review", label: "Document Review" },
  { value: "contract_drafting", label: "Contract Drafting" },
  { value: "court_representation", label: "Court Representation" },
  { value: "legal_advice", label: "Legal Advice" },
  { value: "mediation", label: "Mediation" },
];

export default function SpecialtiesPage() {
  const t = useTranslations("admin.specialties");

  // Tab State: "specialties" (Practice Areas) vs "services" (Service Taxonomy & Promotion)
  const [activeTab, setActiveTab] = useState<"specialties" | "services">("specialties");

  // ── Practice Areas (Specialties) State ──
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [groups, setGroups] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Service Categories State (Pillars 3 & 4) ──
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<"all" | "standard" | "candidate">("all");
  const [serviceMeta, setServiceMeta] = useState({
    standardCount: 0,
    candidateCount: 0,
    totalServices: 0,
  });

  // Promote Dialog State
  const [promoteDialog, setPromoteDialog] = useState<{
    open: boolean;
    category: ServiceCategory | null;
    targetCategory: string;
    notifyExperts: boolean;
    customMessage: string;
    loading: boolean;
  }>({
    open: false,
    category: null,
    targetCategory: "",
    notifyExperts: true,
    customMessage: "",
    loading: false,
  });

  // Merge Dialog State
  const [mergeDialog, setMergeDialog] = useState<{
    open: boolean;
    category: ServiceCategory | null;
    targetCategory: string;
    notifyExperts: boolean;
    customMessage: string;
    loading: boolean;
  }>({
    open: false,
    category: null,
    targetCategory: "consultation",
    notifyExperts: true,
    customMessage: "",
    loading: false,
  });

  // ── Load Practice Specialties ──
  function loadSpecialties() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterGroup !== "all") params.set("group", filterGroup);
    params.set("limit", "100");

    apiFetch<{ data: Specialty[]; meta?: { total: number } }>(`/specialties/admin?${params}`)
      .then((res) => {
        const items = res?.data ?? [];
        setSpecialties(Array.isArray(items) ? items : []);
      })
      .catch(() => toast.error(t("failedToLoad")))
      .finally(() => setLoading(false));
  }

  function loadGroups() {
    apiFetch<{ data: string[] }>("/specialties/admin/groups")
      .then((res) => {
        const g = res?.data ?? [];
        setGroups(Array.isArray(g) ? g : []);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadSpecialties();
    loadGroups();
  }, [search, filterGroup]);

  // ── Load Service Categories ──
  function loadServiceCategories() {
    setServicesLoading(true);
    const params = new URLSearchParams();
    if (serviceSearch.trim()) params.set("search", serviceSearch.trim());
    if (serviceFilter !== "all") params.set("type", serviceFilter);

    apiFetch<{
      data: {
        categories: ServiceCategory[];
        totalStandard: number;
        totalCandidate: number;
        totalServices: number;
      };
    }>(`/admin/service-categories?${params}`)
      .then((res) => {
        const d = res?.data;
        if (d) {
          setServiceCategories(d.categories ?? []);
          setServiceMeta({
            standardCount: d.totalStandard ?? 0,
            candidateCount: d.totalCandidate ?? 0,
            totalServices: d.totalServices ?? 0,
          });
        }
      })
      .catch(() => toast.error(t("failedToLoad")))
      .finally(() => setServicesLoading(false));
  }

  useEffect(() => {
    if (activeTab === "services") {
      loadServiceCategories();
    }
  }, [activeTab, serviceSearch, serviceFilter]);

  // ── Handlers for Practice Specialties ──
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(s: Specialty) {
    setEditing(s);
    setForm({
      slug: s.slug,
      label: s.label,
      description: s.description ?? "",
      icon: s.icon ?? "",
      group: s.group ?? "",
      sortOrder: s.sortOrder,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.slug || !form.label) {
      toast.error(t("slugRequired2"));
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        description: form.description || undefined,
        icon: form.icon || undefined,
        group: form.group || undefined,
      };
      if (editing) {
        await apiFetch(`/specialties/admin/${editing.id}`, { method: "PUT", body });
        toast.success(t("updated"));
      } else {
        await apiFetch("/specialties/admin", { method: "POST", body });
        toast.success(t("created"));
      }
      setDialogOpen(false);
      loadSpecialties();
      loadGroups();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await apiFetch(`/specialties/admin/${id}/toggle`, { method: "PATCH" });
      loadSpecialties();
    } catch {
      toast.error(t("toggleFailed"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/specialties/admin/${id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      setDeleteConfirm(null);
      loadSpecialties();
    } catch {
      toast.error(t("deleteFailed"));
    }
  }

  // ── Handlers for Service Category Promotion & Merging ──
  function openPromote(c: ServiceCategory) {
    setPromoteDialog({
      open: true,
      category: c,
      targetCategory: c.category,
      notifyExperts: true,
      customMessage: "",
      loading: false,
    });
  }

  async function handleConfirmPromote() {
    if (!promoteDialog.category || !promoteDialog.targetCategory.trim()) return;
    setPromoteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await apiFetch("/admin/service-categories/promote", {
        method: "POST",
        body: {
          sourceCategory: promoteDialog.category.category,
          targetCategory: promoteDialog.targetCategory.trim(),
          notifyExperts: promoteDialog.notifyExperts,
          customMessage: promoteDialog.customMessage.trim() || undefined,
        },
      });
      toast.success(t("categoryPromotedSuccess"));
      setPromoteDialog((prev) => ({ ...prev, open: false }));
      loadServiceCategories();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setPromoteDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  function openMerge(c: ServiceCategory) {
    setMergeDialog({
      open: true,
      category: c,
      targetCategory: "consultation",
      notifyExperts: true,
      customMessage: "",
      loading: false,
    });
  }

  async function handleConfirmMerge() {
    if (!mergeDialog.category || !mergeDialog.targetCategory) return;
    setMergeDialog((prev) => ({ ...prev, loading: true }));
    try {
      await apiFetch("/admin/service-categories/merge", {
        method: "POST",
        body: {
          sourceCategory: mergeDialog.category.category,
          targetCategory: mergeDialog.targetCategory,
          notifyExperts: mergeDialog.notifyExperts,
          customMessage: mergeDialog.customMessage.trim() || undefined,
        },
      });
      toast.success(t("categoryMergedSuccess"));
      setMergeDialog((prev) => ({ ...prev, open: false }));
      loadServiceCategories();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setMergeDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={activeTab === "specialties" ? t("title") : t("serviceTaxonomyTitle")}
        description={activeTab === "specialties" ? t("subtitle") : t("serviceTaxonomySubtitle")}
        actions={
          activeTab === "specialties" ? (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> {t("addSpecialty")}
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("specialties")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "specialties"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>{t("practiceAreasTab")}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {specialties.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "services"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>{t("serviceCategoriesTab")}</span>
          {serviceMeta.candidateCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {serviceMeta.candidateCount}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: PRACTICE AREAS / SPECIALTIES ── */}
      {activeTab === "specialties" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[160px] sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">{t("allGroups")}</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              {t("specialtiesCount", { count: specialties.length })}
            </span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : specialties.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">{t("noSpecialties")}</p>
                <Button variant="outline" className="mt-3" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> {t("createFirst")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {specialties.map((s) => (
                <Card key={s.id} className={`transition-opacity ${!s.isActive ? "opacity-50" : ""}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{s.label}</span>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {s.slug}
                        </span>
                        {s.group && (
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {s.group}
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">{s.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(s.id)}
                        title={s.isActive ? t("deactivate") : t("activate")}
                      >
                        {s.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(s.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SERVICE CATEGORIES & PROMOTION (Pillars 3 & 4) ── */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("totalCategories")}</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {serviceCategories.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("standardCategories")}</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {serviceMeta.standardCount}
                </p>
              </CardContent>
            </Card>
            <Card className={serviceMeta.candidateCount > 0 ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10" : ""}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("candidateCategories")}</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {serviceMeta.candidateCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("totalServices")}</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {serviceMeta.totalServices}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchServiceCategories")}
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setServiceFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  serviceFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t("filterAll")}
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter("standard")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  serviceFilter === "standard"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t("filterStandard")}
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter("candidate")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  serviceFilter === "candidate"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t("filterCandidate")}
              </button>
            </div>
          </div>

          {/* Categories List */}
          {servicesLoading ? (
            <LoadingSpinner />
          ) : serviceCategories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-foreground">{t("noCandidateCategories")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {serviceCategories.map((c) => (
                <Card
                  key={c.category}
                  className={`overflow-hidden transition-all ${
                    !c.isStandard
                      ? "border-amber-500/30 hover:border-amber-500/50 shadow-xs"
                      : "border-border"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="text-base font-semibold text-foreground">
                            {c.category}
                          </h3>
                          {c.isStandard ? (
                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {t("standardBadge")}
                            </span>
                          ) : (
                            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <Sparkles size={11} />
                              {t("candidateBadge")}
                            </span>
                          )}
                        </div>

                        {/* Metric pills */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Briefcase size={13} className="text-primary/70" />
                            <span>
                              {c.serviceCount} services ({c.activeServiceCount} active)
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users size={13} className="text-primary/70" />
                            <span>{c.expertCount} advocates offering</span>
                          </span>
                        </div>

                        {/* Sample Offerings and Advocates */}
                        {(c.sampleServices.length > 0 || c.sampleExperts.length > 0) && (
                          <div className="pt-1 space-y-1">
                            {c.sampleServices.length > 0 && (
                              <p className="text-xs text-muted-foreground/80 line-clamp-1">
                                <span className="font-medium text-foreground/70">Offerings: </span>
                                {c.sampleServices.join(", ")}
                              </p>
                            )}
                            {c.sampleExperts.length > 0 && (
                              <p className="text-xs text-muted-foreground/70 line-clamp-1">
                                <span className="font-medium text-foreground/60">Advocates: </span>
                                {c.sampleExperts.join(", ")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons (only for custom candidate categories) */}
                      {!c.isStandard && (
                        <div className="flex shrink-0 flex-wrap sm:flex-col lg:flex-row items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openPromote(c)}
                            className="gap-1.5 text-xs shadow-xs"
                          >
                            <Sparkles size={13} />
                            <span>{t("promoteBtn")}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMerge(c)}
                            className="gap-1.5 text-xs"
                          >
                            <ArrowRight size={13} />
                            <span>{t("mergeBtn")}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROMOTE CATEGORY DIALOG (Pillars 3 & 4) ── */}
      <Dialog
        open={promoteDialog.open}
        onOpenChange={(open) => setPromoteDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{t("promoteDialogTitle")}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("promoteDialogDesc")}
            </p>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
              <p className="font-medium text-primary">
                Source Candidate: <span className="font-semibold text-foreground">{promoteDialog.category?.category}</span>
              </p>
              <p className="text-muted-foreground">
                {t("affectedServicesCount", {
                  count: promoteDialog.category?.serviceCount ?? 0,
                  experts: promoteDialog.category?.expertCount ?? 0,
                })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="promote-target">{t("targetCategoryLabel")}</Label>
              <Input
                id="promote-target"
                value={promoteDialog.targetCategory}
                onChange={(e) => setPromoteDialog((prev) => ({ ...prev, targetCategory: e.target.value }))}
                placeholder="e.g. Intellectual Property & Trademarks"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="notify-experts-promote"
                checked={promoteDialog.notifyExperts}
                onChange={(e) => setPromoteDialog((prev) => ({ ...prev, notifyExperts: e.target.checked }))}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="notify-experts-promote" className="text-xs font-medium text-foreground cursor-pointer">
                {t("notifyExpertsLabel")}
              </label>
            </div>

            {promoteDialog.notifyExperts && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-promote-msg" className="text-xs text-muted-foreground">
                  {t("customMessageLabel")}
                </Label>
                <Textarea
                  id="custom-promote-msg"
                  rows={2}
                  value={promoteDialog.customMessage}
                  onChange={(e) => setPromoteDialog((prev) => ({ ...prev, customMessage: e.target.value }))}
                  placeholder={t("customMessagePlaceholder")}
                  className="text-xs"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPromoteDialog((prev) => ({ ...prev, open: false }))}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirmPromote}
              disabled={promoteDialog.loading || !promoteDialog.targetCategory.trim()}
            >
              {promoteDialog.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {t("promoteConfirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MERGE CATEGORY DIALOG (Pillars 3 & 4) ── */}
      <Dialog
        open={mergeDialog.open}
        onOpenChange={(open) => setMergeDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              <span>{t("mergeDialogTitle")}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("mergeDialogDesc")}
            </p>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1">
              <p className="font-medium text-foreground">
                Merging Candidate: <span className="font-semibold text-primary">{mergeDialog.category?.category}</span>
              </p>
              <p className="text-muted-foreground">
                {t("affectedServicesCount", {
                  count: mergeDialog.category?.serviceCount ?? 0,
                  experts: mergeDialog.category?.expertCount ?? 0,
                })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="merge-target">{t("targetMergeCategoryLabel")}</Label>
              <select
                id="merge-target"
                value={mergeDialog.targetCategory}
                onChange={(e) => setMergeDialog((prev) => ({ ...prev, targetCategory: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {STANDARD_TARGET_CATEGORIES.map((std) => (
                  <option key={std.value} value={std.value}>
                    {std.label} ({std.value})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="notify-experts-merge"
                checked={mergeDialog.notifyExperts}
                onChange={(e) => setMergeDialog((prev) => ({ ...prev, notifyExperts: e.target.checked }))}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="notify-experts-merge" className="text-xs font-medium text-foreground cursor-pointer">
                {t("notifyExpertsLabel")}
              </label>
            </div>

            {mergeDialog.notifyExperts && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-merge-msg" className="text-xs text-muted-foreground">
                  {t("customMessageLabel")}
                </Label>
                <Textarea
                  id="custom-merge-msg"
                  rows={2}
                  value={mergeDialog.customMessage}
                  onChange={(e) => setMergeDialog((prev) => ({ ...prev, customMessage: e.target.value }))}
                  placeholder={t("customMessagePlaceholder")}
                  className="text-xs"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMergeDialog((prev) => ({ ...prev, open: false }))}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirmMerge}
              disabled={mergeDialog.loading || !mergeDialog.targetCategory}
            >
              {mergeDialog.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {t("mergeConfirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE / EDIT SPECIALTY DIALOG ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("editSpecialty") : t("createSpecialty")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spec-slug">{t("slugRequired")}</Label>
                <Input
                  id="spec-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_") })}
                  placeholder="family_law"
                  disabled={!!editing}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{t("slugHint")}</p>
              </div>
              <div>
                <Label htmlFor="spec-label">{t("labelRequired")}</Label>
                <Input
                  id="spec-label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Family Law"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="spec-desc">{t("description")}</Label>
              <Input
                id="spec-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Divorce, custody, adoption, maintenance"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spec-icon">{t("icon")}</Label>
                <Input
                  id="spec-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="Users"
                />
              </div>
              <div>
                <Label htmlFor="spec-group">{t("group")}</Label>
                <Input
                  id="spec-group"
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  placeholder="Civil"
                  list="group-options"
                />
                <datalist id="group-options">
                  {groups.map((g) => <option key={g} value={g} />)}
                </datalist>
              </div>
            </div>
            <div>
              <Label htmlFor="spec-order">{t("sortOrder")}</Label>
              <Input
                id="spec-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="max-w-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE SPECIALTY CONFIRMATION DIALOG ── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deleteSpecialty")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("deleteConfirm")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t("cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
