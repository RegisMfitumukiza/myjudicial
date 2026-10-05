"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, GripVertical, Search, Loader2,
  Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { PageHeader, LoadingSpinner } from "@/shared/components/dashboard";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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

const EMPTY_FORM = { slug: "", label: "", description: "", icon: "", group: "", sortOrder: 0 };

export default function SpecialtiesPage() {
  const t = useTranslations("admin.specialties");
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

  useEffect(() => { loadSpecialties(); loadGroups(); }, [search, filterGroup]);

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

  const filtered = specialties;

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> {t("addSpecialty")}
          </Button>
        }
      />

      {/* Filters */}
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
          {t("specialtiesCount", { count: filtered.length })}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
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
          {filtered.map((s) => (
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
                      <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-medium text-brand-blue">
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

      {/* Create/Edit Dialog */}
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

      {/* Delete Confirmation */}
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
