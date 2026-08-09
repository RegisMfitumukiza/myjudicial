import { z } from 'zod';
import pkg from '@asteasolutions/zod-to-openapi';
const { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } = pkg;

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Option 1: Using route-level parameters array
registry.registerPath({
  method: "get",
  path: "/whatsapp/webhook",
  summary: "Webhook verification (using parameters array)",
  parameters: [
    { name: "hub.mode", in: "query", schema: { type: "string" }, required: true, description: "Verification mode" },
    { name: "hub.challenge", in: "query", schema: { type: "string" }, required: true, description: "Challenge token" },
    { name: "hub.verify_token", in: "query", schema: { type: "string" }, required: true, description: "Verify token" },
  ],
  responses: {
    200: { description: "Verification successful" },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
try {
  const spec = generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Test", version: "1.0.0" },
  });
  console.log("SUCCESS!");
} catch(e) {
  console.log("ERROR:", e.message);
  console.log(e.stack?.split('\n').slice(0, 15).join('\n'));
}
