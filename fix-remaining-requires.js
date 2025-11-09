#!/usr/bin/env node
import fs from 'fs';
import { glob } from 'glob';

const files = glob.sync('src/**/*.js');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Convert: var X = require('module').X;
  content = content.replace(
    /^var (\w+) = require\((["'])([^"']+)\2\)\.(\w+);$/gm,
    'import { $4 as $1 } from $3;'
  );

  // Convert: var X = require('module').Y; (different names)
  content = content.replace(
    /^var (\w+) = require\((["'])([^"']+)\2\)\.(\w+);$/gm,
    (match, varName, quote, modulePath, propName) => {
      const importPath = modulePath.startsWith('.') 
        ? (modulePath.endsWith('.js') ? modulePath : `${modulePath}.js`)
        : modulePath;
      return varName === propName
        ? `import { ${propName} } from '${importPath}';`
        : `import { ${propName} as ${varName} } from '${importPath}';`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('✅ Fixed remaining require statements');
