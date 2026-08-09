import { registry } from './src/docs/registry.js';

// Import all doc modules
await import('./src/docs/auth.docs.js');
await import('./src/docs/experts.docs.js');
await import('./src/docs/admin-verification.docs.js');
await import('./src/docs/search-map.docs.js');
await import('./src/docs/file-storage.docs.js');
await import('./src/docs/booking.docs.js');
await import('./src/docs/payments.docs.js');
await import('./src/docs/review.docs.js');
await import('./src/docs/whatsapp.docs.js');
await import('./src/docs/analytics.docs.js');

import pkg from '@asteasolutions/zod-to-openapi';
const { OpenApiGeneratorV3 } = pkg;

const generator = new OpenApiGeneratorV3(registry.definitions);
try {
  const spec = generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "MyJudicial API", version: "1.0.0" },
    servers: [{ url: "http://localhost:3000/api/v1" }],
  });
  console.log("SUCCESS! Paths:", Object.keys(spec.paths).length);
} catch(e) {
  console.log("ERROR:", e.message);
  console.log(e.stack?.split('\n').slice(0, 20).join('\n'));
}
