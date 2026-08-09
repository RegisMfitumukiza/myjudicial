import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing database connection string in .env");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Setting up Supabase to PostgreSQL triggers...");
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query("BEGIN;");

    // 1. Create or replace new user function
    console.log("Creating public.handle_new_user() function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      DECLARE
        full_name_val TEXT;
        first_name_val TEXT;
        last_name_val TEXT;
        role_val TEXT;
      BEGIN
        BEGIN
          full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', '');
          first_name_val := COALESCE(NULLIF(split_part(full_name_val, ' ', 1), ''), 'User');
          last_name_val  := COALESCE(NULLIF(substr(full_name_val, length(first_name_val) + 2), ''), first_name_val);
          role_val       := COALESCE(new.raw_user_meta_data->>'role', 'CITIZEN');

          -- Validate role: fall back to CITIZEN if unknown value given
          IF role_val NOT IN ('CITIZEN','EXPERT','ADMIN') THEN
            role_val := 'CITIZEN';
          END IF;

          INSERT INTO public.users (
            id,
            email,
            "firstName",
            "lastName",
            role,
            status,
            "preferredLanguage"
          )
          VALUES (
            new.id,
            new.email,
            first_name_val,
            last_name_val,
            role_val::"Role",
            'ACTIVE',
            'en'
          )
          ON CONFLICT (id) DO UPDATE
          SET
            email        = EXCLUDED.email,
            "firstName"  = CASE WHEN EXCLUDED."firstName" <> '' THEN EXCLUDED."firstName" ELSE public.users."firstName" END,
            "lastName"   = CASE WHEN EXCLUDED."lastName"  <> '' THEN EXCLUDED."lastName"  ELSE public.users."lastName"  END;

        EXCEPTION WHEN OTHERS THEN
          -- Log error but never block the Supabase auth insert
          RAISE WARNING 'handle_new_user trigger error (ignored): %', SQLERRM;
        END;

        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 2. Create trigger for user creation/update on auth.users
    console.log("Creating on_auth_user_created trigger...");
    await client.query("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;");
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    // 3. Create delete user function
    console.log("Creating public.handle_user_delete() function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_user_delete()
      RETURNS trigger AS $$
      BEGIN
        BEGIN
          DELETE FROM public.users WHERE id = old.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'handle_user_delete trigger error (ignored): %', SQLERRM;
        END;
        RETURN old;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 4. Create trigger for user deletion on auth.users
    console.log("Creating on_auth_user_deleted trigger...");
    await client.query("DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;");
    await client.query(`
      CREATE TRIGGER on_auth_user_deleted
        BEFORE DELETE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
    `);

    await client.query("COMMIT;");
    console.log("🎉  Triggers set up successfully!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("❌  Failed to set up triggers:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
