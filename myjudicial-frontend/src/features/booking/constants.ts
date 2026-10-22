export const MNO_OPTIONS = [
  {
    value: "MTN",
    label: "MTN Mobile Money",
    shortName: "MTN MoMo",
    recommended: true,
    status: "active" as const,
    prefixes: ["078", "079", "25078", "25079"],
  },
  {
    value: "Airtel",
    label: "Airtel Money",
    shortName: "Airtel Money",
    recommended: false,
    status: "active" as const,
    prefixes: ["072", "073", "25072", "25073"],
  },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  consultation: "Consultation",
  document_review: "Document Review",
  contract_drafting: "Contract Drafting",
  court_representation: "Court Representation",
  legal_advice: "Legal Advice",
  mediation: "Mediation",
  other: "Other",
};

export const DELIVERY_LABELS: Record<string, string> = {
  VIDEO: "Video Call",
  PHONE: "Phone Call",
  IN_PERSON: "In Person",
  EMAIL: "Email",
};

export const TIMEZONE_OPTIONS = [
  { value: "Africa/Kigali", label: "CAT (Kigali, UTC+2)", offset: "+02:00" },
  { value: "Africa/Nairobi", label: "EAT (Nairobi, UTC+3)", offset: "+03:00" },
  { value: "Africa/Dar_es_Salaam", label: "EAT (Dar es Salaam, UTC+3)", offset: "+03:00" },
  { value: "Africa/Kampala", label: "EAT (Kampala, UTC+3)", offset: "+03:00" },
  { value: "Africa/Johannesburg", label: "SAST (Johannesburg, UTC+2)", offset: "+02:00" },
  { value: "Africa/Lagos", label: "WAT (Lagos, UTC+1)", offset: "+01:00" },
  { value: "Africa/Cairo", label: "EET (Cairo, UTC+2)", offset: "+02:00" },
  { value: "Africa/Addis_Ababa", label: "EAT (Addis Ababa, UTC+3)", offset: "+03:00" },
  { value: "Europe/London", label: "GMT/BST", offset: "+00:00" },
  { value: "Europe/Paris", label: "CET/CEST", offset: "+01:00" },
  { value: "America/New_York", label: "EST/EDT", offset: "-05:00" },
  { value: "America/Chicago", label: "CST/CDT", offset: "-06:00" },
  { value: "America/Denver", label: "MST/MDT", offset: "-07:00" },
  { value: "America/Los_Angeles", label: "PST/PDT", offset: "-08:00" },
  { value: "Asia/Dubai", label: "GST (UTC+4)", offset: "+04:00" },
  { value: "Asia/Kolkata", label: "IST (UTC+5:30)", offset: "+05:30" },
  { value: "Asia/Shanghai", label: "CST (UTC+8)", offset: "+08:00" },
  { value: "Asia/Tokyo", label: "JST (UTC+9)", offset: "+09:00" },
] as const;
