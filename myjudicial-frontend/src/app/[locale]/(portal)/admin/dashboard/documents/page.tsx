"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

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
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          !isLoading && backendMissing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <Download size={13} className={isFetching ? "animate-spin" : ""} />{" "}
              {t("retry")}
            </Button>
          ) : undefined
        }
      />

      {isLoading && <LoadingSpinner label="Loading documents..." />}

      {backendMissing && !isLoading && (
        <ErrorState
          title={t("notAvailable")}
          message={t("notAvailableDesc")}
          onRetry={() => refetch()}
          retryLabel={t("retry")}
        />
      )}

      {!isLoading && !backendMissing && documents.length === 0 && (
        <EmptyState
          icon={FileText}
          title={t("noDocuments")}
          description={t("noDocumentsDesc")}
        />
      )}

      {!isLoading && !backendMissing && documents.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchFiles")}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-muted-foreground" />
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      {t("fileName")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      {t("category")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      {t("uploadedBy")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      {t("size")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      {t("date")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {doc.fileName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {doc.category}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {doc.uploadedBy}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatBytes(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Download"
                          >
                            <Download size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        {t("noSearchResults")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
