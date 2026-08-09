import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

function loadJson(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Remove trailing commas and repair truncated JSON
  while (content.trim().endsWith('}')) {
    try {
      return JSON.parse(content);
    } catch {
      const lastBrace = content.lastIndexOf('}');
      if (lastBrace === -1) break;
      content = content.substring(0, lastBrace);
    }
  }
  console.error(`Failed to parse ${filePath}`);
  process.exit(1);
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const en = loadJson(path.join(MESSAGES_DIR, 'en.json'));
const fr = loadJson(path.join(MESSAGES_DIR, 'fr.json'));
const rw = loadJson(path.join(MESSAGES_DIR, 'rw.json'));

const enKeys = new Set(flattenKeys(en));
const frKeys = new Set(flattenKeys(fr));
const rwKeys = new Set(flattenKeys(rw));

console.log(`\n=== KEY COUNTS ===`);
console.log(`en.json: ${enKeys.size} keys`);
console.log(`fr.json: ${frKeys.size} keys`);
console.log(`rw.json: ${rwKeys.size} keys`);

// Top-level namespaces
const enTop = Object.keys(en);
const frTop = Object.keys(fr);
const rwTop = Object.keys(rw);

console.log(`\n=== TOP-LEVEL NAMESPACES ===`);
console.log(`en: ${enTop.join(', ')}`);
console.log(`fr: ${frTop.join(', ')}`);
console.log(`rw: ${rwTop.join(', ')}`);

// Missing from fr
const missingFromFr = [...enKeys].filter(k => !frKeys.has(k));
const missingFromRw = [...enKeys].filter(k => !rwKeys.has(k));
const extraInFr = [...frKeys].filter(k => !enKeys.has(k));
const extraInRw = [...rwKeys].filter(k => !enKeys.has(k));

// Group by top-level namespace
function groupByNamespace(keys) {
  const groups = {};
  for (const k of keys) {
    const ns = k.split('.')[0];
    if (!groups[ns]) groups[ns] = [];
    groups[ns].push(k);
  }
  return groups;
}

console.log(`\n=== MISSING FROM FR (by namespace) ===`);
const missFr = groupByNamespace(missingFromFr);
for (const [ns, keys] of Object.entries(missFr).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n  ${ns} (${keys.length} keys):`);
  // Show first 20, then summary
  for (const k of keys.slice(0, 20)) {
    console.log(`    - ${k}`);
  }
  if (keys.length > 20) {
    console.log(`    ... and ${keys.length - 20} more`);
  }
}

console.log(`\n=== MISSING FROM RW (by namespace) ===`);
const missRw = groupByNamespace(missingFromRw);
for (const [ns, keys] of Object.entries(missRw).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n  ${ns} (${keys.length} keys):`);
  for (const k of keys.slice(0, 20)) {
    console.log(`    - ${k}`);
  }
  if (keys.length > 20) {
    console.log(`    ... and ${keys.length - 20} more`);
  }
}

console.log(`\n=== EXTRA IN FR (not in en) ===`);
const extraFr = groupByNamespace(extraInFr);
for (const [ns, keys] of Object.entries(extraFr)) {
  console.log(`  ${ns}: ${keys.join(', ')}`);
}

console.log(`\n=== EXTRA IN RW (not in en) ===`);
const extraRw = groupByNamespace(extraInRw);
for (const [ns, keys] of Object.entries(extraRw)) {
  console.log(`  ${ns}: ${keys.join(', ')}`);
}

console.log(`\n=== SUMMARY ===`);
console.log(`Missing from fr: ${missingFromFr.length} keys`);
console.log(`Missing from rw: ${missingFromRw.length} keys`);
console.log(`Extra in fr: ${extraInFr.length} keys`);
console.log(`Extra in rw: ${extraInRw.length} keys`);
