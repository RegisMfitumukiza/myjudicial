"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  RefreshCw,
  Users,
  Share2,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/shared/components/ui/button";
import { ErrorState, LoadingSpinner, PageHeader } from "@/shared/components/dashboard";

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

  const handleShare = (method: "email") => {
    if (!referral?.link) return;
    const subject = encodeURIComponent("Join me on MyJudicial");
    const body = encodeURIComponent(
      `I use MyJudicial to offer legal services. Join the platform here: ${referral.link}`
    );

    if (method === "email") {
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    }
  };

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title="Invite & Earn"
        description="Share your referral link to invite clients and colleagues"
      />

      <div className="mt-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message="Failed to load referral info. Please try again." />
        ) : referral ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Link2 size={16} className="text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Your referral link</p>
              </div>
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center gap-2 min-[380px]:gap-3 rounded-lg border border-border bg-muted/50 p-2.5 min-[380px]:px-4 min-[380px]:py-2">
                <code className="flex-1 break-all font-mono text-xs min-[380px]:text-sm text-foreground">
                  {referral.link}
                </code>
                <Button size="xs" onClick={handleCopy} className="w-full min-[380px]:w-auto shrink-0">
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Signups</p>
                    <p className="text-xl font-bold text-foreground">{referral.signups}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <RefreshCw size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Referral Code</p>
                    <p className="text-xl font-bold text-foreground">{referral.code}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Share2 size={16} className="text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Share via</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => handleShare("email")}>
                  <Mail size={16} className="text-muted-foreground" aria-hidden="true" />
                  Email
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={referral.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} className="text-muted-foreground" aria-hidden="true" />
                    Open link
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
              >
                {regenerateMutation.isPending ? (
                  <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw size={14} aria-hidden="true" />
                )}
                Regenerate code
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
