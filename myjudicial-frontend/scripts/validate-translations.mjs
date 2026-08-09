import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const LOCALES = ['fr', 'rw'];
const CI_MODE = process.argv.includes('--ci');

function loadJson(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
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
const enKeys = new Set(flattenKeys(en));

let hasErrors = false;

for (const lang of LOCALES) {
  const langData = loadJson(path.join(MESSAGES_DIR, `${lang}.json`));
  const langKeys = new Set(flattenKeys(langData));

  const missingFromLang = [...enKeys].filter(k => !langKeys.has(k));
  const extraInLang = [...langKeys].filter(k => !enKeys.has(k));

  if (missingFromLang.length > 0 || extraInLang.length > 0) {
    hasErrors = true;
    console.error(`\n${lang}.json: ${missingFromLang.length} missing, ${extraInLang.length} extra`);
    if (missingFromLang.length > 0) {
      console.error(`  Missing: ${missingFromLang.slice(0, 10).join(', ')}${missingFromLang.length > 10 ? ` ... +${missingFromLang.length - 10} more` : ''}`);
    }
    if (extraInLang.length > 0) {
      console.error(`  Extra: ${extraInLang.slice(0, 10).join(', ')}${extraInLang.length > 10 ? ` ... +${extraInLang.length - 10} more` : ''}`);
    }
  } else {
    console.log(`${lang}.json: OK (${langKeys.size} keys, matches en.json)`);
  }
}

if (hasErrors) {
  console.error('\nTranslation validation FAILED. Run `node scripts/sync-translations.mjs` to fix.');
  process.exit(1);
} else {
  console.log('\nAll locale files match en.json structure.');
}
