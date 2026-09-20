import { prisma } from "../../infrastructure/database/prisma.js";
import { writeAuditLog } from "../../shared/utils/audit.js";

export type PaymentMode = "BOOKING_FIRST" | "PAYMENT_REQUIRED";

export interface SettingsData {
  platformName: string;
  maintenanceMode: boolean;
  defaultRole: "CITIZEN" | "EXPERT";
  platformFeePercent: number;
  minEscrowDurationSeconds: number;
  /**
   * Booking workflow control.
   *
   * - "BOOKING_FIRST":   bookings are created as requests awaiting the expert's
   *   response; no Mobile Money payment is collected at booking time. Used while
   *   AzamPay is not production ready (Rwanda is migrating to E-Kash).
   * - "PAYMENT_REQUIRED": legacy flow — booking creation pushes an AzamPay MNO
   *   checkout and the booking is confirmed once payment is received.
   */
  paymentMode: PaymentMode;
}

const DEFAULTS: SettingsData = {
  platformName: "MyJudicial",
  maintenanceMode: false,
  defaultRole: "CITIZEN",
  platformFeePercent: 15,
  minEscrowDurationSeconds: 300,
  paymentMode: "PAYMENT_REQUIRED",
};

const KEYS: Record<keyof SettingsData, string> = {
  platformName: "platform_name",
  maintenanceMode: "maintenance_mode",
  defaultRole: "default_role",
  platformFeePercent: "platform_fee_percent",
  minEscrowDurationSeconds: "min_escrow_duration_seconds",
  paymentMode: "payment_mode",
};

function fromRecord(rows: { key: string; value: unknown }[]): SettingsData {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const rawPaymentMode = map.get(KEYS.paymentMode) as PaymentMode | undefined;
  return {
    platformName: (map.get(KEYS.platformName) as string) ?? DEFAULTS.platformName,
    maintenanceMode: (map.get(KEYS.maintenanceMode) as boolean) ?? DEFAULTS.maintenanceMode,
    defaultRole: (map.get(KEYS.defaultRole) as "CITIZEN" | "EXPERT") ?? DEFAULTS.defaultRole,
    platformFeePercent: (map.get(KEYS.platformFeePercent) as number) ?? DEFAULTS.platformFeePercent,
    minEscrowDurationSeconds: (map.get(KEYS.minEscrowDurationSeconds) as number) ?? DEFAULTS.minEscrowDurationSeconds,
    paymentMode:
      rawPaymentMode === "BOOKING_FIRST"
        ? "BOOKING_FIRST"
        : rawPaymentMode === "PAYMENT_REQUIRED"
        ? "PAYMENT_REQUIRED"
        : DEFAULTS.paymentMode,
  };
}

let settingCache: { data: SettingsData; until: number } | null = null;

async function getAllCached(): Promise<SettingsData> {
  if (settingCache && Date.now() < settingCache.until) return settingCache.data;
  const rows = await prisma.platformSetting.findMany();
  const data = fromRecord(rows);
  settingCache = { data, until: Date.now() + 30_000 };
  return data;
}

export function invalidateSettingCache(): void {
  settingCache = null;
}

export const AdminSettingService = {
  async getAll(): Promise<{ data: SettingsData }> {
    const data = await getAllCached();
    return { data };
  },

  async get<K extends keyof SettingsData>(key: K): Promise<SettingsData[K]> {
    const data = await getAllCached();
    return data[key];
  },

  async update(input: Partial<SettingsData>, adminId: string, ipAddress?: string): Promise<{ data: SettingsData }> {
    const entries: { key: string; value: unknown }[] = [];

    if (input.platformName !== undefined) entries.push({ key: KEYS.platformName, value: input.platformName });
    if (input.maintenanceMode !== undefined) entries.push({ key: KEYS.maintenanceMode, value: input.maintenanceMode });
    if (input.defaultRole !== undefined) entries.push({ key: KEYS.defaultRole, value: input.defaultRole });
    if (input.platformFeePercent !== undefined) entries.push({ key: KEYS.platformFeePercent, value: input.platformFeePercent });
    if (input.minEscrowDurationSeconds !== undefined) entries.push({ key: KEYS.minEscrowDurationSeconds, value: input.minEscrowDurationSeconds });
    if (input.paymentMode !== undefined) entries.push({ key: KEYS.paymentMode, value: input.paymentMode });

    if (entries.length === 0) return this.getAll();

    await prisma.$transaction(
      entries.map((e) =>
        prisma.platformSetting.upsert({
          where: { key: e.key },
          create: { key: e.key, value: e.value as any, updatedBy: adminId },
          update: { value: e.value as any, updatedBy: adminId },
        })
      )
    );

    invalidateSettingCache();

    await writeAuditLog({
      actorId: adminId,
      action: "UPDATE",
      resource: "USER",
      description: `Updated platform settings: ${entries.map((e) => e.key).join(", ")}`,
      ipAddress,
    });

    return this.getAll();
  },
};
