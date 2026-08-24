/**
 * MyJudicial Expert Seed
 * =======================
 * Deletes all existing experts and creates diverse, ready-to-use experts.
 * Experts are created as VERIFIED and visible on the map immediately.
 *
 * Usage:
 *   npx tsx prisma/seed-experts.ts
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, DIRECT_URL
 */

// Load from root .env — works both locally (dotenv) and in Docker (env already set)
import { config } from "dotenv";
import path from "path";
try {
  config({ path: path.resolve(process.cwd(), "../.env") });
} catch { /* env already set */ }
import ws from "ws";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Pool } from "pg";

/* ── Validate ── */
const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`❌  Missing env: ${key}`);
    process.exit(1);
  }
}

/* ── Clients ── */
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
});

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/* ── Expert Data ── */
type ExpertSeed = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  displayName: string;
  bio: string;
  barNumber: string;
  primarySpecialty: string;
  specialties: string[];
  languages: string[];
  yearsExperience: number;
  baseConsultationFee: number;
  city: string;
  latitude: number;
  longitude: number;
  officeAddress: string;
  presenceStatus: string;
};

const EXPERTS: ExpertSeed[] = [
  {
    email: "francois.mugenzi@myjudicial.rw",
    firstName: "Francois",
    lastName: "Mugenzi",
    phone: "+250788100001",
    displayName: "Mugenzi Francois",
    bio: "Experienced family law attorney specializing in divorce proceedings, child custody disputes, and inheritance matters. Deep understanding of Rwandan family law traditions combined with modern legal practice.",
    barNumber: "RBA-2019-0142",
    primarySpecialty: "FAMILY_LAW",
    specialties: ["FAMILY_LAW"],
    languages: ["en", "fr", "rw"],
    yearsExperience: 4,
    baseConsultationFee: 40000,
    city: "Kigali",
    latitude: -1.9403,
    longitude: 29.8739,
    officeAddress: "KG 7 Ave, Kigali",
    presenceStatus: "ONLINE",
  },
  {
    email: "alain.mugabo@myjudicial.rw",
    firstName: "Alain",
    lastName: "Mugabo",
    phone: "+250788100002",
    displayName: "Alain Mugabo",
    bio: "Commercial law specialist with 6 years of experience advising SMEs on contracts, corporate governance, and business formation across East Africa.",
    barNumber: "RBA-2018-0287",
    primarySpecialty: "COMMERCIAL_LAW",
    specialties: ["COMMERCIAL_LAW", "CONTRACT_LAW"],
    languages: ["en", "rw"],
    yearsExperience: 6,
    baseConsultationFee: 20000,
    city: "Kigali",
    latitude: -1.9536,
    longitude: 29.8801,
    officeAddress: "KN 5 Rd, Kigali",
    presenceStatus: "ONLINE",
  },
  {
    email: "claire.uwimana@myjudicial.rw",
    firstName: "Claire",
    lastName: "Uwimana",
    phone: "+250788100003",
    displayName: "Uwimana Claire",
    bio: "Criminal defense attorney with a strong track record in white-collar crime, fraud cases, and human rights litigation. Former public defender.",
    barNumber: "RBA-2016-0098",
    primarySpecialty: "CRIMINAL_LAW",
    specialties: ["CRIMINAL_LAW"],
    languages: ["en", "fr", "rw"],
    yearsExperience: 8,
    baseConsultationFee: 35000,
    city: "Kigali",
    latitude: -1.9441,
    longitude: 29.8785,
    officeAddress: "KG 11 Ave, Kigali",
    presenceStatus: "OFFLINE",
  },
  {
    email: "patrick.niyonzima@myjudicial.rw",
    firstName: "Patrick",
    lastName: "Niyonzima",
    phone: "+250788100004",
    displayName: "Niyonzima Patrick",
    bio: "Land law expert with deep knowledge of Rwandan land registration, property disputes, and customary land rights. Based in Huye serving the Southern Province.",
    barNumber: "RBA-2014-0056",
    primarySpecialty: "LAND_LAW",
    specialties: ["LAND_LAW"],
    languages: ["en", "rw"],
    yearsExperience: 10,
    baseConsultationFee: 25000,
    city: "Huye",
    latitude: -2.5967,
    longitude: 29.5396,
    officeAddress: "KN 3 Rd, Huye",
    presenceStatus: "ONLINE",
  },
  {
    email: "diane.mukamana@myjudicial.rw",
    firstName: "Diane",
    lastName: "Mukamana",
    phone: "+250788100005",
    displayName: "Mukamana Diane",
    bio: "Employment law specialist advocating for worker rights, labor disputes, and workplace discrimination cases. Passionate about fair employment practices.",
    barNumber: "RBA-2019-0178",
    primarySpecialty: "EMPLOYMENT_LAW",
    specialties: ["EMPLOYMENT_LAW"],
    languages: ["en", "fr"],
    yearsExperience: 5,
    baseConsultationFee: 30000,
    city: "Kigali",
    latitude: -1.9519,
    longitude: 29.8712,
    officeAddress: "KG 7 Ave, Kigali",
    presenceStatus: "BUSY",
  },
  {
    email: "jean.habimana@myjudicial.rw",
    firstName: "Jean Baptiste",
    lastName: "Habimana",
    phone: "+250788100006",
    displayName: "Habimana Jean Baptiste",
    bio: "Senior tax law consultant with 12 years of experience in tax planning, compliance, and dispute resolution for multinational corporations operating in Rwanda.",
    barNumber: "RBA-2012-0034",
    primarySpecialty: "TAX_LAW",
    specialties: ["TAX_LAW", "CORPORATE_LAW"],
    languages: ["en", "fr", "rw"],
    yearsExperience: 12,
    baseConsultationFee: 45000,
    city: "Kigali",
    latitude: -1.9472,
    longitude: 29.8845,
    officeAddress: "KN 5 Rd, Kigali",
    presenceStatus: "ONLINE",
  },
  {
    email: "grace.uwera@myjudicial.rw",
    firstName: "Grace",
    lastName: "Uwera",
    phone: "+250788100007",
    displayName: "Uwera Grace",
    bio: "Immigration lawyer helping clients navigate visa applications, work permits, and residency matters. Fluent in three languages with experience across East Africa.",
    barNumber: "RBA-2021-0312",
    primarySpecialty: "IMMIGRATION_LAW",
    specialties: ["IMMIGRATION_LAW"],
    languages: ["en", "fr", "rw"],
    yearsExperience: 3,
    baseConsultationFee: 28000,
    city: "Kigali",
    latitude: -1.9398,
    longitude: 29.8763,
    officeAddress: "KG 11 Ave, Kigali",
    presenceStatus: "ONLINE",
  },
  {
    email: "emmanuel.nsengiyumva@myjudicial.rw",
    firstName: "Emmanuel",
    lastName: "Nsengiyumva",
    phone: "+250788100008",
    displayName: "Nsengiyumva Emmanuel",
    bio: "Corporate law veteran with 15 years advising major corporations on mergers, acquisitions, and regulatory compliance. Former partner at a leading Kigali firm.",
    barNumber: "RBA-2009-0012",
    primarySpecialty: "CORPORATE_LAW",
    specialties: ["CORPORATE_LAW", "COMMERCIAL_LAW", "CONTRACT_LAW"],
    languages: ["en", "rw"],
    yearsExperience: 15,
    baseConsultationFee: 50000,
    city: "Kigali",
    latitude: -1.9489,
    longitude: 29.8821,
    officeAddress: "KN 5 Rd, Kigali",
    presenceStatus: "OFFLINE",
  },
  {
    email: "alice.karangwa@myjudicial.rw",
    firstName: "Alice",
    lastName: "Karangwa",
    phone: "+250788100009",
    displayName: "Karangwa Alice",
    bio: "Contract law specialist drafting and reviewing commercial agreements, MOUs, and partnership contracts. Known for clear, client-friendly communication.",
    barNumber: "RBA-2017-0198",
    primarySpecialty: "CONTRACT_LAW",
    specialties: ["CONTRACT_LAW", "COMMERCIAL_LAW"],
    languages: ["en", "rw"],
    yearsExperience: 7,
    baseConsultationFee: 22000,
    city: "Kigali",
    latitude: -1.9425,
    longitude: 29.8754,
    officeAddress: "KG 7 Ave, Kigali",
    presenceStatus: "ONLINE",
  },
  {
    email: "samuel.mugiraneza@myjudicial.rw",
    firstName: "Samuel",
    lastName: "Mugiraneza",
    phone: "+250788100010",
    displayName: "Mugiraneza Samuel",
    bio: "Intellectual property lawyer protecting brands, patents, and creative works. Experience with regional IP filings across the African continent.",
    barNumber: "RBA-2015-0089",
    primarySpecialty: "INTELLECTUAL_PROPERTY",
    specialties: ["INTELLECTUAL_PROPERTY", "COMMERCIAL_LAW"],
    languages: ["en", "fr", "rw"],
    yearsExperience: 9,
    baseConsultationFee: 35000,
    city: "Kigali",
    latitude: -1.9501,
    longitude: 29.8798,
    officeAddress: "KN 5 Rd, Kigali",
    presenceStatus: "ONLINE",
  },
  {
    email: "josiane.imanishimwe@myjudicial.rw",
    firstName: "Josiane",
    lastName: "Imanishimwe",
    phone: "+250788100011",
    displayName: "Imanishimwe Josiane",
    bio: "Family law attorney based in Musanze serving the Northern Province. Specializes in mediation and amicable dispute resolution to minimize conflict for families.",
    barNumber: "RBA-2020-0256",
    primarySpecialty: "FAMILY_LAW",
    specialties: ["FAMILY_LAW"],
    languages: ["en", "rw"],
    yearsExperience: 4,
    baseConsultationFee: 20000,
    city: "Musanze",
    latitude: -1.4994,
    longitude: 29.6344,
    officeAddress: "KN 12 Rd, Musanze",
    presenceStatus: "OFFLINE",
  },
  {
    email: "eric.ndayisaba@myjudicial.rw",
    firstName: "Eric",
    lastName: "Ndayisaba",
    phone: "+250788100012",
    displayName: "Ndayisaba Eric",
    bio: "Criminal law practitioner in Rubavu with expertise in cross-border legal matters near the DRC border. Fluent in French and Kinyarwanda.",
    barNumber: "RBA-2018-0234",
    primarySpecialty: "CRIMINAL_LAW",
    specialties: ["CRIMINAL_LAW"],
    languages: ["en", "fr", "rw"],
    yearsExperience: 6,
    baseConsultationFee: 25000,
    city: "Rubavu",
    latitude: -1.6714,
    longitude: 29.2524,
    officeAddress: "KN 1 Rd, Rubavu",
    presenceStatus: "ONLINE",
  },
  {
    email: "chantal.nyirahabimana@myjudicial.rw",
    firstName: "Chantal",
    lastName: "Nyirahabimana",
    phone: "+250788100013",
    displayName: "Nyirahabimana Chantal",
    bio: "Senior land law attorney with 11 years resolving complex property disputes, boundary issues, and land titling across Rwanda.",
    barNumber: "RBA-2013-0067",
    primarySpecialty: "LAND_LAW",
    specialties: ["LAND_LAW"],
    languages: ["en", "fr", "rw"],
    yearsExperience: 11,
    baseConsultationFee: 30000,
    city: "Kigali",
    latitude: -1.9456,
    longitude: 29.8812,
    officeAddress: "KG 7 Ave, Kigali",
    presenceStatus: "ONLINE",
  },
  {
    email: "issa.nkurunziza@myjudicial.rw",
    firstName: "Issa",
    lastName: "Nkurunziza",
    phone: "+250788100014",
    displayName: "Nkurunziza Issa",
    bio: "Commercial law expert advising startups and tech companies on funding agreements, IP protection, and regulatory compliance. Arabic, English, and Kinyarwanda speaker.",
    barNumber: "RBA-2016-0145",
    primarySpecialty: "COMMERCIAL_LAW",
    specialties: ["COMMERCIAL_LAW", "INTELLECTUAL_PROPERTY"],
    languages: ["en", "rw"],
    yearsExperience: 8,
    baseConsultationFee: 40000,
    city: "Kigali",
    latitude: -1.9434,
    longitude: 29.8767,
    officeAddress: "KN 5 Rd, Kigali",
    presenceStatus: "OFFLINE",
  },
];

/* ── Helpers ── */
function splitName(fullName: string): [string, string] {
  const parts = fullName.trim().split(" ");
  return [parts[0], parts.slice(1).join(" ") || parts[0]];
}

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;

/* ── Main ── */
async function main() {
  console.log("🗑️   Deleting all existing experts...\n");

  // Delete from Supabase Auth first
  const expertUsers = await prisma.user.findMany({
    where: { role: "EXPERT" },
    select: { id: true, email: true },
  });

  if (expertUsers.length > 0) {
    console.log(`   Found ${expertUsers.length} existing experts — deleting...`);
    for (const user of expertUsers) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        console.warn(`   ⚠️  Supabase delete failed for ${user.email}: ${error.message}`);
      }
    }
    // PostgreSQL cascade deletes via onDelete: Cascade
    await prisma.user.deleteMany({ where: { role: "EXPERT" } });
    console.log(`   ✅ Deleted ${expertUsers.length} experts from Supabase Auth + PostgreSQL\n`);
  } else {
    console.log("   No existing experts found.\n");
  }

  console.log("🌱  Seeding experts...\n");

  let created = 0;
  for (const expert of EXPERTS) {
    const [firstName, lastName] = splitName(expert.firstName + " " + expert.lastName);

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: expert.email,
      email_confirm: true,
      user_metadata: {
        full_name: expert.displayName,
        role: "EXPERT",
        first_name: firstName,
        last_name: lastName,
        phone: expert.phone,
      },
    });

    if (authError || !authData.user) {
      console.error(`   ❌ Failed to create auth user for ${expert.email}: ${authError?.message}`);
      continue;
    }

    // 2. Create PostgreSQL User
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: expert.email,
        firstName,
        lastName,
        phone: expert.phone,
        role: "EXPERT",
        status: "ACTIVE",
        preferredLanguage: "en",
      },
    });

    // 3. Create ExpertProfile (VERIFIED — bypass approval)
    const profile = await prisma.expertProfile.create({
      data: {
        userId: user.id,
        displayName: expert.displayName,
        bio: expert.bio,
        barNumber: expert.barNumber,
        yearsExperience: expert.yearsExperience,
        status: "VERIFIED",
        primarySpecialty: expert.primarySpecialty as any,
        specialties: expert.specialties as any[],
        languages: expert.languages,
        officeAddress: expert.officeAddress,
        city: expert.city,
        country: "Rwanda",
        latitude: expert.latitude,
        longitude: expert.longitude,
        baseConsultationFee: expert.baseConsultationFee,
        currency: "RWF",
      },
    });

    // 4. Create default Consultation service
    await prisma.legalService.create({
      data: {
        expertId: profile.id,
        name: "Consultation",
        description: `Legal consultation with ${expert.displayName}`,
        category: "consultation",
        deliveryMode: "VIDEO",
        durationMin: 60,
        flatFee: expert.baseConsultationFee,
        currency: "RWF",
        isActive: true,
        isDefault: true,
        sortOrder: 0,
      },
    });

    // 5. Create MapMarker (visible)
    await prisma.mapMarker.create({
      data: {
        expertId: profile.id,
        latitude: expert.latitude,
        longitude: expert.longitude,
        location: `SRID=4326;POINT(${expert.longitude} ${expert.latitude})` as any,
        isVisible: true,
      },
    });

    // 6. Create weekday availability (9am - 5pm)
    for (const day of WEEKDAYS) {
      await prisma.expertAvailability.create({
        data: {
          expertId: profile.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          presenceStatus: expert.presenceStatus as any,
          isAvailable: true,
        },
      });
    }

    created++;
    const fee = expert.baseConsultationFee.toLocaleString();
    console.log(`   ✅ ${expert.displayName} (${expert.primarySpecialty}) — ${expert.city}, ${fee} RWF`);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎉  Seed complete!`);
  console.log(`   ${created}/${EXPERTS.length} experts created`);
  console.log(`   All experts: VERIFIED, visible on map, Mon-Fri 9am-5pm`);
  console.log(`   No profile photos — ExpertAvatar shows initials`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main()
  .catch((error) => {
    console.error("❌  Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
