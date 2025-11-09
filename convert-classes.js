#!/usr/bin/env node

/**
 * Script to help convert remaining prototypal inheritance patterns to ES6 classes.
 * This is a helper script - manual review and conversion is still needed for complex cases.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files already converted (don't process these)
const convertedFiles = new Set([
  'src/Layer.js',
  'src/Hotspot.js',
  'src/sources/ImageUrl.js',
  'src/stages/Stage.js',
  'src/Scene.js',
  'src/Viewer.js',
  'src/TextureStore.js',
]);

function findClassFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findClassFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const relPath = path.relative(__dirname, fullPath);
      if (!convertedFiles.has(relPath)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

const srcDir = path.join(__dirname, 'src');
const files = findClassFiles(srcDir);

console.log(`Found ${files.length} files that may need class conversion:`);
files.forEach(f => console.log(`  - ${path.relative(__dirname, f)}`));

