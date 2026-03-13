const fs = require('fs');
const path = require('path');
const { Lexer } = require('./dist/src/script-runner/lexer');
const { Parser } = require('./dist/src/script-runner/parser');

const failFiles = [
  'lexer.fl', 'emitter.fl', 'parser-json.fl', 
  'simple-tokenizer.fl', 'test_struct_field_access.fl'
];

console.log('Failure Analysis:\n');

failFiles.forEach(file => {
  const code = fs.readFileSync(`./self-hosting/${file}`, 'utf8');
  
  const lexer = new Lexer(code);
  const { tokens } = lexer.tokenize();

  const parser = new Parser(tokens);
  const { errors } = parser.parse();

  if (errors.length > 0) {
    console.log(`\n📄 ${file}:`);
    console.log(`   Errors: ${errors.length}`);
    
    // 에러 패턴 분석
    const errorPatterns = errors.map(e => {
      const msg = e.message;
      if (msg.includes("expected ':' after field name") && msg.includes("EQ")) {
        return 'STRUCT_CONSTRUCTOR';
      } else if (msg.includes('for')) {
        return 'FOR_LOOP';
      } else if (msg.includes('token:')) {
        return 'SYNTAX_ERROR';
      } else {
        return 'OTHER';
      }
    });

    const counts = {};
    errorPatterns.forEach(p => counts[p] = (counts[p] || 0) + 1);
    
    Object.entries(counts).forEach(([pattern, count]) => {
      console.log(`   - ${pattern}: ${count}`);
    });
    
    // 첫 번째 에러 상세 정보
    const first = errors[0];
    console.log(`   First error at line ${first.line}: ${first.message}`);
  }
});
