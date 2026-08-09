import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SRC_DIR = path.join(process.cwd(), 'src');

function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

// 1. Audit languages
const langs = ['en', 'fr', 'rw'];
const dicts = {};

for (const lang of langs) {
  const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Basic repair if json5 fails: strip extra trailing }
    while (content.trim().endsWith('}')) {
      try {
        dicts[lang] = flattenObject(JSON5.parse(content));
        break;
      } catch (e) {
        content = content.substring(0, content.lastIndexOf('}'));
      }
    }
  }
}

const enKeys = Object.keys(dicts['en'] || {});
const frKeys = Object.keys(dicts['fr'] || {});
const rwKeys = Object.keys(dicts['rw'] || {});

const missingFr = enKeys.filter(k => !frKeys.includes(k));
const missingRw = enKeys.filter(k => !rwKeys.includes(k));
const extraFr = frKeys.filter(k => !enKeys.includes(k));
const extraRw = rwKeys.filter(k => !enKeys.includes(k));

console.log("=== TRANSLATION FILE CONSISTENCY ===");
console.log(`Missing in fr.json (${missingFr.length}):`, missingFr.slice(0, 5), missingFr.length > 5 ? '...' : '');
console.log(`Missing in rw.json (${missingRw.length}):`, missingRw.slice(0, 5), missingRw.length > 5 ? '...' : '');
console.log(`Extra in fr.json (not in en) (${extraFr.length}):`, extraFr.slice(0, 5));
console.log(`Extra in rw.json (not in en) (${extraRw.length}):`, extraRw.slice(0, 5));

// 2. Audit Components
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const noTranslations = [];
const maybeHardcoded = [];

walkDir(SRC_DIR, (filePath) => {
  if (filePath.endsWith('.tsx')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('useTranslations') && !content.includes('getTranslations') && !content.includes('NextIntlClientProvider')) {
      noTranslations.push(filePath.replace(process.cwd(), ''));
      
      // Rough heuristic for JSX text
      const jsxTextMatch = content.match(/>([^<{}]+)</g);
      if (jsxTextMatch) {
          const hasText = jsxTextMatch.some(m => /[a-zA-Z]/.test(m) && !m.includes('import') && !m.includes('export'));
          if (hasText) {
              maybeHardcoded.push(filePath.replace(process.cwd(), ''));
          }
      }
    }
  }
});

console.log("\n=== COMPONENT AUDIT ===");
console.log(`Total .tsx files without useTranslations: ${noTranslations.length}`);
console.log(`Files with potential hardcoded JSX text (${maybeHardcoded.length}):`);
maybeHardcoded.forEach(f => console.log(f));
