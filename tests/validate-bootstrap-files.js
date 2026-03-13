const fs = require('fs');
const path = require('path');
const { Lexer } = require('./dist/src/script-runner/lexer');
const { Parser } = require('./dist/src/script-runner/parser');
const { Compiler } = require('./dist/src/script-runner/compiler');
const { VM } = require('./dist/src/script-runner/vm');

const testDir = './self-hosting';
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.fl'));

console.log('═══════════════════════════════════════════');
console.log('  Bootstrap Files Validation');
console.log('═══════════════════════════════════════════\n');

const results = { pass: [], fail: [], skip: [] };

files.forEach(file => {
  const filePath = path.join(testDir, file);
  
  // Skip report files and large files
  if (file.includes('IMPLEMENTATION') || file.includes('demo') || file.includes('integration') || file.includes('pipeline') || file.includes('complete')) {
    results.skip.push(file);
    return;
  }

  const code = fs.readFileSync(filePath, 'utf8');
  
  try {
    const lexer = new Lexer(code);
    const { tokens, errors: lexErrors } = lexer.tokenize();
    if (lexErrors.length > 0) throw new Error(`Lex: ${lexErrors.length} errors`);

    const parser = new Parser(tokens);
    const { program, errors } = parser.parse();
    if (errors.length > 0) throw new Error(`Parse: ${errors.length} errors`);

    const compiler = new Compiler();
    const chunk = compiler.compile(program);

    const vm = new VM();
    const { output, error } = vm.run(chunk);

    if (error) throw new Error(`Runtime: ${error}`);

    results.pass.push(file);
  } catch (error) {
    results.fail.push({ file, error: error.message });
  }
});

console.log(`✅ PASS: ${results.pass.length}`);
results.pass.forEach(f => console.log(`  ✓ ${f}`));

if (results.fail.length > 0) {
  console.log(`\n❌ FAIL: ${results.fail.length}`);
  results.fail.forEach(f => console.log(`  ✗ ${f.file}`));
  console.log('\nFailure details:');
  results.fail.slice(0, 5).forEach(f => {
    console.log(`  ${f.file}: ${f.error.split('\n')[0]}`);
  });
}

if (results.skip.length > 0) {
  console.log(`\n⊘ SKIP: ${results.skip.length}`);
  results.skip.forEach(f => console.log(`  - ${f}`));
}

console.log(`\n${'═'.repeat(43)}`);
console.log(`총: ${results.pass.length}/${files.length - results.skip.length} 통과`);
