export type LegalDocumentType = "TERMS" | "PRIVACY" | "COOKIES" | "ADVOCATE_AGREEMENT";

export type ConsentContext =
  | "REGISTRATION"
  | "BOOKING_CHECKOUT"
  | "PORTAL_REACCEPTANCE"
  | "VOLUNTARY_UPDATE";

export interface LegalDocumentStatus {
  slug: LegalDocumentType;
  status: "draft" | "published";
  version: string;
  effectiveDate: string | null;
  isFinalized: boolean;
}

export interface UserConsentRecord {
  documentType: string;
  version: string;
  acceptedAt: string;
  context: string;
}

export interface LegalStatusData {
  documents: {
    TERMS: LegalDocumentStatus;
    PRIVACY: LegalDocumentStatus;
    COOKIES: LegalDocumentStatus;
  };
  userConsent: {
    isCompliant: boolean;
    consents: UserConsentRecord[];
  } | null;
}

export interface RecordConsentPayload {
  documentType: LegalDocumentType;
  version: string;
  context?: ConsentContext;
  locale?: string;
}
