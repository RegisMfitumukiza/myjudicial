import { prisma } from "../../infrastructure/database/prisma.js";
import { writeAuditLog } from "../../shared/utils/audit.js";

export type PaymentMode = "BOOKING_FIRST" | "PAYMENT_REQUIRED";

export interface SocialLinks {
  x?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  whatsapp?: string;
}

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
  socialLinks: SocialLinks;
  // Company Contact & Headquarter Location
  supportEmail: string;
  hotlinePhone: string;
  whatsappNumber: string;
  officeBuilding: string;
  officeStreet: string;
  officeDistrict: string;
  officePoBox: string;
  // Public Editorial Content (About Us)
  aboutVision: string;
  aboutMission: string;
  aboutStory: string;
}

const DEFAULTS: SettingsData = {
  platformName: "MyJudicial",
  maintenanceMode: false,
  defaultRole: "CITIZEN",
  platformFeePercent: 15,
  minEscrowDurationSeconds: 300,
  paymentMode: "PAYMENT_REQUIRED",
  socialLinks: {
    x: "https://twitter.com/myjudicial",
    linkedin: "https://linkedin.com/company/myjudicial",
    facebook: "https://facebook.com/myjudicial",
    instagram: "https://instagram.com/myjudicial",
    youtube: "",
    whatsapp: "",
  },
  supportEmail: "support@myjudicial.com",
  hotlinePhone: "+250 788 312 456",
  whatsappNumber: "+250 788 312 456",
  officeBuilding: "Centenary House, 4th Floor",
  officeStreet: "KN 3 Ave & KN 4 St",
  officeDistrict: "Nyarugenge Central Business District, Kigali, Rwanda",
  officePoBox: "P.O. Box 2848, Kigali",
  aboutVision: "",
  aboutMission: "",
  aboutStory: "",
};

const KEYS: Record<keyof SettingsData, string> = {
  platformName: "platform_name",
  maintenanceMode: "maintenance_mode",
  defaultRole: "default_role",
  platformFeePercent: "platform_fee_percent",
  minEscrowDurationSeconds: "min_escrow_duration_seconds",
  paymentMode: "payment_mode",
  socialLinks: "social_links",
  supportEmail: "support_email",
  hotlinePhone: "hotline_phone",
  whatsappNumber: "whatsapp_number",
  officeBuilding: "office_building",
  officeStreet: "office_street",
  officeDistrict: "office_district",
  officePoBox: "office_po_box",
  aboutVision: "about_vision",
  aboutMission: "about_mission",
  aboutStory: "about_story",
};

function fromRecord(rows: { key: string; value: unknown }[]): SettingsData {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const rawPaymentMode = map.get(KEYS.paymentMode) as PaymentMode | undefined;
  const rawSocial = map.get(KEYS.socialLinks);
  const parsedSocial: SocialLinks =
    typeof rawSocial === "object" && rawSocial !== null
      ? (rawSocial as SocialLinks)
      : DEFAULTS.socialLinks;
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
    socialLinks: parsedSocial,
    supportEmail: (map.get(KEYS.supportEmail) as string) ?? DEFAULTS.supportEmail,
    hotlinePhone: (map.get(KEYS.hotlinePhone) as string) ?? DEFAULTS.hotlinePhone,
    whatsappNumber: (map.get(KEYS.whatsappNumber) as string) ?? DEFAULTS.whatsappNumber,
    officeBuilding: (map.get(KEYS.officeBuilding) as string) ?? DEFAULTS.officeBuilding,
    officeStreet: (map.get(KEYS.officeStreet) as string) ?? DEFAULTS.officeStreet,
    officeDistrict: (map.get(KEYS.officeDistrict) as string) ?? DEFAULTS.officeDistrict,
    officePoBox: (map.get(KEYS.officePoBox) as string) ?? DEFAULTS.officePoBox,
    aboutVision: (map.get(KEYS.aboutVision) as string) ?? DEFAULTS.aboutVision,
    aboutMission: (map.get(KEYS.aboutMission) as string) ?? DEFAULTS.aboutMission,
    aboutStory: (map.get(KEYS.aboutStory) as string) ?? DEFAULTS.aboutStory,
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
    if (input.socialLinks !== undefined) entries.push({ key: KEYS.socialLinks, value: input.socialLinks });
    if (input.supportEmail !== undefined) entries.push({ key: KEYS.supportEmail, value: input.supportEmail });
    if (input.hotlinePhone !== undefined) entries.push({ key: KEYS.hotlinePhone, value: input.hotlinePhone });
    if (input.whatsappNumber !== undefined) entries.push({ key: KEYS.whatsappNumber, value: input.whatsappNumber });
    if (input.officeBuilding !== undefined) entries.push({ key: KEYS.officeBuilding, value: input.officeBuilding });
    if (input.officeStreet !== undefined) entries.push({ key: KEYS.officeStreet, value: input.officeStreet });
    if (input.officeDistrict !== undefined) entries.push({ key: KEYS.officeDistrict, value: input.officeDistrict });
    if (input.officePoBox !== undefined) entries.push({ key: KEYS.officePoBox, value: input.officePoBox });
    if (input.aboutVision !== undefined) entries.push({ key: KEYS.aboutVision, value: input.aboutVision });
    if (input.aboutMission !== undefined) entries.push({ key: KEYS.aboutMission, value: input.aboutMission });
    if (input.aboutStory !== undefined) entries.push({ key: KEYS.aboutStory, value: input.aboutStory });

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
