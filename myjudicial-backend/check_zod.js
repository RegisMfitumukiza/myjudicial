const { z } = require('zod');
const types = [
  ['z.string()', z.string()],
  ['z.number()', z.number()],
  ['z.object({})', z.object({})],
  ['z.enum(["a","b"])', z.enum(['a','b'])],
  ['z.array(z.string())', z.array(z.string())],
  ['z.string().optional()', z.string().optional()],
  ['z.string().nullable()', z.string().nullable()],
  ['z.string().default("x")', z.string().default('x')],
  ['z.string().refine(()=>true)', z.string().refine(()=>true)],
];
for (const [name, schema] of types) {
  const hasParent = schema._zod && 'parent' in schema._zod;
  console.log(name, '->_zod.parent exists:', hasParent, '| _zod keys:', Object.keys(schema._zod || {}).join(', '));
}
const o = z.object({ name: z.string() });
console.log('\nz.object({name}) _zod keys:', Object.keys(o._zod));
const e = o.extend({ age: z.number() });
console.log('extended _zod keys:', Object.keys(e._zod));
console.log('extended has parent?', 'parent' in e._zod);
console.log('extended _zod.parent:', e._zod.parent);
