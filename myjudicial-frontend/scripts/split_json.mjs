import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const langs = ['en', 'fr', 'rw'];

function splitMessages() {
  for (const lang of langs) {
    const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf-8');
    let parsed = null;
    
    // Repair logic
    while (content.trim().endsWith('}')) {
      try {
        parsed = JSON5.parse(content);
        break;
      } catch (e) {
        const lastBrace = content.lastIndexOf('}');
        if (lastBrace === -1) break;
        content = content.substring(0, lastBrace);
      }
    }

    if (!parsed) {
      console.error(`Failed to parse ${lang}.json`);
      continue;
    }

    // Create dir for lang
    const langDir = path.join(MESSAGES_DIR, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    // Write each top-level key as a file
    for (const [key, value] of Object.entries(parsed)) {
      const outPath = path.join(langDir, `${key}.json`);
      fs.writeFileSync(outPath, JSON.stringify(value, null, 2));
    }
    
    // Rename old file so we don't load it anymore
    fs.renameSync(filePath, path.join(MESSAGES_DIR, `${lang}.json.bak`));
    console.log(`Split ${lang}.json into ${langDir}`);
  }
}

splitMessages();
