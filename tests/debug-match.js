const { Lexer, TokenType } = require('./dist/src/script-runner/lexer');
const { Parser } = require('./dist/src/script-runner/parser');

const code = `let x = 5;
match x {
  5 => println("five"),
  _ => println("other"),
}`;

const lexer = new Lexer(code);
const { tokens, errors } = lexer.tokenize();

// Print tokens
tokens.forEach((tok, i) => {
  console.log(`${i}: ${tok.type} = "${tok.lexeme}"`);
});

if (errors.length > 0) {
  console.log('\nLexer errors:', errors);
}

console.log('\n--- Parsing ---');
const parser = new Parser(tokens);
try {
  const ast = parser.parse();
  console.log('AST:', JSON.stringify(ast, null, 2));
} catch (e) {
  console.error('Parse error:', e.message);
}
