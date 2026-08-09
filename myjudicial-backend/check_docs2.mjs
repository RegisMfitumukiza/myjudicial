import { registry } from './src/docs/registry.js';

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

// Find which definition is problematic
for (let i = 0; i < registry.definitions.length; i++) {
  const def = registry.definitions[i];
  if (def.type === 'route') {
    try {
      const gen = new OpenApiGeneratorV3([def]);
      gen.generateDocument({
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      });
    } catch(e) {
      console.log(`ERROR at definition ${i}: ${def.route?.method} ${def.route?.path}`);
      console.log('  ', e.message);
      if (def.route?.request?.params) {
        console.log('  params type:', def.route.request.params.constructor?.name);
        console.log('  params _zod exists:', '_zod' in def.route.request.params);
        if (def.route.request.params._zod) {
          console.log('  params _zod.parent exists:', 'parent' in def.route.request.params._zod);
        } else {
          console.log('  params._zod is UNDEFINED');
        }
        // Check _zod on keys
        if (def.route.request.params instanceof Object && 'def' in def.route.request.params && def.route.request.params.def.shape) {
          for (const [key, val] of Object.entries(def.route.request.params.def.shape)) {
            console.log(`  key "${key}" _zod exists:`, '_zod' in val, 'type:', val.constructor?.name);
          }
        }
      }
      if (def.route?.request?.query) {
        console.log('  query type:', def.route.request.query.constructor?.name);
        console.log('  query _zod exists:', '_zod' in def.route.request.query);
        if (def.route.request.query._zod) {
          console.log('  query _zod.parent exists:', 'parent' in def.route.request.query._zod);
        }
        if (def.route.request.query instanceof Object && 'def' in def.route.request.query && def.route.request.query.def.shape) {
          for (const [key, val] of Object.entries(def.route.request.query.def.shape)) {
            console.log(`  query key "${key}" _zod exists:`, '_zod' in val, 'type:', val.constructor?.name);
          }
        }
      }
      break;
    }
  }
}
