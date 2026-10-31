import type { CareerRoleItem, CareersHiringStatus, SupplementalFaqItem } from "@/features/settings/settings";

export interface FaqSnapshot {
  id: string;
  savedAt: string;
  count: number;
  authorEmail?: string;
  faqs: SupplementalFaqItem[];
}

export interface CareersSnapshot {
  id: string;
  savedAt: string;
  roleCount: number;
  hiringStatus: CareersHiringStatus;
  authorEmail?: string;
  roles: CareerRoleItem[];
}

const FAQS_STORAGE_KEY = "myjudicial_admin_faqs_snapshots_v1";
const CAREERS_STORAGE_KEY = "myjudicial_admin_careers_snapshots_v1";
const MAX_SNAPSHOTS = 25;

export function getFaqSnapshots(): FaqSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAQS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFaqSnapshot(
  faqs: SupplementalFaqItem[],
  authorEmail?: string
): FaqSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const snapshots = getFaqSnapshots();
    const newSnapshot: FaqSnapshot = {
      id: `faq_snap_${Date.now()}`,
      savedAt: new Date().toISOString(),
      count: faqs.length,
      authorEmail: authorEmail || "Admin",
      faqs: JSON.parse(JSON.stringify(faqs)),
    };
    const updated = [newSnapshot, ...snapshots.filter((s) => s.id !== newSnapshot.id)].slice(
      0,
      MAX_SNAPSHOTS
    );
    localStorage.setItem(FAQS_STORAGE_KEY, JSON.stringify(updated));
    return newSnapshot;
  } catch {
    return null;
  }
}

export function getCareersSnapshots(): CareersSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CAREERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCareersSnapshot(
  roles: CareerRoleItem[],
  hiringStatus: CareersHiringStatus,
  authorEmail?: string
): CareersSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const snapshots = getCareersSnapshots();
    const newSnapshot: CareersSnapshot = {
      id: `careers_snap_${Date.now()}`,
      savedAt: new Date().toISOString(),
      roleCount: roles.length,
      hiringStatus,
      authorEmail: authorEmail || "Admin",
      roles: JSON.parse(JSON.stringify(roles)),
    };
    const updated = [newSnapshot, ...snapshots.filter((s) => s.id !== newSnapshot.id)].slice(
      0,
      MAX_SNAPSHOTS
    );
    localStorage.setItem(CAREERS_STORAGE_KEY, JSON.stringify(updated));
    return newSnapshot;
  } catch {
    return null;
  }
}
