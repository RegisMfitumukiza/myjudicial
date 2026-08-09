import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
});

async function run() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx tsx src/scripts/delete-user.ts <email>");
    console.log("Listing current users instead:\n");
    
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error("Error listing users:", error.message);
      return;
    }
    
    for (const u of data.users) {
      console.log(`- Email: ${u.email} (ID: ${u.id})`);
    }
    return;
  }

  console.log(`Searching for user with email: ${email}...`);
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }

  const user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log(`No user found in Supabase Auth with email: ${email}`);
    return;
  }

  console.log(`Found user: ${user.email} (ID: ${user.id}). Deleting...`);
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Failed to delete user:", deleteError.message);
  } else {
    console.log(`Successfully deleted user: ${email} from Supabase Auth!`);
  }
}

run().catch(console.error);
