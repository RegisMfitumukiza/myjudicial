import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try { config({ path: path.resolve(__dirname, "../../.env") }); } catch {}
try { config({ path: path.resolve(__dirname, "../.env") }); } catch {}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !process.env.DATABASE_URL) {
  console.error("❌ Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL).");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  prepareThreshold: 0,
});

async function clearAllExperts() {
  console.log("🗑️  Starting expert accounts purge (PostgreSQL + Supabase Auth)...\n");

  const { rows: expertUsers } = await pool.query(`SELECT id, email FROM users WHERE role = 'EXPERT'`);

  if (expertUsers.length === 0) {
    console.log("✅ No expert accounts found in the database. Nothing to delete.");
    await pool.end();
    return;
  }

  console.log(`Found ${expertUsers.length} expert user(s) to remove.`);
  const ids = expertUsers.map((u) => u.id);
  const idList = ids.map((id) => `'${id}'`).join(",");

  // 1. Delete from Supabase Auth via Admin API
  console.log("1️⃣  Deleting from Supabase Auth...");
  for (const u of expertUsers) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        console.log(`   ✅ Supabase Auth user deleted: ${u.email} (${u.id})`);
      } else {
        console.warn(`   ⚠️  Supabase Auth delete status ${res.status} for ${u.email}`);
      }
    } catch (e) {
      console.warn(`   ⚠️  Supabase Auth delete failed for ${u.email}:`, e.message);
    }
  }

  // 2. Find expert profile IDs
  const { rows: profiles } = await pool.query(
    `SELECT id FROM experts WHERE "userId" IN (${idList})`
  );
  const pIds = profiles.map((p) => p.id);
  const pList = pIds.map((id) => `'${id}'`).join(",");

  // 3. Delete dependent relational data in PostgreSQL
  console.log("\n2️⃣  Cleaning up PostgreSQL records and foreign relations...");
  if (pList) {
    await pool.query(`DELETE FROM expert_replies WHERE "expertId" IN (${pList})`);
    await pool.query(
      `DELETE FROM bookings WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList})`
    );
    await pool.query(
      `DELETE FROM reviews WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList})`
    );
  }

  await pool.query(`DELETE FROM review_reports WHERE "reportedBy" IN (${idList})`);
  await pool.query(`DELETE FROM review_reactions WHERE "userId" IN (${idList})`);
  await pool.query(
    `DELETE FROM payments WHERE "bookingId" NOT IN (SELECT id FROM bookings)`
  );

  if (pList) {
    await pool.query(
      `DELETE FROM documents WHERE "ownerId" IN (${idList}) OR "bookingId" IN (SELECT id FROM bookings WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList}))`
    );
  } else {
    await pool.query(`DELETE FROM documents WHERE "ownerId" IN (${idList})`);
  }

  await pool.query(`DELETE FROM messages WHERE "senderId" IN (${idList})`);
  await pool.query(`DELETE FROM conversation_participants WHERE "userId" IN (${idList})`);

  if (pList) {
    await pool.query(
      `DELETE FROM admin_actions WHERE "expert_id" IN (${pList}) OR "admin_user_id" IN (${idList})`
    );
  } else {
    await pool.query(`DELETE FROM admin_actions WHERE "admin_user_id" IN (${idList})`);
  }

  await pool.query(`DELETE FROM expert_verifications WHERE "reviewedById" IN (${idList})`);
  await pool.query(`DELETE FROM audit_logs WHERE "actorId" IN (${idList})`);

  // 4. Delete from users table (cascades to experts, services, map_markers, availability)
  await pool.query(`DELETE FROM users WHERE role = 'EXPERT'`);

  console.log(`\n🎉 Successfully deleted ${expertUsers.length} expert(s) from PostgreSQL and Supabase Auth!`);
  console.log("All expert emails are now completely released and ready for fresh registration via the GUI.");
  await pool.end();
}

clearAllExperts().catch((err) => {
  console.error("❌ Purge failed:", err);
  process.exit(1);
});
