import 'dotenv/config';
import path from "path";

import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";

import apiV1 from "./interfaces/http/routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { globalErrorHandler } from "./shared/middleware/errorHandler.js";
import { notFoundHandler } from "./shared/middleware/notFound.js";
import { apiLimiter, perUserLimiter } from "./shared/middleware/rateLimiting.js";
import { maintenanceMode } from "./shared/middleware/maintenanceMode.js";
import { detectLanguage } from "./shared/middleware/language.middleware.js";
import { setupSwagger } from "./infrastructure/swagger/swagger.js";
import { logger } from "./shared/utils/logger.js";
import morgan from "morgan";
import  "./infrastructure/supabase/supabase.client.js";// src/app.ts
import paymentRoutes from "./modules/payments/payment.routes.js";
import livekitRoutes from "./infrastructure/livekit/livekit.routes.js";


const app = express();
app.set("trust proxy", 1);

/* ================= SECURITY ================= */

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(
  cors({
    origin: (origin, cb) => {
      const configured = process.env.CORS_ORIGIN?.split(",")
        .map((o) => o.trim())
        .filter(Boolean) ?? [];
      const isAllowed =
        !origin ||
        configured.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// Azam Pay webhook needs raw body access

app.use(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" })
);

app.use(
  "/api/v1/payments/payout-webhook",
  express.raw({ type: "application/json" })
);

// LiveKit sends webhook body as text/plain — keep raw for signature verification
app.use(
  "/api/v1/livekit/webhook",
  express.text({ type: "*/*" })
);

// Supabase Auth webhook needs raw JSON for signature verification
app.use(
  "/api/v1/auth/webhook",
  express.raw({ type: "application/json" })
);
/* ================= PARSING & COMPRESSION ================= */

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================= LANGUAGE DETECTION ================= */

// Detect user's preferred language from JWT or Accept-Language header
// Attaches req.language for use in route handlers
app.use(detectLanguage);

/* ================= REQUEST LOGGING ================= */

app.use(
  process.env.NODE_ENV === "production"
    ? morgan("combined", { skip: (req) => req.url === "/health" || process.env.NODE_ENV === "test" })
    : morgan("dev", { skip: (req) => req.url === "/health" || process.env.NODE_ENV === "test" })
);

/* ================= ROOT ================= */

app.get("/", (_req, res) => {
  res.json({ service: "myjudicial-api", status: "running" });
});

/* ================= DOCS ================= */

setupSwagger(app);

/* ================= MAINTENANCE MODE ================= */

app.use(maintenanceMode);

/* ================= ROUTES ================= */
app.use("/api/v1", paymentRoutes);
app.use("/api/v1/livekit", livekitRoutes);
app.use("/api/v1", apiLimiter, perUserLimiter, apiV1);

// Serve local storage files in development matching frontend's /storage route assumption
app.use("/api/v1/storage", express.static(path.join(process.cwd(), "storage", process.env.OCI_BUCKET_NAME || "local-dev-bucket")));

/* ================= HEALTH ================= */

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date(),
      service: "myjudicial-api",
      environment: process.env.NODE_ENV,
      database: "connected",
    });
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

/* ================= ERROR HANDLING ================= */

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
