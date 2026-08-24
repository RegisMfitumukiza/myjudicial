import { config } from "dotenv";
import path from "path";
try { config({ path: path.resolve(process.cwd(), "../.env") }); } catch {}
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
  const r = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
  console.log(JSON.stringify(r.rows));
} catch(e) { console.error(e.message); }
await pool.end();
