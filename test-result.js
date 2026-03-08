const { ScriptRunner } = require('./dist/src/script-runner/index');

const result = ScriptRunner.runFile('./self-hosting/test_result.fl');

console.log('Output:');
console.log(result.output.join('\n'));

if (result.error) {
  console.error('\nError:');
  console.error(result.error);
  process.exit(1);
}

console.log('\n✅ Test complete!');
