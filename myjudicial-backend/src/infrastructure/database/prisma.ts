import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { Pool } from "pg";
import { logger } from "../../shared/utils/logger.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from environment variables.");
}

/**
 * Strips Prisma-only query parameters (e.g., pgbouncer, connection_limit, pool_timeout)
 * so node-postgres (`pg.Pool`) receives a clean, standards-compliant PostgreSQL URI
 * without malformed query strings when multiple parameters are present.
 */
export function sanitizePgConnectionString(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete("pgbouncer");
    parsed.searchParams.delete("connection_limit");
    parsed.searchParams.delete("pool_timeout");
    return parsed.toString();
  } catch {
    return rawUrl.replace(/([?&])pgbouncer=true(&|$)/, (_match, prefix, suffix) =>
      prefix === "?" && suffix === "&" ? "?" : suffix
    );
  }
}

const pool = new Pool({
  connectionString: sanitizePgConnectionString(connectionString),

  ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },

  max: Number(process.env.DB_POOL_MAX) || 20,
  min: Number(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS) || 15000,
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS) || 30000,
  maxUses: Number(process.env.DB_CONNECTION_MAX_USES) || 7500,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Log pool errors so we can monitor connection issues
pool.on("error", (err) => {
  logger.error("Unexpected database pool error", {
    error: err.message,
    stack: err.stack,
  });
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

/**
 * Gracefully drains both Prisma and the underlying node-postgres Pool.
 */
export async function closeDatabasePool(): Promise<void> {
  try {
    await prisma.$disconnect();
    await pool.end();
  } catch (err) {
    logger.warn("Error while closing database pool", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
