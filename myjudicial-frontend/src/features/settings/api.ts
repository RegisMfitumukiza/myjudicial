import { apiFetch } from "@/lib/api/client";
import type { SettingsData } from "./settings";

type SettingsEnvelope = { success: boolean; data: SettingsData | { data?: SettingsData } };

function unwrapEnvelope(res: SettingsEnvelope): SettingsData {
  const inner = res.data;
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return (inner as { data: SettingsData }).data;
  }
  return inner as SettingsData;
}

export async function fetchAdminSettings(): Promise<SettingsData> {
  const res = await apiFetch<SettingsEnvelope>("/admin/settings");
  return unwrapEnvelope(res);
}

export async function saveSettingsSection(patch: Partial<SettingsData>): Promise<SettingsData> {
  const res = await apiFetch<SettingsEnvelope>("/admin/settings", {
    method: "PUT",
    body: patch,
  });
  return unwrapEnvelope(res);
}