"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Plus,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface Quotation {
  id: string;
  clientName: string;
  service: string;
  amount: number;
  currency: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; labelKey: string }> = {
  DRAFT: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: FileText, labelKey: "statusDraft" },
  SENT: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Send, labelKey: "statusSent" },
  ACCEPTED: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle, labelKey: "statusAccepted" },
  REJECTED: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, labelKey: "statusRejected" },
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
  });

  const quotations: Quotation[] = quotationsResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("loadingQuotations")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("failedToLoad")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : t("unknownError")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
        >
          <Plus size={16} />
          {t("newQuotation")}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-brand-dark dark:text-gray-100">{t("createQuotationTitle")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("clientNameLabel")}</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder={t("clientNamePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("serviceLabel")}</label>
              <input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder={t("servicePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("amountLabel")}</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t("descriptionLabel")}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() => {
                if (formData.clientName && formData.service && formData.amount) {
                  createMutation.mutate(formData);
                }
              }}
              disabled={!formData.clientName || !formData.service || !formData.amount || createMutation.isPending}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
            >
              {createMutation.isPending ? t("creating") : t("createQuotationBtn")}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">{t("thClient")}</th>
                <th className="px-6 py-4">{t("thService")}</th>
                <th className="px-6 py-4">{t("thAmount")}</th>
                <th className="px-6 py-4">{t("thStatus")}</th>
                <th className="px-6 py-4">{t("thCreated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/10">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <FileText size={28} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("noQuotationsTitle")}</p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t("noQuotationsDesc")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const statusConfig = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.DRAFT;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={q.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-xs text-brand-blue">
                            {(q.clientName ?? "C").charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{q.clientName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{q.service}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(q.amount, q.currency)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {t(statusConfig.labelKey)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(q.createdAt)}</td>
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
