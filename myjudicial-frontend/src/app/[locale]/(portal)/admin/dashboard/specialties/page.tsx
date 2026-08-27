"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, GripVertical, Search, Loader2, X,
  ChevronDown, ChevronUp, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { PageHeader, LoadingSpinner } from "@/shared/components/dashboard";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

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

    apiFetch<{ data: Specialty[]; meta?: { total: number } }>(`/admin/specialties?${params}`)
      .then((res) => {
        const items = res?.data ?? [];
        setSpecialties(Array.isArray(items) ? items : []);
      })
      .catch(() => toast.error("Failed to load specialties"))
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
      toast.error("Slug and label are required");
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
        await apiFetch(`/admin/specialties/${editing.id}`, { method: "PUT", body });
        toast.success("Specialty updated");
      } else {
        await apiFetch("/admin/specialties", { method: "POST", body });
        toast.success("Specialty created");
      }
      setDialogOpen(false);
      loadSpecialties();
      loadGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await apiFetch(`/admin/specialties/${id}/toggle`, { method: "PATCH" });
      loadSpecialties();
    } catch {
      toast.error("Failed to toggle");
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/admin/specialties/${id}`, { method: "DELETE" });
      toast.success("Specialty deleted");
      setDeleteConfirm(null);
      loadSpecialties();
    } catch {
      toast.error("Failed to delete");
    }
  }

  const filtered = specialties;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Practice Areas"
        description="Manage the legal specialties available during registration and expert profiles."
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Specialty
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search specialties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} specialties</span>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No specialties found.</p>
            <Button variant="outline" className="mt-3" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create first specialty
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
                    title={s.isActive ? "Deactivate" : "Activate"}
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
            <DialogTitle>{editing ? "Edit Specialty" : "Create Specialty"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spec-slug">Slug *</Label>
                <Input
                  id="spec-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_") })}
                  placeholder="family_law"
                  disabled={!!editing}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Lowercase, underscores. Cannot change after creation.</p>
              </div>
              <div>
                <Label htmlFor="spec-label">Label *</Label>
                <Input
                  id="spec-label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Family Law"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="spec-desc">Description</Label>
              <Input
                id="spec-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Divorce, custody, adoption, maintenance"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spec-icon">Icon (Lucide name)</Label>
                <Input
                  id="spec-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="Users"
                />
              </div>
              <div>
                <Label htmlFor="spec-group">Group</Label>
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
              <Label htmlFor="spec-order">Sort Order</Label>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Specialty?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the specialty. Experts using it will need to update their profiles.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
