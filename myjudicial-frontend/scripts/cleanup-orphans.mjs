import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

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

// Extra keys to remove (not used by any frontend code)
const EXTRA_KEYS_TO_REMOVE = [
  'public.bookings.contactSupport',
  'triage',
  'signup.otp',
  'signup.intake',
];

function removeKeys(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') return false;
    current = current[parts[i]];
  }
  const lastKey = parts[parts.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  return false;
}

function countKeys(obj) {
  let count = 0;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      count += countKeys(v);
    } else {
      count++;
    }
  }
  return count;
}

for (const lang of ['fr', 'rw']) {
  const langFile = path.join(MESSAGES_DIR, `${lang}.json`);
  const langData = loadJson(langFile);
  const before = countKeys(langData);

  for (const keyPath of EXTRA_KEYS_TO_REMOVE) {
    if (removeKeys(langData, keyPath)) {
      console.log(`  Removed ${keyPath} from ${lang}.json`);
    }
  }

  const after = countKeys(langData);
  fs.writeFileSync(langFile, JSON.stringify(langData, null, 2) + '\n');
  console.log(`${lang}.json: ${before} -> ${after} keys (removed ${before - after})`);
}
