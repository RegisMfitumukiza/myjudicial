export enum LegalSpecialty {
  FAMILY_LAW = "FAMILY_LAW",
  COMMERCIAL_LAW = "COMMERCIAL_LAW",
  EMPLOYMENT_LAW = "EMPLOYMENT_LAW",
  LAND_LAW = "LAND_LAW",
  CRIMINAL_LAW = "CRIMINAL_LAW",
  TAX_LAW = "TAX_LAW",
  IMMIGRATION_LAW = "IMMIGRATION_LAW",
  CORPORATE_LAW = "CORPORATE_LAW",
  CONTRACT_LAW = "CONTRACT_LAW",
  INTELLECTUAL_PROPERTY = "INTELLECTUAL_PROPERTY",
  OTHER = "OTHER",
}

export enum ExpertStatus {
  DRAFT = "DRAFT",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export type ExpertProfile = {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  firmName: string | null;
  profileImageObjectKey: string | null;
  barNumber: string | null;
  yearsExperience: number | null;
  status: ExpertStatus;
  primarySpecialty: LegalSpecialty;
  specialties: LegalSpecialty[];
  languages: string[];
  officeAddress: string | null;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  baseConsultationFee: number | null;
  currency: string;
  credentialsExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  statusMessage?: string;
  rejectionReason?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatarObjectKey: string | null;
  };
  /** @deprecated Legacy fields used by the old onboarding form — do not use in new code. */
  headline?: string;
  licenseNumber?: string;
  barAssociation?: string;
  yearsOfExperience?: number;
  practiceAreas?: string[];
  district?: string;
  credentialsExpireAt?: string;
  profilePhotoObjectKey?: string;
  credentialDocumentObjectKey?: string;
};

export const LEGAL_SPECIALTY_LABELS: Record<LegalSpecialty, string> = {
  [LegalSpecialty.FAMILY_LAW]: "Family Law",
  [LegalSpecialty.COMMERCIAL_LAW]: "Commercial Law",
  [LegalSpecialty.EMPLOYMENT_LAW]: "Employment Law",
  [LegalSpecialty.LAND_LAW]: "Land Law",
  [LegalSpecialty.CRIMINAL_LAW]: "Criminal Law",
  [LegalSpecialty.TAX_LAW]: "Tax Law",
  [LegalSpecialty.IMMIGRATION_LAW]: "Immigration Law",
  [LegalSpecialty.CORPORATE_LAW]: "Corporate Law",
  [LegalSpecialty.CONTRACT_LAW]: "Contract Law",
  [LegalSpecialty.INTELLECTUAL_PROPERTY]: "Intellectual Property",
  [LegalSpecialty.OTHER]: "Other",
};

/** @deprecated Used by the outdated onboarding form. Does not match current backend API. */
export type ExpertProfileResponse = {
  profile: ExpertProfile | null;
  canEdit: boolean;
  completion: number;
  missingFields: string[];
};

export const EXPERT_STATUS_CONFIG: Record<ExpertStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  [ExpertStatus.DRAFT]: { label: "Draft", variant: "outline", color: "text-slate-500" },
  [ExpertStatus.PENDING_VERIFICATION]: { label: "Pending Review", variant: "secondary", color: "text-amber-600" },
  [ExpertStatus.VERIFIED]: { label: "Verified", variant: "default", color: "text-emerald-600" },
  [ExpertStatus.REJECTED]: { label: "Rejected", variant: "destructive", color: "text-red-600" },
  [ExpertStatus.SUSPENDED]: { label: "Suspended", variant: "destructive", color: "text-red-600" },
};
