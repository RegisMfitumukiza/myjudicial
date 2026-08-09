import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { Pool } from "pg";
import { logger } from "../../shared/utils/logger.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from environment variables.");
}

const pool = new Pool({
  connectionString: connectionString.replace("?pgbouncer=true", ""),

  ssl: { 
    rejectUnauthorized: false 
  },

  max: Number(process.env.DB_POOL_MAX) || 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
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
