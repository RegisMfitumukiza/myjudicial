const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('getErrorMessage') && !content.includes('import { getErrorMessage }')) {
    const relativeDepth = filePath.split(path.sep).length - srcDir.split(path.sep).length - 1;
    let importPath = '../'.repeat(relativeDepth) + 'shared/utils/i18n-messages.js';
    if (relativeDepth === 0) importPath = './shared/utils/i18n-messages.js';
    
    const importStatement = `import { getErrorMessage } from "${importPath}";\n`;
    const lines = content.split('\n');
    let lastImportIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    lines.splice(lastImportIndex + 1, 0, importStatement);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('Added import to ' + filePath);
  }
}

walkDir(path.join(srcDir, 'modules', 'auth'), processFile);
walkDir(path.join(srcDir, 'modules', 'bookings'), processFile);
walkDir(path.join(srcDir, 'modules', 'experts'), processFile);
