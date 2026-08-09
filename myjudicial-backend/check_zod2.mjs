import { z } from 'zod';

const s = z.string();
console.log('_def exists on schema?', '_def' in s);
console.log('_def:', s._def);
console.log('def:', s.def);
console.log('_zod.def:', s._zod.def);
console.log('_zod.def === def:', s._zod.def === s.def);
console.log('_def === def:', s._def === s.def);

// Check object
const o = z.object({ name: z.string() });
console.log('\nObject:');
console.log('_def exists on schema?', '_def' in o);
console.log('_def:', o._def);
console.log('def:', o.def);

// Check what happens when we do "new this.constructor(this._def)"
const ZodString = z.string().constructor;
try {
  const r = new ZodString(z.string()._def);
  console.log('\nnew ZodString(z.string()._def) worked:', r);
  console.log('result has _zod?', '_zod' in r);
  console.log('result._zod:', typeof r._zod);
} catch(e) {
  console.log('\nnew ZodString(z.string()._def) failed:', e.message);
}

// Try with .openapi() 
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

try {
  const p = z.object({ id: z.string().uuid() }).openapi("TestParams");
  console.log('\n.openapi() result:');
  console.log('has _def?', '_def' in p);
  console.log('has _zod?', '_zod' in p);
  console.log('_zod:', typeof p._zod);
  if (p._zod) console.log('_zod keys:', Object.keys(p._zod));
  
  // Check if registry works
  const { registry, zodToOpenAPIRegistry } = require('@asteasolutions/zod-to-openapi');
  const metadata = zodToOpenAPIRegistry.get(p);
  console.log('registry.get result:', metadata);
} catch(e) {
  console.log('\nError with .openapi():', e.message);
  console.log(e.stack);
}
