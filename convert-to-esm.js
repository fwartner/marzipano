#!/usr/bin/env node

/**
 * Automated CommonJS to ES6 Module Converter for Marzipano
 *
 * This script converts all CommonJS modules to ES6 modules by:
 * 1. Removing 'use strict' declarations
 * 2. Converting require() to import statements
 * 3. Converting module.exports to export default
 * 4. Adding .js extensions to relative imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

// Statistics
let filesProcessed = 0;
let filesModified = 0;
let errors = [];

function convertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove 'use strict' declarations
    content = content.replace(/['"]use strict['"];\s*\n/g, '');

    // Track imports for organizing
    const imports = [];
    const exports = [];

    // Extract and convert require() statements
    // Pattern 1: var X = require('...')
    content = content.replace(
      /^(var|const|let)\s+(\w+)\s*=\s*require\((['"])([^'"]+)\3\);?$/gm,
      (match, varType, varName, quote, modulePath) => {
        const importPath = modulePath.startsWith('.')
          ? modulePath.endsWith('.js')
            ? modulePath
            : `${modulePath}.js`
          : modulePath;
        imports.push(`import ${varName} from '${importPath}';`);
        return ''; // Remove the original line
      }
    );

    // Pattern 2: module.exports = ClassName (default export)
    content = content.replace(
      /^module\.exports\s*=\s*(\w+);?$/gm,
      (match, className) => {
        exports.push(`export default ${className};`);
        return '';
      }
    );

    // Pattern 3: module.exports = { ... } (object export)
    // This is complex, we'll handle it manually for specific cases
    if (/module\.exports\s*=\s*{/.test(content)) {
      console.log(`⚠️  Complex module.exports found in ${filePath} - may need manual review`);
    }

    // Pattern 4: module.exports.X = Y (named export)
    content = content.replace(
      /^module\.exports\.(\w+)\s*=\s*(.+);?$/gm,
      (match, exportName, exportValue) => {
        exports.push(`export const ${exportName} = ${exportValue};`);
        return '';
      }
    );

    // Reorganize file: copyright header, then imports, then code, then exports
    const lines = content.split('\n');
    const copyrightEnd = lines.findIndex((line) => line.includes('*/'));

    if (copyrightEnd !== -1) {
      const copyrightHeader = lines.slice(0, copyrightEnd + 1).join('\n');
      let remainingContent = lines.slice(copyrightEnd + 1).join('\n');

      // Clean up excessive blank lines
      remainingContent = remainingContent.replace(/\n{3,}/g, '\n\n');

      // Reconstruct file
      content =
        copyrightHeader +
        '\n\n' +
        imports.join('\n') +
        (imports.length > 0 ? '\n\n' : '') +
        remainingContent +
        '\n' +
        exports.join('\n');
    } else {
      // No copyright header
      content =
        imports.join('\n') +
        (imports.length > 0 ? '\n\n' : '') +
        content +
        '\n' +
        exports.join('\n');
    }

    // Clean up
    content = content.trim() + '\n';

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      filesModified++;
      console.log(`✓ Converted: ${path.relative(srcDir, filePath)}`);
    }

    filesProcessed++;
  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js') && file !== 'convert-to-esm.js') {
      convertFile(filePath);
    }
  }
}

console.log('🔄 Starting CommonJS to ES6 Module conversion...\n');
processDirectory(srcDir);

console.log(`\n📊 Conversion Summary:`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n❌ Errors encountered:');
  errors.forEach(({ file, error }) => {
    console.log(`   ${file}: ${error}`);
  });
}

console.log('\n✅ Conversion complete! Please review changes and test thoroughly.');
console.log('⚠️  Some files may require manual adjustment, especially:');
console.log('   - Complex module.exports patterns');
console.log('   - Dynamic requires');
console.log('   - Circular dependencies');
