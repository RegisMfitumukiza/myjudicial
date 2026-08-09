import { z } from 'zod';
import pkg from '@asteasolutions/zod-to-openapi';
const { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } = pkg;

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const uuidField = z.string().uuid().describe("UUID");

// Test with query params that have .default().optional()
registry.registerPath({
  method: "get",
  path: "/test",
  summary: "Test query params",
  request: {
    query: z.object({
      page: z.number().int().positive().default(1).optional(),
      limit: z.number().int().positive().default(10).optional(),
      status: z.enum(["A","B"]).optional(),
    }),
  },
  responses: { 200: { description: "OK" } },
});

// Test with regex-based string
registry.registerPath({
  method: "get",
  path: "/test2",
  summary: "Test regex",
  request: {
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  },
  responses: { 200: { description: "OK" } },
});

// Test with available slots query that uses .openapi()
registry.registerPath({
  method: "get",
  path: "/test3",
  summary: "Test query with openapi",
  request: {
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date"),
    }).openapi("TestQuery"),
  },
  responses: { 200: { description: "OK" } },
});

// Test with params + query
registry.registerPath({
  method: "get",
  path: "/test4/{id}",
  summary: "Test params + query",
  request: {
    params: z.object({ id: uuidField }).openapi("TestParams"),
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  },
  responses: { 200: { description: "OK" } },
});

// Try to replicate the analytics.docs.ts pattern which has z.preprocess
// Actually let me first check what z.preprocess returns
import { z as z2 } from 'zod';

// Check z.preprocess schema structure
const pp = z2.preprocess((val) => Number(val), z2.number());
console.log('z.preprocess schema:');
console.log('  type:', pp.constructor.name);
console.log('  _zod:', typeof pp._zod);
if (pp._zod) console.log('  _zod keys:', Object.keys(pp._zod));
console.log('  has _zod.parent?', pp._zod && 'parent' in pp._zod);

const gen = new OpenApiGeneratorV3(registry.definitions);
try {
  const spec = gen.generateDocument({
    openapi: "3.0.0",
    info: { title: "Test", version: "1.0.0" },
  });
  console.log("\nSUCCESS!");
} catch(e) {
  console.log("\nERROR:", e.message);
  console.log(e.stack?.split('\n').slice(0, 15).join('\n'));
}
