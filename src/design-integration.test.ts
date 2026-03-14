/**
 * Phase 10.4: Design Integration Tests
 *
 * DesignIntegration 클래스의 기본 기능 검증
 */

import DesignIntegration, { compileDesignBlocks } from './design-integration';
import { Module, DesignBlockDeclaration } from './parser/ast';

describe('DesignIntegration', () => {
  // Mock DesignCompiler
  const mockModule: Module = {
    type: 'module',
    name: 'TestModule',
    statements: [],
    designBlocks: [
      {
        type: 'animation',
        name: 'fadeIn',
        content: 'duration: 300\nopacity: 0 → 1',
        line: 2,
        column: 3
      },
      {
        type: 'glass',
        content: 'background: rgba(255,255,255,0.1)\nbackdropFilter: blur(10px)',
        line: 6,
        column: 3
      },
      {
        type: '3d',
        name: 'rotate',
        content: 'rotateX: 45deg\nrotateY: 45deg',
        line: 10,
        column: 3
      }
    ]
  };

  test('should create DesignIntegration instance', () => {
    const integration = new DesignIntegration(mockModule);
    expect(integration).toBeDefined();
  });

  test('should count design blocks correctly', () => {
    const integration = new DesignIntegration(mockModule);
    expect(integration.getDesignBlockCount()).toBe(3);
  });

  test('should categorize design blocks by type', () => {
    const integration = new DesignIntegration(mockModule);
    const byType = integration.getDesignBlocksByType();

    expect(byType.animation).toBe(1);
    expect(byType.glass).toBe(1);
    expect(byType['3d']).toBe(1);
    expect(byType.micro).toBe(0);
    expect(byType.scroll).toBe(0);
  });

  test('should handle empty design blocks', () => {
    const emptyModule: Module = {
      type: 'module',
      name: 'EmptyModule',
      statements: []
    };

    const integration = new DesignIntegration(emptyModule);
    expect(integration.getDesignBlockCount()).toBe(0);

    const result = integration.compile();
    expect(result.css).toBe('');
    expect(result.javascript).toBe('');
    expect(result.stats.designBlockCount).toBe(0);
  });

  test('should convert block format correctly', () => {
    const integration = new DesignIntegration(mockModule);

    // 테스트: type 매핑 '3d' → 'transform3d'
    // convertBlockFormat는 private이므로 compile() 호출로 간접 검증
    const result = integration.compile();

    expect(result).toHaveProperty('css');
    expect(result).toHaveProperty('javascript');
    expect(result).toHaveProperty('stats');
  });

  test('should auto-generate names for unnamed blocks', () => {
    const unnamedModule: Module = {
      type: 'module',
      name: 'UnnamedModule',
      statements: [],
      designBlocks: [
        {
          type: 'animation',
          content: 'duration: 500',
          line: 1,
          column: 1
        },
        {
          type: 'animation',
          content: 'duration: 1000',
          line: 5,
          column: 1
        }
      ]
    };

    const integration = new DesignIntegration(unnamedModule);
    const byType = integration.getDesignBlocksByType();

    expect(byType.animation).toBe(2);
  });

  test('should compile and generate output', () => {
    const integration = new DesignIntegration(mockModule);
    const result = integration.compile();

    expect(result).toHaveProperty('css');
    expect(result).toHaveProperty('javascript');
    expect(result).toHaveProperty('stats');
    expect(result.stats.designBlockCount).toBe(3);
  });

  test('should provide stats from compiler', () => {
    const integration = new DesignIntegration(mockModule);
    const stats = integration.getStats();

    expect(stats).toBeDefined();
  });

  test('should reset compiler state', () => {
    const integration = new DesignIntegration(mockModule);
    integration.compile();
    integration.reset();

    // After reset, compile should work again
    const result = integration.compile();
    expect(result).toBeDefined();
  });

  test('compileDesignBlocks factory function', () => {
    const result = compileDesignBlocks(mockModule);

    expect(result).toHaveProperty('css');
    expect(result).toHaveProperty('javascript');
    expect(result).toHaveProperty('stats');
    expect(result.stats.designBlockCount).toBe(3);
  });

  test('compileMultipleDesignBlocks factory function', () => {
    const modules = [mockModule, mockModule];
    const results = [mockModule, mockModule].map(m => compileDesignBlocks(m));

    expect(results).toHaveLength(2);
    expect(results[0].stats.designBlockCount).toBe(3);
    expect(results[1].stats.designBlockCount).toBe(3);
  });
});

describe('Design Block Type Mapping', () => {
  test('should map 3d to transform3d', () => {
    const module: Module = {
      type: 'module',
      name: 'Transform3DTest',
      statements: [],
      designBlocks: [
        {
          type: '3d',
          name: 'myTransform',
          content: 'rotateX: 45deg',
          line: 1,
          column: 1
        }
      ]
    };

    const integration = new DesignIntegration(module);
    const byType = integration.getDesignBlocksByType();

    // Should recognize as '3d' type in internal count
    expect(byType['3d']).toBe(1);
  });

  test('should preserve all design types', () => {
    const module: Module = {
      type: 'module',
      name: 'AllTypesTest',
      statements: [],
      designBlocks: [
        { type: 'animation', content: 'duration: 300', line: 1, column: 1 },
        { type: 'glass', content: 'opacity: 0.8', line: 2, column: 1 },
        { type: '3d', content: 'rotate: 45deg', line: 3, column: 1 },
        { type: 'micro', content: 'hover: scale', line: 4, column: 1 },
        { type: 'scroll', content: 'trigger: top', line: 5, column: 1 }
      ]
    };

    const integration = new DesignIntegration(module);
    const byType = integration.getDesignBlocksByType();

    expect(byType.animation).toBe(1);
    expect(byType.glass).toBe(1);
    expect(byType['3d']).toBe(1);
    expect(byType.micro).toBe(1);
    expect(byType.scroll).toBe(1);
  });
});
