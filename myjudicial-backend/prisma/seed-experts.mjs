import { config } from "dotenv";
import path from "path";
try { config({ path: path.resolve(process.cwd(), "../.env") }); } catch {}
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY || !process.env.DATABASE_URL) {
  console.error("❌ Missing env vars"); process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, prepareThreshold: 0 });

const EXPERTS = [
  { email:"mfitumukizaregis4@gmail.com", firstName:"Regis", lastName:"Mfitumukiza", phone:"+250788100001", displayName:"Mfitumukiza Regis", bio:"Experienced family law attorney specializing in divorce proceedings, child custody disputes, and inheritance matters.", barNumber:"RBA-2019-0142", primarySpecialty:"FAMILY_LAW", specialties:["FAMILY_LAW"], languages:["en","fr","rw"], yearsExperience:4, baseConsultationFee:40000, city:"Kigali", latitude:-1.9420, longitude:30.0895, officeAddress:"KG 7 Ave, Kacyiru, Kigali", presenceStatus:"ONLINE" },
  { email:"mfitumukizaregis077@gmail.com", firstName:"Aline", lastName:"Mukamurera", phone:"+250788100002", displayName:"Mukamurera Aline", bio:"Commercial law specialist with 6 years advising SMEs on contracts, corporate governance, and business formation.", barNumber:"RBA-2018-0287", primarySpecialty:"COMMERCIAL_LAW", specialties:["COMMERCIAL_LAW","CONTRACT_LAW"], languages:["en","rw"], yearsExperience:6, baseConsultationFee:20000, city:"Kigali", latitude:-1.9515, longitude:30.0592, officeAddress:"KN 5 Rd, Nyarugenge CBD, Kigali", presenceStatus:"ONLINE" },
  { email:"mfitumukizaregis7@gmail.com", firstName:"Claude", lastName:"Hakizimana", phone:"+250788100003", displayName:"Hakizimana Claude", bio:"Criminal defense attorney with a strong track record in white-collar crime, fraud cases, and human rights litigation.", barNumber:"RBA-2016-0098", primarySpecialty:"CRIMINAL_LAW", specialties:["CRIMINAL_LAW"], languages:["en","fr","rw"], yearsExperience:8, baseConsultationFee:35000, city:"Kigali", latitude:-1.9485, longitude:30.0935, officeAddress:"KG 11 Ave, Kimihurura, Kigali", presenceStatus:"OFFLINE" },
  { email:"odamuka35@gmail.com", firstName:"Patrick", lastName:"Niyonzima", phone:"+250788100004", displayName:"Niyonzima Patrick", bio:"Land law expert with deep knowledge of Rwandan land registration, property disputes, and customary land rights.", barNumber:"RBA-2014-0056", primarySpecialty:"LAND_LAW", specialties:["LAND_LAW"], languages:["en","rw"], yearsExperience:10, baseConsultationFee:25000, city:"Huye", latitude:-2.5967, longitude:29.7396, officeAddress:"KN 3 Rd, Huye", presenceStatus:"ONLINE" },
  { email:"mfitumukizaregis90@gmail.com", firstName:"Diane", lastName:"Mukamana", phone:"+250788100005", displayName:"Mukamana Diane", bio:"Employment law specialist advocating for worker rights, labor disputes, and workplace discrimination cases.", barNumber:"RBA-2019-0178", primarySpecialty:"EMPLOYMENT_LAW", specialties:["EMPLOYMENT_LAW"], languages:["en","fr"], yearsExperience:5, baseConsultationFee:30000, city:"Kigali", latitude:-1.9395, longitude:30.0850, officeAddress:"KG 7 Ave, Kacyiru, Kigali", presenceStatus:"BUSY" },
  { email:"cedrokami179@gmail.com", firstName:"Jean Baptiste", lastName:"Habimana", phone:"+250788100006", displayName:"Habimana Jean Baptiste", bio:"Senior tax law consultant with 12 years in tax planning, compliance, and dispute resolution for multinationals.", barNumber:"RBA-2012-0034", primarySpecialty:"TAX_LAW", specialties:["TAX_LAW","CORPORATE_LAW"], languages:["en","fr","rw"], yearsExperience:12, baseConsultationFee:45000, city:"Kigali", latitude:-1.9540, longitude:30.0610, officeAddress:"KN 4 Ave, Nyarugenge CBD, Kigali", presenceStatus:"ONLINE" },
  { email:"gravityuserinspace@gmail.com", firstName:"Grace", lastName:"Uwera", phone:"+250788100007", displayName:"Uwera Grace", bio:"Immigration lawyer helping clients navigate visa applications, work permits, and residency matters.", barNumber:"RBA-2021-0312", primarySpecialty:"IMMIGRATION_LAW", specialties:["IMMIGRATION_LAW"], languages:["en","fr","rw"], yearsExperience:3, baseConsultationFee:28000, city:"Kigali", latitude:-1.9380, longitude:30.1080, officeAddress:"KG 17 Ave, Nyarutarama, Kigali", presenceStatus:"ONLINE" },
  { email:"antigravityearth4@gmail.com", firstName:"Emmanuel", lastName:"Nsengiyumva", phone:"+250788100008", displayName:"Nsengiyumva Emmanuel", bio:"Corporate law veteran with 15 years advising major corporations on mergers, acquisitions, and regulatory compliance.", barNumber:"RBA-2009-0012", primarySpecialty:"CORPORATE_LAW", specialties:["CORPORATE_LAW","COMMERCIAL_LAW","CONTRACT_LAW"], languages:["en","rw"], yearsExperience:15, baseConsultationFee:50000, city:"Kigali", latitude:-1.9525, longitude:30.0980, officeAddress:"KG 9 Ave, Kimihurura, Kigali", presenceStatus:"OFFLINE" },
  { email:"antigravityearth5@gmail.com", firstName:"Alice", lastName:"Karangwa", phone:"+250788100009", displayName:"Karangwa Alice", bio:"Contract law specialist drafting and reviewing commercial agreements, MOUs, and partnership contracts.", barNumber:"RBA-2017-0198", primarySpecialty:"CONTRACT_LAW", specialties:["CONTRACT_LAW","COMMERCIAL_LAW"], languages:["en","rw"], yearsExperience:7, baseConsultationFee:22000, city:"Kigali", latitude:-1.9480, longitude:30.0570, officeAddress:"KN 2 St, Nyarugenge CBD, Kigali", presenceStatus:"ONLINE" },
  { email:"antigravityearth6@gmail.com", firstName:"Samuel", lastName:"Mugiraneza", phone:"+250788100010", displayName:"Mugiraneza Samuel", bio:"Intellectual property lawyer protecting brands, patents, and creative works across the African continent.", barNumber:"RBA-2015-0089", primarySpecialty:"INTELLECTUAL_PROPERTY", specialties:["INTELLECTUAL_PROPERTY","COMMERCIAL_LAW"], languages:["en","fr","rw"], yearsExperience:9, baseConsultationFee:35000, city:"Kigali", latitude:-1.9560, longitude:30.0915, officeAddress:"KG 622 St, Kimihurura, Kigali", presenceStatus:"ONLINE" },
];

const WEEKDAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];

function splitName(fullName) { const p = fullName.trim().split(" "); return [p[0], p.slice(1).join(" ") || p[0]]; }
function uuid() { return crypto.randomUUID(); }

async function main() {
  console.log("🗑️  Deleting all existing experts...\n");

  const { rows: expertUsers } = await pool.query(`SELECT id, email FROM users WHERE role = 'EXPERT'`);
  // Also clean up orphan Supabase Auth users for our target emails
  for (const expert of EXPERTS) {
    try {
      const ctrl = new AbortController();
      const tmr = setTimeout(() => ctrl.abort(), 15000);
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(expert.email)}`, {
        headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
        signal: ctrl.signal,
      });
      clearTimeout(tmr);
      if (listRes.ok) {
        const listData = await listRes.json();
        for (const u of (listData.users || [])) {
          const dc = new AbortController();
          const dt = setTimeout(() => dc.abort(), 15000);
          await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
            signal: dc.signal,
          }).catch(() => {});
          clearTimeout(dt);
          console.log(`   🧹 Cleaned orphan auth user: ${expert.email} (${u.id})`);
        }
      }
    } catch {}
  }

  if (expertUsers.length > 0) {
    console.log(`   Found ${expertUsers.length} existing experts — deleting...`);
    const ids = expertUsers.map(u => u.id);
    const idList = ids.map(id => `'${id}'`).join(",");

    // Delete Supabase Auth users via REST
    for (const u of expertUsers) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) console.warn(`   ⚠️  Supabase delete failed for ${u.email}: ${res.status}`);
      } catch (e) {
        clearTimeout(timer);
        console.warn(`   ⚠️  Supabase delete failed for ${u.email}: ${e.message}`);
      }
    }

    // Find ExpertProfile IDs
    const { rows: profiles } = await pool.query(`SELECT id FROM experts WHERE "userId" IN (${idList})`);
    const pIds = profiles.map(p => p.id);
    const pList = pIds.map(id => `'${id}'`).join(",");

    // Delete dependent records (leaf-first)
    if (pList) {
      await pool.query(`DELETE FROM expert_replies WHERE "expertId" IN (${pList})`);
      await pool.query(`DELETE FROM bookings WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList})`);
      await pool.query(`DELETE FROM reviews WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList})`);
    }
    await pool.query(`DELETE FROM review_reports WHERE "reportedBy" IN (${idList})`);
    await pool.query(`DELETE FROM review_reactions WHERE "userId" IN (${idList})`);
    await pool.query(`DELETE FROM payments WHERE "bookingId" NOT IN (SELECT id FROM bookings)`);
    if (pList) {
      await pool.query(`DELETE FROM documents WHERE "ownerId" IN (${idList}) OR "bookingId" IN (SELECT id FROM bookings WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList}))`);
    } else {
      await pool.query(`DELETE FROM documents WHERE "ownerId" IN (${idList})`);
    }
    await pool.query(`DELETE FROM messages WHERE "senderId" IN (${idList})`);
    await pool.query(`DELETE FROM conversation_participants WHERE "userId" IN (${idList})`);
    if (pList) {
      await pool.query(`DELETE FROM admin_actions WHERE "expert_id" IN (${pList}) OR "admin_user_id" IN (${idList})`);
    } else {
      await pool.query(`DELETE FROM admin_actions WHERE "admin_user_id" IN (${idList})`);
    }
    await pool.query(`DELETE FROM expert_verifications WHERE "reviewedById" IN (${idList})`);
    await pool.query(`DELETE FROM audit_logs WHERE "actorId" IN (${idList})`);
    // Re-delete bookings/reviews in case there were remaining deps
    if (pList) {
      await pool.query(`DELETE FROM bookings WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList})`);
      await pool.query(`DELETE FROM reviews WHERE "expertId" IN (${pList}) OR "citizenId" IN (${idList})`);
    } else {
      await pool.query(`DELETE FROM bookings WHERE "citizenId" IN (${idList})`);
      await pool.query(`DELETE FROM reviews WHERE "citizenId" IN (${idList})`);
    }
    // Delete User (cascades ExpertProfile → services, availability, map_markers, etc.)
    await pool.query(`DELETE FROM users WHERE role = 'EXPERT'`);
    console.log(`   ✅ Deleted ${expertUsers.length} experts\n`);
  } else {
    console.log("   No existing experts found.\n");
  }

  console.log("🌱 Seeding experts...\n");
  let created = 0;

  for (const expert of EXPERTS) {
    const [firstName, lastName] = splitName(expert.firstName + " " + expert.lastName);

    // 1. Create Supabase Auth user
    const ctrl = new AbortController();
    const tmr = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body: JSON.stringify({ email: expert.email, email_confirm: true, user_metadata: { full_name: expert.displayName, role: "EXPERT", first_name: firstName, last_name: lastName, phone: expert.phone } }),
      signal: ctrl.signal,
    });
    clearTimeout(tmr);
    const authData = await res.json();
    if (!res.ok || !authData.id) {
      console.error(`   ❌ Failed to create auth user for ${expert.email}: ${authData.msg || authData.error_description || res.status}`);
      continue;
    }
    const userId = authData.id;
    console.log(`   ✅ Auth user created: ${expert.email} (${userId})`);

    // 2. Create User (string interpolation for one-shot seed — no injection risk)
    const esc = s => s ? `'${String(s).replace(/'/g, "''")}'` : 'NULL';
    await pool.query(
      `INSERT INTO users (id, email, "firstName", "lastName", phone, role, status, "preferredLanguage", "createdAt", "updatedAt")
       VALUES (${esc(userId)}, ${esc(expert.email)}, ${esc(firstName)}, ${esc(lastName)}, ${esc(expert.phone)}, 'EXPERT', 'ACTIVE', 'en', NOW(), NOW())`
    );

    // 3. Create ExpertProfile
    const profileId = uuid();
    await pool.query(
      `INSERT INTO experts (id, "userId", "displayName", bio, "barNumber", "yearsExperience", status, "primarySpecialty", specialties, languages, "officeAddress", city, country, latitude, longitude, "baseConsultationFee", currency, "createdAt", "updatedAt")
       VALUES (${esc(profileId)}, ${esc(userId)}, ${esc(expert.displayName)}, ${esc(expert.bio)}, ${esc(expert.barNumber)}, ${expert.yearsExperience}, 'VERIFIED', ${esc(expert.primarySpecialty)}, ARRAY[${expert.specialties.map(s => esc(s)).join(",")}]::"LegalSpecialty"[], ARRAY[${expert.languages.map(s => esc(s)).join(",")}]::text[], ${esc(expert.officeAddress)}, ${esc(expert.city)}, 'Rwanda', ${expert.latitude}, ${expert.longitude}, ${expert.baseConsultationFee}, 'RWF', NOW(), NOW())`
    );

    // 4. Create default Consultation service
    await pool.query(
      `INSERT INTO services (id, "expertId", name, description, category, "deliveryMode", "durationMin", "flatFee", currency, "isActive", "isDefault", "sortOrder", "createdAt", "updatedAt")
       VALUES (${esc(uuid())}, ${esc(profileId)}, 'Consultation', ${esc(`Legal consultation with ${expert.displayName}`)}, 'consultation', 'VIDEO', 60, ${expert.baseConsultationFee}, 'RWF', true, true, 0, NOW(), NOW())`
    );

    // 5. Create MapMarker (raw SQL for PostGIS geography type)
    await pool.query(
      `INSERT INTO map_markers (id, "expertId", latitude, longitude, location, "isVisible", "createdAt", "updatedAt")
       VALUES (${esc(uuid())}, ${esc(profileId)}, ${expert.latitude}, ${expert.longitude}, ST_SetSRID(ST_MakePoint(${expert.longitude}, ${expert.latitude}), 4326)::geography, true, NOW(), NOW())`
    );

    // 6. Create weekday availability
    for (const day of WEEKDAYS) {
      await pool.query(
        `INSERT INTO expert_availability (id, "expertId", "dayOfWeek", "startTime", "endTime", "isAvailable", "createdAt", "updatedAt")
         VALUES (${esc(uuid())}, ${esc(profileId)}, ${esc(day)}, '09:00', '17:00', true, NOW(), NOW())`
      );
    }

    created++;
    console.log(`   ✅ [${created}/${EXPERTS.length}] ${expert.displayName} (${expert.primarySpecialty}) — ${expert.city}`);
  }

  console.log(`\n🎉 Seeded ${created} experts successfully!`);
  await pool.end();
}

main().catch(e => { console.error("❌ Seed failed:", e.message); process.exit(1); });
