"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Users,
  Share2,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";

interface ReferralData {
  data: {
    code: string;
    link: string;
    signups: number;
    createdAt: string;
  };
}

export default function JoinPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["referral"],
    queryFn: () => apiFetch<ReferralData>("/experts/referral"),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => apiFetch("/experts/referral", { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral"] });
      toast.success("Referral code updated");
    },
    onError: () => {
      toast.error("Failed to regenerate referral code");
    },
  });

  const referral = data?.data;

  const handleCopy = async () => {
    if (!referral?.link) return;
    try {
      await navigator.clipboard.writeText(referral.link);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = (method: "email" | "whatsapp") => {
    if (!referral?.link) return;
    const subject = encodeURIComponent("Join me on MyJudicial");
    const body = encodeURIComponent(
      `I use MyJudicial to offer legal services. Join the platform here: ${referral.link}`
    );

    if (method === "email") {
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    } else if (method === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${body}\n\n${referral.link}`)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">
              Invite & Earn
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share your referral link to invite clients and colleagues
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-md dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load referral info. Please try again.
          </p>
        </div>
      ) : referral ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <Link2 size={16} className="text-brand-blue" />
              <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">
                Your referral link
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-brand-border/30 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
              <code className="flex-1 truncate text-sm text-brand-dark dark:text-gray-100">
                {referral.link}
              </code>
              <button
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-blue/90"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-border bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Signups</p>
                  <p className="text-xl font-bold text-brand-dark dark:text-gray-100">
                    {referral.signups}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-brand-border bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Referral Code</p>
                  <p className="text-xl font-bold text-brand-dark dark:text-gray-100">
                    {referral.code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <Share2 size={16} className="text-brand-blue" />
              <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">
                Share via
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleShare("email")}
                className="flex items-center gap-2 rounded-lg border border-brand-border/30 px-4 py-2 text-sm font-medium text-brand-dark hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Mail size={16} className="text-gray-400" />
                Email
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="flex items-center gap-2 rounded-lg border border-brand-border/30 px-4 py-2 text-sm font-medium text-brand-dark hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <MessageCircle size={16} className="text-gray-400" />
                WhatsApp
              </button>
              <a
                href={referral.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-brand-border/30 px-4 py-2 text-sm font-medium text-brand-dark hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ExternalLink size={16} className="text-gray-400" />
                Open link
              </a>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-brand-border/30 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {regenerateMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Regenerate code
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
