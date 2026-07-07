const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../packages/shared-engine/src');
const dest = path.join(__dirname, '../apps/extension/services');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

fs.readdirSync(src).forEach(file => {
  if (file.endsWith('.ts') && file !== 'index.ts') {
    const jsName = file.replace('.ts', '.js');
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, jsName);
    
    // Simplistic strip of TypeScript types to maintain ES6 modules in extension sandbox
    let content = fs.readFileSync(srcFile, 'utf-8');
    
    // Remove type annotations
    content = content
      .replace(/:\s*(?:string|boolean|number|Record<[^>]+>|AutoDetectResult|MergeField\[\]|ValidationResult|ResolvedEmail\[\]|PreviewOneResult|PreviewResult|any|string\[\]|ValidationMessage\[\])/g, '')
      .replace(/as\s+\w+/g, '')
      .replace(/implements\s+\w+/g, '')
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
      .replace(/export\s+interface\s+\w+\s*\{[^}]*\}/g, '');
      
    fs.writeFileSync(destFile, content, 'utf-8');
  }
});
console.log('✓ Successfully synchronized shared-engine modules to extension/services!');
