import { readFileSync, writeFileSync } from 'fs';

const files = [
  'test/suite/sources/ImageUrl.js',
  'test/suite/TextureStore.js',
  'test/suite/assets/Static.js',
  'test/suite/assets/Dynamic.js',
];

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  
  // Replace: it('...', function (done) {
  // With: it('...', function () { return new Promise((resolve) => {
  content = content.replace(
    /(\s+)it\('([^']+)',\s*function\s*\(done\)\s*\{/g,
    '$1it(\'$2\', function () {\n$1  return new Promise((resolve) => {'
  );
  
  // Replace: done(); followed by });
  content = content.replace(
    /(\s+)done\(\);(\s+)\}\);/g,
    '$1resolve();$2});\n$1});'
  );
  
  writeFileSync(file, content, 'utf-8');
  console.log(`Converted: ${file}`);
});
console.log('Done!');
