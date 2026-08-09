import "dotenv/config";
import { supabaseAdmin } from "../infrastructure/supabase/supabase.client.js";

async function run() {
  console.log("Testing Supabase Admin Client listUsers()...");
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error("Supabase API Error details:", error);
      console.error("Supabase API Error message:", error.message);
      console.error("Supabase API Error status:", error.status);
    } else {
      console.log("Supabase API Success! Users found:", data?.users?.length);
    }
  } catch (err: any) {
    console.error("Unhandled client error:", err);
    console.error("Unhandled client error message:", err.message);
    console.error("Unhandled client error code:", err.code);
  }
}

run().catch(console.error);
