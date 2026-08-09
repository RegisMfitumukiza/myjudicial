"use client";

import { useState } from "react";
import {
  MessageCircle,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  FileText,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  lastSeen?: string;
}

interface DeliveryStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
}

interface TemplateStat {
  id: string;
  name: string;
  category: string;
  status: string;
  sentCount: number;
}

export default function WhatsAppPage() {
  const queryClient = useQueryClient();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: status, isLoading: statusLoading } = useQuery<WhatsAppStatus>({
    queryKey: ["whatsapp-status"],
    queryFn: () => apiFetch("/admin/whatsapp/status"),
  });

  const { data: deliveryStats, isLoading: deliveryLoading } = useQuery<DeliveryStats>({
    queryKey: ["whatsapp-delivery-stats"],
    queryFn: () => apiFetch("/admin/whatsapp/stats/delivery"),
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<TemplateStat[]>({
    queryKey: ["whatsapp-template-stats"],
    queryFn: () => apiFetch("/admin/whatsapp/stats/templates"),
  });

  const testMutation = useMutation({
    mutationFn: () => apiFetch("/admin/whatsapp/test", { method: "POST" }),
    onSuccess: () => setTestResult({ success: true, message: "Test message sent successfully." }),
    onError: (error: Error) => setTestResult({ success: false, message: error.message }),
  });

  const syncMutation = useMutation({
    mutationFn: () => apiFetch("/admin/whatsapp/templates/sync", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-template-stats"] });
    },
  });

  if (statusLoading || deliveryLoading || templatesLoading) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading WhatsApp data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">WhatsApp Integration</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Monitor WhatsApp messaging status and templates</p>
      </div>

      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${status?.connected ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              {status?.connected ? (
                <Wifi size={24} className="text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff size={24} className="text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {status?.connected ? "Connected" : "Disconnected"}
              </p>
              {status?.phoneNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{status.phoneNumber}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || !status?.connected}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
            >
              {testMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Test Message
            </button>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {syncMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Sync Templates
            </button>
          </div>
        </div>
        {testResult && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${testResult.success ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
            {testResult.message}
          </div>
        )}
      </div>

      {deliveryStats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Send size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{deliveryStats.totalSent.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Sent</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <CheckCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{deliveryStats.totalDelivered.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Delivered</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <Clock size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{deliveryStats.totalRead.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Read</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
              <XCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{deliveryStats.totalFailed.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Failed</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
        <div className="border-b border-brand-border/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Templates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Sent Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/10">
              {!templates || templates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No templates found.</p>
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{template.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{template.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        template.status === "APPROVED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {template.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{template.sentCount.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
