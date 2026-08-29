// Exports the OpenAPI spec straight from the backend's zod-to-openapi
// registry — the same code path that serves /api-docs.json at runtime —
// into the repo-root snapshot consumed by the frontend's Orval generator.
//
//   npm run export:openapi
//   out: ../openapi/api-docs.json
//
// The committed snapshot lets CI verify "docs never fall behind
// implementation" (backend checks run export + git diff --exit-code) and
// lets Orval regenerate deterministically without a running server.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOpenApiSpec } from "../src/infrastructure/swagger/swagger.js";

const spec = buildOpenApiSpec();

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "..", "..", "openapi", "api-docs.json");

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(spec, null, 2) + "\n");

const pathCount = Object.keys(spec.paths ?? {}).length;
console.log(`export-openapi: wrote ${target} (${Object.keys(spec.components?.schemas ?? {}).length} schemas, ${pathCount} paths)`);