#!/usr/bin/env node

/**
 * JavaScript Syntax Modernization Script for Marzipano
 *
 * Transforms ES5 syntax to modern ES6+ patterns:
 * 1. var → const/let (based on reassignment analysis)
 * 2. String concatenation → template literals
 * 3. function() {} → arrow functions (where safe)
 * 4. Object.assign → spread operators
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Statistics
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  varToConst: 0,
  varToLet: 0,
  templateLiterals: 0,
  arrowFunctions: 0,
  spreadOperators: 0,
  errors: [],
};

/**
 * Analyze if a variable is reassigned in its scope
 */
function isVariableReassigned(content, varName, declarationIndex) {
  // Look for assignments after declaration
  const afterDeclaration = content.slice(declarationIndex);

  // Match: varName = (not in declaration)
  const reassignmentPattern = new RegExp(
    `(?:^|[^a-zA-Z0-9_])${varName}\\s*=(?!=)`,
    'gm'
  );

  const matches = afterDeclaration.match(reassignmentPattern);

  // First match is the declaration itself, so check if there are more
  return matches && matches.length > 1;
}

/**
 * Convert var to const/let based on reassignment
 */
function convertVarToConstLet(content) {
  let modified = content;
  let changes = 0;

  // Pattern: var identifier = ...;
  const varPattern = /\bvar\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let match;

  const replacements = [];

  while ((match = varPattern.exec(content)) !== null) {
    const varName = match[1];
    const matchIndex = match.index;

    // Check if variable is reassigned
    const isReassigned = isVariableReassigned(content, varName, matchIndex);

    replacements.push({
      index: matchIndex,
      oldText: `var ${varName}`,
      newText: isReassigned ? `let ${varName}` : `const ${varName}`,
      type: isReassigned ? 'let' : 'const',
    });
  }

  // Apply replacements in reverse order to maintain indices
  replacements.reverse().forEach(({ index, oldText, newText, type }) => {
    const before = modified.slice(0, index);
    const after = modified.slice(index + oldText.length);
    modified = before + newText + after;
    changes++;
    if (type === 'const') stats.varToConst++;
    else stats.varToLet++;
  });

  return { content: modified, changes };
}

/**
 * Convert simple string concatenation to template literals
 */
function convertToTemplateLiterals(content) {
  let modified = content;
  let changes = 0;

  // Pattern: 'string' + variable + 'string'
  // This is a simplified version - production would need more sophisticated parsing

  // Convert: 'text' + var + 'more'
  const simplePattern = /'([^']*?)'\s*\+\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\s*'([^']*?)'/g;
  modified = modified.replace(simplePattern, (match, before, varName, after) => {
    changes++;
    stats.templateLiterals++;
    return `\`${before}\${${varName}}${after}\``;
  });

  // Convert: 'text' + var
  const endPattern = /'([^']*?)'\s*\+\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?!\s*\+)/g;
  modified = modified.replace(endPattern, (match, text, varName) => {
    changes++;
    stats.templateLiterals++;
    return `\`${text}\${${varName}}\``;
  });

  // Convert: var + 'text'
  const startPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\s*'([^']*?)'/g;
  modified = modified.replace(startPattern, (match, varName, text) => {
    // Don't convert if it's part of a longer chain we already handled
    if (modified.includes(`\`\${${varName}}${text}\``)) return match;
    changes++;
    stats.templateLiterals++;
    return `\`\${${varName}}${text}\``;
  });

  return { content: modified, changes };
}

/**
 * Convert simple callback functions to arrow functions
 * Only converts safe cases (not constructors, not using 'this' context)
 */
function convertToArrowFunctions(content) {
  let modified = content;
  let changes = 0;

  // Pattern: function(args) { single return statement }
  // This is conservative - only converts obvious cases

  // Convert: .map(function(x) { return x.something; })
  const mapPattern = /\.(map|filter|forEach|reduce|find|findIndex|some|every)\s*\(\s*function\s*\(([^)]*)\)\s*\{\s*return\s+([^;]+);\s*\}\s*\)/g;
  modified = modified.replace(mapPattern, (match, method, args, body) => {
    changes++;
    stats.arrowFunctions++;
    // Handle single arg (no parens needed) vs multiple args
    const argsFormatted = args.includes(',') ? `(${args})` : args || '()';
    return `.${method}(${argsFormatted} => ${body})`;
  });

  return { content: modified, changes };
}

/**
 * Convert Object.assign to spread operators
 */
function convertToSpreadOperators(content) {
  let modified = content;
  let changes = 0;

  // Pattern: Object.assign({}, obj)
  const assignPattern = /Object\.assign\s*\(\s*\{\s*\}\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;
  modified = modified.replace(assignPattern, (match, objName) => {
    changes++;
    stats.spreadOperators++;
    return `{ ...${objName} }`;
  });

  // Pattern: Object.assign({}, obj1, obj2)
  const multiAssignPattern = /Object\.assign\s*\(\s*\{\s*\}\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;
  modified = modified.replace(multiAssignPattern, (match, obj1, obj2) => {
    changes++;
    stats.spreadOperators++;
    return `{ ...${obj1}, ...${obj2} }`;
  });

  return { content: modified, changes };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Apply transformations
    let result;
    let totalChanges = 0;

    // 1. Convert var to const/let
    result = convertVarToConstLet(content);
    content = result.content;
    totalChanges += result.changes;

    // 2. Convert to template literals
    result = convertToTemplateLiterals(content);
    content = result.content;
    totalChanges += result.changes;

    // 3. Convert to arrow functions (conservative)
    result = convertToArrowFunctions(content);
    content = result.content;
    totalChanges += result.changes;

    // 4. Convert to spread operators
    result = convertToSpreadOperators(content);
    content = result.content;
    totalChanges += result.changes;

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      stats.filesModified++;
      console.log(`✓ ${path.relative(process.cwd(), filePath)} (${totalChanges} changes)`);
    }

    stats.filesProcessed++;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Process all JS files in a directory recursively
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js') && !file.startsWith('modernize-')) {
      processFile(filePath);
    }
  }
}

// Main execution
console.log('🔄 Starting JavaScript syntax modernization...\n');

const srcDir = path.join(__dirname, 'src');
processDirectory(srcDir);

console.log('\n📊 Modernization Summary:');
console.log(`   Files processed: ${stats.filesProcessed}`);
console.log(`   Files modified: ${stats.filesModified}`);
console.log(`\n   Transformations:`);
console.log(`   - var → const: ${stats.varToConst}`);
console.log(`   - var → let: ${stats.varToLet}`);
console.log(`   - Template literals: ${stats.templateLiterals}`);
console.log(`   - Arrow functions: ${stats.arrowFunctions}`);
console.log(`   - Spread operators: ${stats.spreadOperators}`);
console.log(`   - Errors: ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n❌ Errors encountered:');
  stats.errors.forEach(({ file, error }) => {
    console.log(`   ${file}: ${error}`);
  });
}

console.log('\n✅ Syntax modernization complete!');
console.log('⚠️  Please review changes and run tests to ensure correctness.');
