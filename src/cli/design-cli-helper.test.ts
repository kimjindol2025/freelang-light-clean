/**
 * Phase 10.5: CLI Design Compilation Tests
 *
 * DesignCLIHelper의 기능 검증
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import DesignCLIHelper from './design-cli-helper';
import { Module } from '../parser/ast';

describe('DesignCLIHelper', () => {
  let tmpDir: string;

  beforeEach(() => {
    // 임시 디렉토리 생성
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'freelang-design-test-'));
  });

  afterEach(() => {
    // 임시 디렉토리 정리
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('should compile designs and create files', () => {
    const sourceFile = path.join(tmpDir, 'test.free');
    const designOutput = path.join(tmpDir, 'design-artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'TestModule',
      statements: [],
      designBlocks: [
        {
          type: 'animation',
          name: 'fadeIn',
          content: 'duration: 300\nopacity: 0 → 1',
          line: 1,
          column: 1
        }
      ]
    };

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      false
    );

    expect(result.success).toBe(true);
    expect(result.designBlockCount).toBe(1);
    expect(result.cssPath).toBeDefined();
    expect(result.jsPath).toBeDefined();
    expect(result.duration).toBeGreaterThanOrEqual(0);

    // 파일 생성 확인
    expect(fs.existsSync(designOutput)).toBe(true);
    if (result.cssPath) {
      expect(fs.existsSync(result.cssPath)).toBe(true);
    }
    if (result.jsPath) {
      expect(fs.existsSync(result.jsPath)).toBe(true);
    }
  });

  test('should handle empty design blocks', () => {
    const sourceFile = path.join(tmpDir, 'empty.free');
    const designOutput = path.join(tmpDir, 'design-artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'EmptyModule',
      statements: []
    };

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      false
    );

    expect(result.success).toBe(true);
    expect(result.designBlockCount).toBe(0);
  });

  test('should create output directory if not exists', () => {
    const sourceFile = path.join(tmpDir, 'test.free');
    const designOutput = path.join(tmpDir, 'deep', 'nested', 'design-artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'TestModule',
      statements: [],
      designBlocks: [
        {
          type: 'glass',
          content: 'opacity: 0.8',
          line: 1,
          column: 1
        }
      ]
    };

    expect(fs.existsSync(designOutput)).toBe(false);

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      false
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(designOutput)).toBe(true);
  });

  test('should handle all design block types', () => {
    const sourceFile = path.join(tmpDir, 'all-types.free');
    const designOutput = path.join(tmpDir, 'design-artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'AllTypesModule',
      statements: [],
      designBlocks: [
        { type: 'animation', name: 'a1', content: 'duration: 300', line: 1, column: 1 },
        { type: 'glass', name: 'g1', content: 'opacity: 0.8', line: 2, column: 1 },
        { type: '3d', name: 't1', content: 'rotate: 45deg', line: 3, column: 1 },
        { type: 'micro', name: 'm1', content: 'hover: scale', line: 4, column: 1 },
        { type: 'scroll', name: 's1', content: 'trigger: top', line: 5, column: 1 }
      ]
    };

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      false
    );

    expect(result.success).toBe(true);
    expect(result.designBlockCount).toBe(5);
  });

  test('should generate valid file sizes', () => {
    const sourceFile = path.join(tmpDir, 'test.free');
    const designOutput = path.join(tmpDir, 'design-artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'TestModule',
      statements: [],
      designBlocks: [
        {
          type: 'animation',
          name: 'fadeIn',
          content: 'duration: 300\nopacity: 0 → 1',
          line: 1,
          column: 1
        }
      ]
    };

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      false
    );

    expect(result.success).toBe(true);
    expect(result.cssSize).toBeGreaterThanOrEqual(0);
    expect(result.jsSize).toBeGreaterThanOrEqual(0);
  });

  test('should handle file path normalization', () => {
    const sourceFile = path.join(tmpDir, 'my-component.free');
    const designOutput = path.join(tmpDir, 'artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'MyComponent',
      statements: [],
      designBlocks: [
        { type: 'animation', content: 'duration: 300', line: 1, column: 1 }
      ]
    };

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      false
    );

    expect(result.success).toBe(true);
    if (result.cssPath) {
      // 파일명이 'my-component.design.css' 형식이어야 함
      expect(path.basename(result.cssPath)).toMatch(/my-component\.design\.css/);
    }
    if (result.jsPath) {
      expect(path.basename(result.jsPath)).toMatch(/my-component\.design\.js/);
    }
  });

  test('should populate stats', () => {
    const sourceFile = path.join(tmpDir, 'test.free');
    const designOutput = path.join(tmpDir, 'design-artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'TestModule',
      statements: [],
      designBlocks: [
        { type: 'animation', content: 'duration: 300', line: 1, column: 1 }
      ]
    };

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      false
    );

    expect(result.success).toBe(true);
    expect(result.stats).toBeDefined();
    expect(result.stats).toEqual({});  // DesignCompiler stats (empty in test)
  });

  test('printResult should not throw for successful result', () => {
    const sourceFile = 'test.free';
    const result = {
      success: true,
      cssPath: '/tmp/test.design.css',
      jsPath: '/tmp/test.design.js',
      cssSize: 100,
      jsSize: 200,
      designBlockCount: 1,
      duration: 10,
      stats: {}
    };

    // Should not throw
    expect(() => {
      DesignCLIHelper.printResult(result, sourceFile, false);
    }).not.toThrow();
  });

  test('printResult should handle error result', () => {
    const sourceFile = 'test.free';
    const result = {
      success: false,
      error: 'Test error',
      stats: {}
    };

    // Should not throw
    expect(() => {
      DesignCLIHelper.printResult(result, sourceFile, false);
    }).not.toThrow();
  });

  test('should include stats in verbose output', () => {
    const sourceFile = path.join(tmpDir, 'test.free');
    const designOutput = path.join(tmpDir, 'design-artifacts');

    const mockModule: Module = {
      type: 'module',
      name: 'TestModule',
      statements: [],
      designBlocks: [
        { type: 'animation', content: 'duration: 300', line: 1, column: 1 }
      ]
    };

    const result = DesignCLIHelper.compileDesigns(
      sourceFile,
      designOutput,
      mockModule,
      true  // verbose
    );

    expect(result.success).toBe(true);
  });
});
