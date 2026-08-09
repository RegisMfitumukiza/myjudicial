import { z } from "zod";
import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Export the extended z so all docs files use the same instance
export { z };

// Register the bearerAuth security scheme once here — all doc files reference it
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description:
    "Supabase-issued JWT. Obtain a token via POST /auth/otp/verify or the magic link callback.",
});
