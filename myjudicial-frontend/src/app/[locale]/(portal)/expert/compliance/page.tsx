"use client";

import { Shield, Loader2, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useCompliance } from "@/features/experts/hooks/useCompliance";
import { EXPERT_STATUS_CONFIG } from "@/features/experts/types";

export default function CompliancePage() {
  const { data: compliance, isLoading, error } = useCompliance();

  const getSeverityColor = () => {
    if (!compliance) return "text-slate-600";
    if (compliance.isExpired) return "text-red-600";
    if (compliance.daysUntilExpiry !== null && compliance.daysUntilExpiry <= 7)
      return "text-red-600";
    if (compliance.daysUntilExpiry !== null && compliance.daysUntilExpiry <= 30)
      return "text-amber-600";
    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (!compliance) return Shield;
    if (compliance.isExpired || (compliance.daysUntilExpiry !== null && compliance.daysUntilExpiry <= 7))
      return AlertTriangle;
    return CheckCircle;
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Compliance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor your credential status and compliance requirements
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load compliance status. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )}

      {!isLoading && !error && compliance && (
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                  compliance.isExpired
                    ? "bg-red-100"
                    : compliance.daysUntilExpiry !== null && compliance.daysUntilExpiry <= 30
                    ? "bg-amber-100"
                    : "bg-green-100"
                }`}
              >
                {(() => {
                  const Icon = getStatusIcon();
                  return <Icon className={`h-6 w-6 ${getSeverityColor()}`} />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-brand-dark">
                    Expert Status
                  </h2>
                  <Badge
                    variant={EXPERT_STATUS_CONFIG[compliance.status].variant}
                    className={EXPERT_STATUS_CONFIG[compliance.status].color}
                  >
                    {EXPERT_STATUS_CONFIG[compliance.status].label}
                  </Badge>
                </div>
                <p className={`mt-2 text-sm ${getSeverityColor()}`}>
                  {compliance.statusMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Credentials Expiry */}
          <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-brand-blue" />
              <h2 className="font-semibold text-brand-dark">
                Credentials Expiry
              </h2>
            </div>

            {compliance.credentialsExpiry ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Expiry Date</p>
                  <p className="text-lg font-semibold text-brand-dark">
                    {format(new Date(compliance.credentialsExpiry), "MMMM d, yyyy")}
                  </p>
                </div>

                {compliance.daysUntilExpiry !== null && (
                  <div>
                    <p className="text-sm text-slate-600">Days Until Expiry</p>
                    <p className={`text-2xl font-bold ${getSeverityColor()}`}>
                      {compliance.isExpired
                        ? "Expired"
                        : `${compliance.daysUntilExpiry} days`}
                    </p>
                  </div>
                )}

                {compliance.isExpired && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Your credentials have expired. Please renew immediately to
                      continue practice.
                    </AlertDescription>
                  </Alert>
                )}

                {!compliance.isExpired &&
                  compliance.daysUntilExpiry !== null &&
                  compliance.daysUntilExpiry <= 30 && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        Your credentials expire soon. Please renew before{" "}
                        {format(new Date(compliance.credentialsExpiry), "MMMM d")}.
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                No credentials expiry date set
              </p>
            )}
          </div>

          {/* Last Verification */}
          {compliance.lastVerification && (
            <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-brand-dark">
                Last Verification
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <Badge
                    variant={
                      compliance.lastVerification.status === "APPROVED"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {compliance.lastVerification.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Submitted</span>
                  <span className="text-brand-dark">
                    {format(
                      new Date(compliance.lastVerification.createdAt),
                      "MMM d, yyyy"
                    )}
                  </span>
                </div>
                {compliance.lastVerification.reviewedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Reviewed</span>
                    <span className="text-brand-dark">
                      {format(
                        new Date(compliance.lastVerification.reviewedAt),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                )}
                {compliance.lastVerification.rejectionReason && (
                  <div className="mt-3">
                    <p className="font-medium text-red-600">Rejection Reason:</p>
                    <p className="text-slate-700">
                      {compliance.lastVerification.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
