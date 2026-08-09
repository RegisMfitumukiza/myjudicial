import "dotenv/config";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  const email = `test-fetch-${Date.now()}@example.com`;
  console.log(`Testing raw fetch POST to Supabase for: ${email}...`);
  try {
    const res = await fetch('https://jzgynmozpbyqpmxktutf.supabase.co/auth/v1/admin/users', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: "Test Fetch",
          role: "CITIZEN"
        }
      })
    });

    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }

    console.log('Fetch POST Response status:', status);
    console.log('Fetch POST Response data:', data);
  } catch (err: any) {
    console.error('Fetch POST Error detail:', err);
    console.error('Fetch POST Error message:', err.message);
  }
}

run().catch(console.error);
