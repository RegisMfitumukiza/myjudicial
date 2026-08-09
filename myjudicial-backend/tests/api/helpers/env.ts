/* Test environment bootstrap.
 *
 * Imported BEFORE the Express app so module-level env guards
 * (DATABASE_URL, SUPABASE_URL, REDIS_URL, ...) never throw and rate
 * limits run in relaxed "test" mode. Values are deliberately dummy —
 * no real service is contacted: DB/Redis/Supabase calls are mocked in
 * tests/api/helpers/app.ts.
 */
process.env.NODE_ENV = "test";

const env: Record<string, string> = {
  NODE_ENV: "test",
  PORT: "4000",
  DATABASE_URL: "postgresql://test:test@localhost:5432/myjudicial_test",
  DIRECT_URL: "postgresql://test:test@localhost:5432/myjudicial_test",
  DB_POOL_MAX: "2",
  REDIS_URL: "redis://localhost:6379",

  SUPABASE_URL: "https://test-project.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  SUPABASE_WEBHOOK_SECRET: "test-webhook-secret",

  CORS_ORIGIN: "http://localhost:3000,http://localhost:4000",
  BASE_URL: "http://localhost:4000",
  FRONTEND_URL: "http://localhost:3000",
  RENDER_EXTERNAL_URL: "http://localhost:4000",

  AI_SERVICE_URL: "http://localhost:5000",
  AI_SERVICE_KEY: "test-ai-service-key",

  BREVO_API_KEY: "test-brevo-key",
  EMAIL_FROM_ADDRESS: "noreply@test.local",
  EMAIL_FROM_NAME: "MyJudicial Test",

  LIVEKIT_HOST: "https://test.livekit.cloud",
  LIVEKIT_API_KEY: "test-livekit-key",
  LIVEKIT_API_SECRET: "test-livekit-secret",

  AZAMPAY_API_KEY: "test-azampay-key",
  AZAMPAY_APP_NAME: "MyJudicial Test",
  AZAMPAY_AUTH_URL: "https://test.azampay.local/auth",
  AZAMPAY_CHECKOUT_URL: "https://test.azampay.local/checkout",
  AZAMPAY_DISBURSEMENT_URL: "https://test.azampay.local/disburse",
  AZAMPAY_CLIENT_ID: "test-azampay-client",
  AZAMPAY_CLIENT_SECRET: "test-azampay-secret",
  AZAMPAY_DEST_COUNTRY_CODE: "TZ",
  AZAMPAY_SOURCE_COUNTRY_CODE: "TZ",
  AZAMPAY_SOURCE_BANK_NAME: "NMB",
  AZAMPAY_SOURCE_ACCOUNT_NUMBER: "0000000000",
  AZAMPAY_SOURCE_FULL_NAME: "MyJudicial Test",
  AZAMPAY_ENV: "sandbox",
  AZAMPAY_DISBURSEMENT_ENABLED: "false",
  AZAMPAY_WEBHOOK_SECRET: "test-azampay-webhook-secret",

  OCI_REGION: "uk-london-1",
  OCI_BUCKET_NAME: "test-bucket",
  OCI_ACCESS_KEY_ID: "test-oci-access-key",
  OCI_SECRET_ACCESS_KEY: "test-oci-secret-key",
  OCI_KMS_ENDPOINT: "https://test.kms.oci.local",
  OCI_KMS_MASTER_KEY_ID: "test-master-key-id",

  WHATSAPP_ACCESS_TOKEN: "test-whatsapp-token",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "test-whatsapp-ba-id",
  WHATSAPP_PHONE_NUMBER_ID: "test-whatsapp-phone-id",
  WHATSAPP_VERIFY_TOKEN: "test-whatsapp-verify-token",
  WHATSAPP_WEBHOOK_SECRET: "test-whatsapp-webhook-secret",

  AUDIT_LOG_RETENTION_DAYS: "90",
};

for (const [key, value] of Object.entries(env)) {
  process.env[key] = value;
}
