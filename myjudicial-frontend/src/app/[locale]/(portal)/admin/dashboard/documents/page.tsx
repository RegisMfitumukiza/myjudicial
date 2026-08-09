"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  category: string;
}

interface DocumentsResponse {
  data: Document[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function DocumentsPage() {
  const t = useTranslations("admin.documents");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const CATEGORIES = [t("all"), t("identity"), t("legal"), t("financial"), t("verification"), t("other")];

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const res = await apiFetch<DocumentsResponse>("/admin/documents");
      return res;
    },
    retry: false,
  });

  const documents: Document[] = Array.isArray(response?.data)
    ? response!.data
    : Array.isArray(response as any)
    ? (response as any)
    : [];

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === t("all") || doc.category === category;
    return matchesSearch && matchesCategory;
  });

  const backendMissing = isError;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        {!isLoading && backendMissing && (
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border/20 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />{" "}
            {t("retry")}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      )}

      {backendMissing && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 py-20 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle size={28} className="mb-3 text-amber-500" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t("notAvailable")}
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            {t("notAvailableDesc")}
          </p>
        </div>
      )}

      {!isLoading && !backendMissing && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border/20 bg-white py-20 shadow-md dark:bg-gray-900">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-canvas dark:bg-gray-800">
            <FileText size={28} className="text-gray-400" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("noDocuments")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("noDocumentsDesc")}
          </p>
        </div>
      )}

      {!isLoading && !backendMissing && documents.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchFiles")}
                className="w-full rounded-lg border border-brand-border/30 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-gray-400" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    category === cat
                      ? "bg-brand-blue text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-brand-border/20 bg-white shadow-md dark:bg-gray-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border/10 bg-brand-canvas dark:bg-gray-800">
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">
                    {t("fileName")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">
                    {t("category")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">
                    {t("uploadedBy")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">
                    {t("size")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">
                    {t("date")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-brand-border/10 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {doc.fileName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {doc.category}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded p-1 text-gray-400 hover:text-brand-blue"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="rounded p-1 text-gray-400 hover:text-brand-blue"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      {t("noSearchResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
