import pkg from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
const { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } = pkg;

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Simulate what the docs do
const uuidField = z.string().uuid().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

registry.registerPath({
  method: "get",
  path: "/experts/{id}/profile",
  summary: "Test",
  request: {
    params: z.object({ id: uuidField }).openapi("TestParams"),
  },
  responses: {
    200: { description: "OK" },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
try {
  const spec = generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Test", version: "1.0.0" },
  });
  console.log("SUCCESS");
  console.log(JSON.stringify(spec.paths, null, 2));
} catch(e) {
  console.log("ERROR:", e.message);
  console.log(e.stack?.split('\n').slice(0, 20).join('\n'));
}
