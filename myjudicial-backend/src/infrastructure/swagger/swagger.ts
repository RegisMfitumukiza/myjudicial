import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "../../docs/registry.js";

// Import all doc modules — each registers its routes and schemas into the registry
import "../../docs/auth.docs.js";
import "../../docs/experts.docs.js";
import "../../docs/admin-verification.docs.js";
import "../../docs/search-map.docs.js";
import "../../docs/file-storage.docs.js";
import "../../docs/booking.docs.js";
import "../../docs/admin-booking.docs.js";
import "../../docs/payments.docs.js";
import "../../docs/review.docs.js";
import "../../docs/analytics.docs.js";
import "../../docs/chat.docs.js";
import "../../docs/notifications.docs.js";

export function setupSwagger(app: Express): void {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const spec = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "MyJudicial API",
      version: "1.0.0",
      description:
        "Legal marketplace API connecting clients with verified legal experts. " +
        "Supports geo-based expert discovery, instant booking, secure video consultations, " +
        "Azam Pay Mobile Money escrow payments, and AI-powered triage.",
      contact: {
        name: "MyJudicial Engineering",
        email: "tech@myjudicial.com",
      },
    },
    servers: [
      {
        url: `${process.env.RENDER_EXTERNAL_URL ?? process.env.BASE_URL ?? "http://localhost:4000"}/api/v1`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production"
            : "Development",
      },
            {
        url: "https://myjudicial-backend.onrender.com/api-docs/api/v1",
        description: "Production server",
      }
    ],
  });
  app.get("/api-docs", (req, res, next) => {
    const urlWithoutQuery = req.originalUrl.split("?")[0];
    if (urlWithoutQuery === "/api-docs") {
      const query = req.originalUrl.slice(urlWithoutQuery.length);
      return res.redirect(301, "/api-docs/" + query);
    }
    next();
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "MyJudicial API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
    })
  );

  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json(spec);
  });

  const base = process.env.RENDER_EXTERNAL_URL ?? process.env.BASE_URL ?? "http://localhost:4000";
  console.log(`Swagger docs: ${base}/api-docs`);
}

