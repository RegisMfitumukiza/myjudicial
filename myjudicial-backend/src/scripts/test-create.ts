import "dotenv/config";
import { supabaseAdmin } from "../infrastructure/supabase/supabase.client.js";

async function run() {
  const email = `test-${Date.now()}@example.com`;
  console.log(`Testing Supabase Admin Client createUser() for: ${email}...`);
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: "Test User",
        role: "CITIZEN",
      },
    });
    
    if (error) {
      console.error("Supabase API Error details:", error);
      console.error("Supabase API Error message:", error.message);
    } else {
      console.log("Supabase API Success! User created ID:", data?.user?.id);
      
      // Clean up by deleting the user
      console.log("Cleaning up user...");
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      if (deleteError) {
        console.error("Failed to delete test user:", deleteError.message);
      } else {
        console.log("Successfully cleaned up test user!");
      }
    }
  } catch (err: any) {
    console.error("Unhandled client error:", err);
  }
}

run().catch(console.error);
