/**
 * MyJudicial Database Seed
 * ========================
 * Seeds the first admin user into both Supabase Auth and PostgreSQL.
 *
 * Usage:
 *   npx tsx src/scripts/seed.ts
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 *
 * Safe to run multiple times — skips if admin already exists.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Pool } from "pg";

/* ── Validate required env vars ── */
const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "ADMIN_EMAIL",
  "ADMIN_FULL_NAME",
  "ADMIN_PASSWORD",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌  Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

/* ── Clients ── */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
});

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/* ── Helpers ── */
const [firstName, ...rest] = ADMIN_FULL_NAME.trim().split(" ");
const lastName = rest.join(" ") || firstName;

async function seedAdmin(): Promise<void> {
  console.log("🌱  Starting MyJudicial seed...\n");

  /* ── 1. Check if admin already exists in PostgreSQL ── */
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (existingUser) {
    if (existingUser.role !== "ADMIN") {
      console.error(
        `❌  A non-admin account already exists with email ${ADMIN_EMAIL}.`
      );
      console.error(
        "   Change ADMIN_EMAIL in your .env to a different address."
      );
      process.exit(1);
    }
    console.log(`✅  Admin already exists (id: ${existingUser.id}) — skipping.`);
    return;
  }

  /* ── 2. Check if Supabase Auth user already exists ── */
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existingAuthUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

  let supabaseUserId: string;

  if (existingAuthUser) {
    console.log(
      `ℹ️   Supabase Auth user found (${existingAuthUser.id}) — reusing.`
    );
    supabaseUserId = existingAuthUser.id;
  } else {
    /* ── 3. Create Supabase Auth identity ── */
    console.log(`📧  Creating Supabase Auth identity for ${ADMIN_EMAIL}...`);

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,  // Admin logs in with email + password
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_FULL_NAME,
          role: "ADMIN",
        },
      });

    if (authError || !authData.user) {
      console.error("❌  Failed to create Supabase Auth user:", authError?.message);
      process.exit(1);
    }

    supabaseUserId = authData.user.id;
    console.log(`✅  Supabase Auth user created (id: ${supabaseUserId})`);
  }

  /* ── 4. Create PostgreSQL user record ── */
  console.log("💾  Creating PostgreSQL user record...");

  const user = await prisma.user.create({
    data: {
      id: supabaseUserId, // Must match Supabase Auth UUID
      email: ADMIN_EMAIL,
      firstName,
      lastName,
      role: "ADMIN",
      status: "ACTIVE",
      preferredLanguage: "en",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  console.log(`✅  PostgreSQL user record created`);

  /* ── 5. Summary ── */
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉  Seed complete!\n");
  console.log(`  ID:        ${user.id}`);
  console.log(`  Email:     ${user.email}`);
  console.log(`  Name:      ${user.firstName} ${user.lastName}`);
  console.log(`  Role:      ${user.role}`);
  console.log(`  Status:    ${user.status}`);
  console.log(`  Created:   ${user.createdAt.toISOString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📌  Next step:");
  console.log(
    `   Log in via POST /api/v1/auth/admin/login with email: ${ADMIN_EMAIL}`
  );
  console.log(
    "   The account is pre-confirmed — no magic link required.\n"
  );
}

/* ── Run ── */
seedAdmin()
  .catch((error) => {
    console.error("❌  Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
