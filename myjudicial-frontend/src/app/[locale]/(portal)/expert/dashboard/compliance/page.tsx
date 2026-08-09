import { requireAuth } from "@/server/auth/guards";
import { AlertTriangle, CheckCircle, Clock, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    statusColor: "text-red-700 bg-red-50",
    iconColor: "text-red-500",
  },
  {
    id: 2,
    title: "Quarterly EBM Tax Report",
    status: "Warning",
    dueDate: "Nov 30, 2024",
    description: "Q4 EBM sales declaration is overdue. Submit to RRA to avoid penalty.",
    action: "File Report",
    statusColor: "text-amber-700 bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    id: 3,
    title: "Professional Indemnity Insurance",
    status: "Compliant",
    dueDate: "Mar 20, 2025",
    description: "Coverage is active under Britam Insurance. Next renewal in 4 months.",
    action: "View Certificate",
    statusColor: "text-green-700 bg-green-50",
    iconColor: "text-green-500",
  },
  {
    id: 4,
    title: "Anti-Money Laundering (AML) Training",
    status: "Compliant",
    dueDate: "Feb 10, 2025",
    description: "Annual AML certification completed on Feb 10, 2024. Valid until next year.",
    action: "Download Certificate",
    statusColor: "text-green-700 bg-green-50",
    iconColor: "text-green-500",
  },
  {
    id: 5,
    title: "Client Escrow Account Audit",
    status: "Warning",
    dueDate: "Jan 15, 2025",
    description: "Quarterly escrow reconciliation report is due for submission to the BAR council.",
    action: "Submit Report",
    statusColor: "text-amber-700 bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    id: 6,
    title: "Data Protection Registration (NDPC)",
    status: "Compliant",
    dueDate: "Aug 22, 2025",
    description: "Registered with the National Data Protection Authority. Compliance status: Active.",
    action: "View Registration",
    statusColor: "text-green-700 bg-green-50",
    iconColor: "text-green-500",
  },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Critical: <AlertTriangle size={16} />,
  Warning: <Clock size={16} />,
  Compliant: <CheckCircle size={16} />,
};

export default async function CompliancePage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Regulatory Compliance</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track licences, filings, and regulatory obligations</p>
        </div>
        <Button className="h-9 gap-1.5 rounded-lg bg-brand-blue text-sm font-semibold text-white hover:bg-blue-800">
          <FileText size={14} /> Submit New Filing
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-red-600">
            <AlertTriangle size={14} /> Critical
          </div>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-gray-100">1</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Requires immediate action</p>
        </div>
        <div className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
            <Clock size={14} /> Warnings
          </div>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-gray-100">2</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Due within the next 60 days</p>
        </div>
        <div className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-green-600">
            <CheckCircle size={14} /> Compliant
          </div>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-gray-100">3</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">All obligations up to date</p>
        </div>
      </div>

      {/* Compliance Items */}
      <div className="space-y-3">
        {COMPLIANCE_ITEMS.map((item) => (
          <div key={item.id} className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${item.iconColor}`}>
                  {STATUS_ICONS[item.status]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Due: {item.dueDate}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className={`h-8 gap-1 rounded-lg border-brand-border dark:border-gray-700 text-xs ${
                  item.status === "Critical"
                    ? "border-red-200 text-red-700 hover:bg-red-50"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {item.action} <ExternalLink size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}