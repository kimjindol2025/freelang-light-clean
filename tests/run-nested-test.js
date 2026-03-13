const fs = require('fs');
const { Lexer } = require('./dist/src/script-runner/lexer');
const { Parser } = require('./dist/src/script-runner/parser');
const { Compiler } = require('./dist/src/script-runner/compiler');
const { VM } = require('./dist/src/script-runner/vm');

const code = fs.readFileSync('./test-nested-catch.fl', 'utf8');

try {
  const lexer = new Lexer(code);
  const { tokens, errors: lexErrors } = lexer.tokenize();
  if (lexErrors.length > 0) throw new Error('Lexer errors');

  const parser = new Parser(tokens);
  const { program, errors } = parser.parse();
  if (errors.length > 0) throw new Error('Parser errors');

  const compiler = new Compiler();
  const chunk = compiler.compile(program);

  const vm = new VM();
  const { output, error } = vm.run(chunk);

  if (error) {
    console.error('Runtime error:', error);
    process.exit(1);
  }

  output.forEach(line => console.log(line));

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
