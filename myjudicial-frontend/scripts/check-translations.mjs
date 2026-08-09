import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const msgs = resolve(__dirname, '..', 'messages');

function load(name) {
  return JSON.parse(readFileSync(resolve(msgs, name), 'utf8'));
}

const en = load('en.json');
const fr = load('fr.json');
const rw = load('rw.json');

function flatten(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flatten(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const enKeys = flatten(en);
const frKeys = new Set(flatten(fr));
const rwKeys = new Set(flatten(rw));
const enSet = new Set(enKeys);

const missingFr = enKeys.filter(k => !frKeys.has(k));
const missingRw = enKeys.filter(k => !rwKeys.has(k));
const extraFr = flatten(fr).filter(k => !enSet.has(k));
const extraRw = flatten(rw).filter(k => !enSet.has(k));

console.log('=== TRANSLATION KEY COMPARISON ===\n');
console.log(`English keys: ${enKeys.length}`);
console.log(`French keys:  ${flatten(fr).length}`);
console.log(`Kinyarwanda keys: ${flatten(rw).length}`);
console.log();

console.log(`--- Keys in en.json MISSING from fr.json (${missingFr.length}) ---`);
if (missingFr.length === 0) console.log('  (none)');
else missingFr.forEach(k => console.log(`  ${k}`));

console.log();

console.log(`--- Keys in en.json MISSING from rw.json (${missingRw.length}) ---`);
if (missingRw.length === 0) console.log('  (none)');
else missingRw.forEach(k => console.log(`  ${k}`));

console.log();

console.log(`--- Keys in fr.json NOT in en.json (extra/orphaned) (${extraFr.length}) ---`);
if (extraFr.length === 0) console.log('  (none)');
else extraFr.forEach(k => console.log(`  ${k}`));

console.log();

console.log(`--- Keys in rw.json NOT in en.json (extra/orphaned) (${extraRw.length}) ---`);
if (extraRw.length === 0) console.log('  (none)');
else extraRw.forEach(k => console.log(`  ${k}`));

console.log();
console.log('=== common.languages check ===');

function getVal(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

const langCheck = ['en', 'fr', 'rw'];
for (const lang of langCheck) {
  const val = getVal(en.common?.languages, lang);
  const exists = val !== undefined;
  const isString = typeof val === 'string';
  console.log(`  en.common.languages.${lang}: ${exists ? `"${val}"` : 'MISSING'} ${exists && isString ? 'OK' : exists ? `UNEXPECTED TYPE: ${typeof val}` : 'MISSING'}`);
}
