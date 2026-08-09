export interface PracticeSession {
  id: string;
  client: string;
  clientCode: string;
  avatarUrl: string;
  caseNature: string;
  timeLabel: string;
  urgent: boolean;
  status: "URGENT" | "PENDING" | "CONFIRMED";
}

export interface RegulatoryAlert {
  id: string;
  severity: "critical" | "warning";
  title: string;
  message: string;
  href?: string;
}

export interface RevenueDay {
  day: string;
  amountRwf: number;
}
