/**
 * Phase 9 Complete Demo
 * Real-world example of compiling a FreeLang component with all design features
 */

const fs = require('fs');
const path = require('path');
const DesignCompiler = require('./design-compiler');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  Phase 9: FreeLang Design Compiler - Complete Demo    ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Read the HeroCard.free example
const heroCardPath = path.join(__dirname, '../examples/HeroCard.free');

if (!fs.existsSync(heroCardPath)) {
  console.error(`❌ File not found: ${heroCardPath}`);
  process.exit(1);
}

console.log(`📂 Reading: ${heroCardPath}\n`);
const freeContent = fs.readFileSync(heroCardPath, 'utf-8');

// Display file info
console.log('📊 Component File Statistics:');
console.log(`   - Size: ${freeContent.length} bytes`);
console.log(`   - Lines: ${freeContent.split('\n').length}`);
console.log(`   - Contains ${(freeContent.match(/@animation/g) || []).length} @animation blocks`);
console.log(`   - Contains ${(freeContent.match(/@glass/g) || []).length} @glass blocks`);
console.log(`   - Contains ${(freeContent.match(/@3d/g) || []).length} @3d blocks`);
console.log(`   - Contains ${(freeContent.match(/@micro/g) || []).length} @micro blocks`);
console.log(`   - Contains ${(freeContent.match(/@scroll/g) || []).length} @scroll blocks\n`);

// Compile with DesignCompiler
console.log('🔨 Compiling design blocks...\n');
const compiler = new DesignCompiler();
const result = compiler.compileDesignBlocks(freeContent);

// Get statistics
const stats = compiler.getStats();
console.log('📈 Compilation Statistics:');
console.log(`   Animations: ${stats.animations.totalAnimations || 0}`);
console.log(`   Glassmorphisms: ${stats.glassmorphisms.totalComponents || 0}`);
console.log(`   3D Transforms: ${stats.transforms.totalTransforms || 0}`);
console.log(`   Micro-interactions: ${stats.interactions.totalInteractions || 0}`);
console.log(`   Scroll Triggers: ${stats.scrollTriggers.totalTriggers || 0}\n`);

// Display generated CSS
console.log('📝 Generated CSS:');
console.log('═'.repeat(60));
if (result.css) {
  const lines = result.css.split('\n');
  const preview = lines.slice(0, 15).join('\n');
  console.log(preview);
  if (lines.length > 15) {
    console.log(`... (${lines.length - 15} more lines)`);
  }
} else {
  console.log('(No CSS generated)');
}
console.log('═'.repeat(60));
console.log(`Total CSS size: ${result.css.length} bytes\n`);

// Display generated JavaScript
console.log('📝 Generated JavaScript:');
console.log('═'.repeat(60));
if (result.javascript) {
  const lines = result.javascript.split('\n');
  const preview = lines.slice(0, 15).join('\n');
  console.log(preview);
  if (lines.length > 15) {
    console.log(`... (${lines.length - 15} more lines)`);
  }
} else {
  console.log('(No JavaScript generated - no event triggers)');
}
console.log('═'.repeat(60));
console.log(`Total JS size: ${result.javascript.length} bytes\n`);

// Save outputs to files for inspection
const outputDir = path.join(__dirname, '../dist');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const cssPath = path.join(outputDir, 'HeroCard.css');
const jsPath = path.join(outputDir, 'HeroCard.js');

fs.writeFileSync(cssPath, result.css || '/* No CSS generated */');
fs.writeFileSync(jsPath, result.javascript || '// No JavaScript generated');

console.log('💾 Output Files Generated:');
console.log(`   - ${cssPath}`);
console.log(`   - ${jsPath}\n`);

// Summary
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  ✅ Phase 9 Compilation Complete!                     ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('🎯 What was compiled:');
console.log('   ✅ @animation blocks → CSS @keyframes');
console.log('   ✅ @glass blocks → Glassmorphism CSS');
console.log('   ✅ @3d blocks → 3D transform properties');
console.log('   ✅ @micro blocks → Micro-interaction JavaScript');
console.log('   ✅ @scroll blocks → Scroll trigger JavaScript\n');

console.log('🚀 Next steps:');
console.log('   1. Integrate with Parser to recognize @ directives');
console.log('   2. Add to CLI: freelang compile --design-engines');
console.log('   3. Create test .free files for each feature');
console.log('   4. Demo website with all design effects\n');

process.exit(0);
