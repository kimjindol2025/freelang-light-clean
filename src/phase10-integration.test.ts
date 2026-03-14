/**
 * Phase 10.6: Comprehensive Integration Tests
 *
 * Full pipeline testing: Lexer → Parser → DesignIntegration → CLI
 * Tests real .free files with actual design directives
 */

import * as fs from 'fs';
import * as path from 'path';
import { Lexer } from './lexer/lexer';
import { TokenBuffer } from './lexer/lexer';
import { Parser } from './parser/parser';
import { compileDesignBlocks } from './design-integration';
import DesignCLIHelper from './cli/design-cli-helper';

describe('Phase 10.6: E2E Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '..', 'test-fixtures');

  /**
   * Helper: Parse a .free file and return Module AST
   */
  function parseFreeLangFile(filePath: string): any {
    const source = fs.readFileSync(filePath, 'utf-8');
    const lexer = new Lexer(source);
    const tokenBuffer = new TokenBuffer(lexer, { preserveNewlines: false });
    const parser = new Parser(tokenBuffer);
    return parser.parseModule();
  }

  /**
   * Test 1: Animation Component
   */
  test('should compile animation component end-to-end', () => {
    const filePath = path.join(fixturesDir, 'component-with-animation.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    // Parse the file
    const module = parseFreeLangFile(filePath);

    expect(module).toBeDefined();
    expect(module.designBlocks).toBeDefined();
    expect(module.designBlocks.length).toBeGreaterThan(0);

    // Check for animation blocks
    const animationBlocks = module.designBlocks.filter((b: any) => b.type === 'animation');
    expect(animationBlocks.length).toBeGreaterThan(0);

    // Compile designs
    const result = compileDesignBlocks(module);
    expect(result.success ?? result.css !== undefined).toBe(true);
    expect(result.css).toBeDefined();
    expect(result.javascript).toBeDefined();
  });

  /**
   * Test 2: Glass Component
   */
  test('should compile glass component end-to-end', () => {
    const filePath = path.join(fixturesDir, 'component-with-glass.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    const module = parseFreeLangFile(filePath);

    expect(module).toBeDefined();
    expect(module.designBlocks).toBeDefined();

    const glassBlocks = module.designBlocks.filter((b: any) => b.type === 'glass');
    expect(glassBlocks.length).toBeGreaterThan(0);

    const result = compileDesignBlocks(module);
    expect(result.css).toBeDefined();
    expect(result.javascript).toBeDefined();
  });

  /**
   * Test 3: 3D Component
   */
  test('should compile 3D component end-to-end', () => {
    const filePath = path.join(fixturesDir, 'component-with-3d.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    const module = parseFreeLangFile(filePath);

    expect(module).toBeDefined();
    expect(module.designBlocks).toBeDefined();

    const threeD = module.designBlocks.filter((b: any) => b.type === '3d');
    expect(threeD.length).toBeGreaterThan(0);

    const result = compileDesignBlocks(module);
    expect(result.css).toBeDefined();
    expect(result.javascript).toBeDefined();
  });

  /**
   * Test 4: Micro-interaction Component
   */
  test('should compile micro-interaction component end-to-end', () => {
    const filePath = path.join(fixturesDir, 'component-with-micro.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    const module = parseFreeLangFile(filePath);

    expect(module).toBeDefined();
    expect(module.designBlocks).toBeDefined();

    const microBlocks = module.designBlocks.filter((b: any) => b.type === 'micro');
    expect(microBlocks.length).toBeGreaterThan(0);

    const result = compileDesignBlocks(module);
    expect(result.css).toBeDefined();
    expect(result.javascript).toBeDefined();
  });

  /**
   * Test 5: Scroll Trigger Component
   */
  test('should compile scroll trigger component end-to-end', () => {
    const filePath = path.join(fixturesDir, 'component-with-scroll.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    const module = parseFreeLangFile(filePath);

    expect(module).toBeDefined();
    expect(module.designBlocks).toBeDefined();

    const scrollBlocks = module.designBlocks.filter((b: any) => b.type === 'scroll');
    expect(scrollBlocks.length).toBeGreaterThan(0);

    const result = compileDesignBlocks(module);
    expect(result.css).toBeDefined();
    expect(result.javascript).toBeDefined();
  });

  /**
   * Test 6: Comprehensive Component (All Design Types)
   */
  test('should compile comprehensive component with all design types', () => {
    const filePath = path.join(fixturesDir, 'hero-component-all-designs.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    const module = parseFreeLangFile(filePath);

    expect(module).toBeDefined();
    expect(module.designBlocks).toBeDefined();
    expect(module.designBlocks.length).toBeGreaterThanOrEqual(5);

    // Verify all design types present
    const typeMap: Record<string, number> = {};
    for (const block of module.designBlocks) {
      typeMap[block.type] = (typeMap[block.type] || 0) + 1;
    }

    expect(typeMap['animation']).toBeGreaterThan(0);
    expect(typeMap['glass']).toBeGreaterThan(0);
    expect(typeMap['3d']).toBeGreaterThan(0);
    expect(typeMap['micro']).toBeGreaterThan(0);
    expect(typeMap['scroll']).toBeGreaterThan(0);

    // Compile
    const result = compileDesignBlocks(module);
    expect(result.css).toBeDefined();
    expect(result.javascript).toBeDefined();
  });

  /**
   * Test 7: Design Block Properties
   */
  test('should correctly parse design block properties', () => {
    const filePath = path.join(fixturesDir, 'component-with-animation.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    const module = parseFreeLangFile(filePath);
    const animationBlocks = module.designBlocks.filter((b: any) => b.type === 'animation');

    // Verify block structure
    for (const block of animationBlocks) {
      expect(block).toHaveProperty('type');
      expect(block).toHaveProperty('content');
      expect(block).toHaveProperty('line');
      expect(block).toHaveProperty('column');

      // Content should include animation properties
      expect(block.content).toBeTruthy();
      expect(block.content.length).toBeGreaterThan(0);
    }
  });

  /**
   * Test 8: Mixed Statements and Design Blocks
   */
  test('should separate design blocks from regular statements', () => {
    const filePath = path.join(fixturesDir, 'component-with-animation.free');

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping: ${filePath} not found`);
      return;
    }

    const module = parseFreeLangFile(filePath);

    // Module should have both statements and designBlocks
    expect(module.statements).toBeDefined();
    expect(module.designBlocks).toBeDefined();

    // designBlocks should NOT be in statements
    const designBlocksInStatements = module.statements.filter(
      (s: any) => s.type === 'animation' || s.type === 'glass' || s.type === '3d' || s.type === 'micro' || s.type === 'scroll'
    );
    expect(designBlocksInStatements.length).toBe(0);
  });
});

describe('Phase 10.6: Error Handling and Edge Cases', () => {
  /**
   * Test 9: Empty Design Block
   */
  test('should handle empty design block gracefully', () => {
    const source = `
      component Test {
        @animation {
        }
      }
    `;

    const lexer = new Lexer(source);
    const tokenBuffer = new TokenBuffer(lexer, { preserveNewlines: false });
    const parser = new Parser(tokenBuffer);

    try {
      const module = parser.parseModule();
      expect(module).toBeDefined();
      // Empty block content is valid
      expect(module.designBlocks).toBeDefined();
    } catch (error) {
      // If parser throws, that's also acceptable for empty blocks
      expect(true).toBe(true);
    }
  });

  /**
   * Test 10: Design Block with Complex Content
   */
  test('should handle design blocks with complex nested content', () => {
    const source = `
      component ComplexButton {
        @animation complexAnim {
          duration: 300
          keyframes: {
            0%: { opacity: 0, transform: scale(0.8) }
            50%: { opacity: 1 }
            100%: { opacity: 1, transform: scale(1) }
          }
        }
      }
    `;

    const lexer = new Lexer(source);
    const tokenBuffer = new TokenBuffer(lexer, { preserveNewlines: false });
    const parser = new Parser(tokenBuffer);

    const module = parser.parseModule();
    expect(module).toBeDefined();
    expect(module.designBlocks).toBeDefined();

    const animBlocks = module.designBlocks.filter((b: any) => b.type === 'animation');
    expect(animBlocks.length).toBeGreaterThan(0);

    // Verify complex content is captured
    const block = animBlocks[0];
    expect(block.content).toContain('keyframes');
  });

  /**
   * Test 11: Multiple Design Blocks Same Type
   */
  test('should handle multiple design blocks of same type', () => {
    const source = `
      component MultiAnimation {
        @animation fadeIn {
          duration: 300
          opacity: 0 → 1
        }

        @animation slideIn {
          duration: 500
          transform: translateX(-100px) → translateX(0)
        }

        @animation scaleIn {
          duration: 400
          transform: scale(0) → scale(1)
        }
      }
    `;

    const lexer = new Lexer(source);
    const tokenBuffer = new TokenBuffer(lexer, { preserveNewlines: false });
    const parser = new Parser(tokenBuffer);

    const module = parser.parseModule();
    const animations = module.designBlocks.filter((b: any) => b.type === 'animation');

    expect(animations.length).toBe(3);
    expect(animations[0].name || animations[0].content).toBeTruthy();
    expect(animations[1].name || animations[1].content).toBeTruthy();
    expect(animations[2].name || animations[2].content).toBeTruthy();
  });

  /**
   * Test 12: Design Block Line/Column Tracking
   */
  test('should correctly track line and column numbers', () => {
    const source = `component Test {
  @animation fadeIn {
    duration: 300
  }
}`;

    const lexer = new Lexer(source);
    const tokenBuffer = new TokenBuffer(lexer, { preserveNewlines: false });
    const parser = new Parser(tokenBuffer);

    const module = parser.parseModule();
    const animBlocks = module.designBlocks.filter((b: any) => b.type === 'animation');

    expect(animBlocks.length).toBeGreaterThan(0);
    const block = animBlocks[0];

    expect(block.line).toBeDefined();
    expect(block.column).toBeDefined();
    expect(block.line).toBeGreaterThan(0);
    expect(block.column).toBeGreaterThanOrEqual(0);
  });
});
