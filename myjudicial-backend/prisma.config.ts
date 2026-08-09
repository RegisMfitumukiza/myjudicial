import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use DIRECT_URL for migrations (requires DDL support).
// Fall back to DATABASE_URL (pooler) for db push and other commands
// when the direct connection is unavailable.
const migrationUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];
const runtimeUrl = process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl ?? runtimeUrl,
  },
});