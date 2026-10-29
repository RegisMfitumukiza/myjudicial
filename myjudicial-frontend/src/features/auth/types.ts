export enum UserRole {
  CITIZEN = "CITIZEN",
  EXPERT = "EXPERT",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatarObjectKey: string | null;
  avatarUrl?: string | null;
  preferredLanguage: string;
  createdAt: string;
  lastLoginAt?: string | null;
  updatedAt?: string;
  expertProfile: {
    id: string;
    status: string;
  } | null;
  clientDistrict?: { id: string; name: string } | null;
  clientSector?: { id: string; name: string } | null;
  clientDistrictId?: string | null;
  clientSectorId?: string | null;
  onboarding?: any;
};
