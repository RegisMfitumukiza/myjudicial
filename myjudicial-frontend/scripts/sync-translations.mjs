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

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      target[key] = source[key];
    } else if (
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) &&
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
    ) {
      deepMerge(target[key], source[key]);
    }
    // If key exists in target, keep target's value (don't overwrite)
  }
  return target;
}

const en = loadJson(path.join(MESSAGES_DIR, 'en.json'));

for (const lang of ['fr', 'rw']) {
  const langFile = path.join(MESSAGES_DIR, `${lang}.json`);
  const langData = loadJson(langFile);
  
  // Count before
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
  
  const before = countKeys(langData);
  
  // Deep merge: add missing keys from en.json
  deepMerge(langData, en);
  
  const after = countKeys(langData);
  
  // Also add extra keys from lang that aren't in en (preserve them)
  // They're already in langData, so nothing to do
  
  // Write back
  fs.writeFileSync(langFile, JSON.stringify(langData, null, 2) + '\n');
  
  console.log(`${lang}.json: ${before} -> ${after} keys (added ${after - before})`);
}

// Verify JSON validity
for (const lang of ['en', 'fr', 'rw']) {
  try {
    JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${lang}.json`), 'utf-8'));
    console.log(`${lang}.json: valid JSON`);
  } catch (e) {
    console.error(`${lang}.json: INVALID JSON - ${e.message}`);
  }
}
