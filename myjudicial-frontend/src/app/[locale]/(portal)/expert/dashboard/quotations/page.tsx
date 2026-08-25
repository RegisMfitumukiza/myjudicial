"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  ErrorState,
  LoadingSpinner,
  PageHeader,
  StatusBadge,
  type StatusTone,
} from "@/shared/components/dashboard";

interface Quotation {
  id: string;
  clientName: string;
  service: string;
  amount: number;
  currency: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

const STATUS_TONES: Record<string, { tone: StatusTone; labelKey: string }> = {
  DRAFT: { tone: "neutral", labelKey: "statusDraft" },
  SENT: { tone: "pending", labelKey: "statusSent" },
  ACCEPTED: { tone: "active", labelKey: "statusAccepted" },
  REJECTED: { tone: "destructive", labelKey: "statusRejected" },
};

const formatCurrency = (amount: number, currency = "RWF") => {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};

export default function QuotationsPage() {
  const t = useTranslations("expertDashboard_quotations");
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ clientName: "", service: "", amount: "", description: "" });

  const { data: quotationsResponse, isLoading, error } = useQuery({
    queryKey: ["expert-quotations"],
    queryFn: () => apiFetch<{ data: Quotation[] }>("/experts/quotations"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiFetch("/experts/quotations", { method: "POST", body: { ...data, amount: Number(data.amount) } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-quotations"] });
      setShowForm(false);
      setFormData({ clientName: "", service: "", amount: "", description: "" });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to create quotation"));
    },
  });

  const quotations: Quotation[] = quotationsResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <LoadingSpinner label={t("loadingQuotations")} className="mt-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ErrorState title={t("failedToLoad")} message={t("unknownError")} className="mt-6" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} aria-hidden="true" />
            {t("newQuotation")}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6 mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">{t("createQuotationTitle")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("clientNameLabel")}</label>
              <Input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder={t("clientNamePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("serviceLabel")}</label>
              <Input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                placeholder={t("servicePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("amountLabel")}</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("descriptionLabel")}</label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                if (formData.clientName && formData.service && formData.amount) {
                  createMutation.mutate(formData);
                }
              }}
              disabled={!formData.clientName || !formData.service || !formData.amount || createMutation.isPending}
            >
              {createMutation.isPending ? t("creating") : t("createQuotationBtn")}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4 font-medium">{t("thClient")}</th>
                <th className="px-6 py-4 font-medium">{t("thService")}</th>
                <th className="px-6 py-4 font-medium">{t("thAmount")}</th>
                <th className="px-6 py-4 font-medium">{t("thStatus")}</th>
                <th className="px-6 py-4 font-medium">{t("thCreated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <FileText size={28} className="text-muted-foreground" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-foreground">{t("noQuotationsTitle")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t("noQuotationsDesc")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const statusConfig = STATUS_TONES[q.status] ?? STATUS_TONES.DRAFT;
                  return (
                    <tr key={q.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {(q.clientName ?? "C").charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-foreground">{q.clientName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{q.service}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{formatCurrency(q.amount, q.currency)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge tone={statusConfig.tone}>{t(statusConfig.labelKey)}</StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(q.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
