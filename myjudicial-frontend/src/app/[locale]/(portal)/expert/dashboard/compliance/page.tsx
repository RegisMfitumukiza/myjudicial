import { requireAuth } from "@/server/auth/guards";
import { AlertTriangle, CheckCircle, Clock, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  PageHeader,
  StatusBadge,
  type StatusTone,
} from "@/shared/components/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMPLIANCE_ITEMS = [
  {
    id: 1,
    title: "Rwanda Bar Association Membership Renewal",
    status: "Critical",
    dueDate: "Dec 15, 2024",
    description: "Your annual BAR membership expires in 4 days. Late renewal may result in practice suspension.",
    action: "Renew Now",
  },
  {
    id: 2,
    title: "Quarterly EBM Tax Report",
    status: "Warning",
    dueDate: "Nov 30, 2024",
    description: "Q4 EBM sales declaration is overdue. Submit to RRA to avoid penalty.",
    action: "File Report",
  },
  {
    id: 3,
    title: "Professional Indemnity Insurance",
    status: "Compliant",
    dueDate: "Mar 20, 2025",
    description: "Coverage is active under Britam Insurance. Next renewal in 4 months.",
    action: "View Certificate",
  },
  {
    id: 4,
    title: "Anti-Money Laundering (AML) Training",
    status: "Compliant",
    dueDate: "Feb 10, 2025",
    description: "Annual AML certification completed on Feb 10, 2024. Valid until next year.",
    action: "Download Certificate",
  },
  {
    id: 5,
    title: "Client Escrow Account Audit",
    status: "Warning",
    dueDate: "Jan 15, 2025",
    description: "Quarterly escrow reconciliation report is due for submission to the BAR council.",
    action: "Submit Report",
  },
  {
    id: 6,
    title: "Data Protection Registration (NDPC)",
    status: "Compliant",
    dueDate: "Aug 22, 2025",
    description: "Registered with the National Data Protection Authority. Compliance status: Active.",
    action: "View Registration",
  },
];

const STATUS_TONES: Record<string, { tone: StatusTone; chipClass: string }> = {
  Critical: { tone: "destructive", chipClass: "bg-destructive/10 text-destructive" },
  Warning: { tone: "warning", chipClass: "bg-warning/10 text-warning" },
  Compliant: { tone: "active", chipClass: "bg-primary/10 text-primary" },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Critical: <AlertTriangle size={16} />,
  Warning: <Clock size={16} />,
  Compliant: <CheckCircle size={16} />,
};

export default async function CompliancePage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Regulatory Compliance"
        description="Track licences, filings, and regulatory obligations"
        actions={
          <Button size="sm">
            <FileText size={14} /> Submit New Filing
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <StatusBadge tone="destructive">Critical</StatusBadge>
          <p className="mt-2 text-2xl font-bold text-foreground">1</p>
          <p className="mt-1 text-xs text-muted-foreground">Requires immediate action</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <StatusBadge tone="warning">Warnings</StatusBadge>
          <p className="mt-2 text-2xl font-bold text-foreground">2</p>
          <p className="mt-1 text-xs text-muted-foreground">Due within the next 60 days</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <StatusBadge tone="active">Compliant</StatusBadge>
          <p className="mt-2 text-2xl font-bold text-foreground">3</p>
          <p className="mt-1 text-xs text-muted-foreground">All obligations up to date</p>
        </div>
      </div>

      {/* Compliance Items */}
      <div className="space-y-3">
        {COMPLIANCE_ITEMS.map((item) => {
          const config = STATUS_TONES[item.status] ?? STATUS_TONES.Compliant;
          return (
            <div key={item.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.chipClass}`}
                  >
                    {STATUS_ICONS[item.status]}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} aria-hidden="true" /> Due: {item.dueDate}
                      </span>
                      <StatusBadge tone={config.tone}>{item.status}</StatusBadge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className={
                    item.status === "Critical" ? "border-destructive/30 text-destructive" : undefined
                  }
                >
                  {item.action} <ExternalLink size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
