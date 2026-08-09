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
  if (content.includes('import { getErrorMessage }')) {
    let lines = content.split('\n');
    let importLine = '';
    
    // Find and remove all occurrences of the import
    lines = lines.filter(line => {
      if (line.includes('import { getErrorMessage }')) {
        importLine = line;
        return false;
      }
      return true;
    });
    
    // Add it to the top
    if (importLine) {
      lines.unshift(importLine);
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log('Fixed import in ' + filePath);
    }
  }
}

walkDir(path.join(srcDir, 'modules', 'auth'), processFile);
walkDir(path.join(srcDir, 'modules', 'bookings'), processFile);
walkDir(path.join(srcDir, 'modules', 'experts'), processFile);
