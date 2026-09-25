import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL is used for migrations (requires DDL support).
// DATABASE_URL is used for pooler/runtime queries.
// A dummy postgresql URL is provided as fallback so `prisma generate`
// works during Docker builds where env vars are not yet injected.
const DUMMY_URL = "postgresql://user:password@localhost:5432/db?schema=public";
const migrationUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? DUMMY_URL;
const runtimeUrl = process.env["DATABASE_URL"] ?? DUMMY_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
