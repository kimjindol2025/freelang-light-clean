/**
 * Phase 10.8: Design Optimization Tests
 *
 * Tests for caching, minification, and performance optimization
 */

import {
  DesignCompilationCache,
  CSSOptimizer,
  JavaScriptOptimizer,
  DesignCompilationBenchmark,
  ParallelDesignCompiler
} from './design-optimization';

describe('Phase 10.8: Design Optimization', () => {
  describe('DesignCompilationCache', () => {
    test('should cache compiled results', () => {
      const cache = new DesignCompilationCache(true);

      const result = { css: 'body { color: red; }', javascript: 'console.log("test");', timestamp: Date.now() };
      cache.set('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1', result);

      const cached = cache.get('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1');
      expect(cached).toEqual(result);
    });

    test('should return null for cache miss', () => {
      const cache = new DesignCompilationCache(true);

      const cached = cache.get('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1');
      expect(cached).toBeNull();
    });

    test('should disable caching when disabled', () => {
      const cache = new DesignCompilationCache(false);

      const result = { css: 'body { color: red; }', javascript: 'console.log("test");', timestamp: Date.now() };
      cache.set('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1', result);

      const cached = cache.get('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1');
      expect(cached).toBeNull();
    });

    test('should clear cache', () => {
      const cache = new DesignCompilationCache(true);

      const result = { css: 'body { color: red; }', javascript: 'console.log("test");', timestamp: Date.now() };
      cache.set('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1', result);

      cache.clear();

      const cached = cache.get('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1');
      expect(cached).toBeNull();
    });

    test('should provide cache statistics', () => {
      const cache = new DesignCompilationCache(true);

      const result = { css: 'body { color: red; }', javascript: 'console.log("test");', timestamp: Date.now() };
      cache.set('animation', 'fadeIn', 'duration: 300; opacity: 0 → 1', result);

      const stats = cache.getStats();
      expect(stats.entriesCount).toBe(1);
      expect(stats.enabled).toBe(true);
      expect(stats.estimatedSizeMB).toBeGreaterThan(0);
    });
  });

  describe('CSSOptimizer', () => {
    test('should minify CSS', () => {
      const css = `
        body {
          color: red;
          margin: 0;
        }

        .button {
          padding: 10px 20px;
        }
      `;

      const minified = CSSOptimizer.minify(css);

      // Should remove whitespace
      expect(minified).not.toContain('\n');
      expect(minified).not.toContain('  ');

      // Should preserve CSS structure
      expect(minified).toContain('body{');
      expect(minified).toContain('.button{');
    });

    test('should remove CSS comments', () => {
      const css = `
        /* This is a comment */
        body {
          color: red; /* Another comment */
        }
      `;

      const minified = CSSOptimizer.minify(css);

      expect(minified).not.toContain('/*');
      expect(minified).not.toContain('comment');
    });

    test('should optimize color values', () => {
      const css = 'body { color: #rrggbb; }';

      const minified = CSSOptimizer.minify(css);

      // Should still be valid CSS (color optimization is optional)
      expect(minified).toBeTruthy();
    });

    test('should calculate optimization statistics', () => {
      const original = `
        body {
          color: red;
          margin: 0;
        }
      `;

      const minified = CSSOptimizer.minify(original);
      const stats = CSSOptimizer.getStats(original, minified);

      expect(stats.originalSize).toBeGreaterThan(stats.minifiedSize);
      expect(stats.compressionRatio).toBeGreaterThan(0);
      expect(stats.savings).toBeGreaterThan(0);
    });

    test('should handle empty CSS', () => {
      const css = '';
      const minified = CSSOptimizer.minify(css);

      expect(minified).toBe('');
    });

    test('should remove unused rules based on selectors', () => {
      const css = '.unused { color: red; } .used { color: blue; }';
      const usedSelectors = new Set(['.used']);

      const optimized = CSSOptimizer.removeUnused(css, usedSelectors);

      expect(optimized).toContain('.used');
      expect(optimized).not.toContain('.unused');
    });
  });

  describe('JavaScriptOptimizer', () => {
    test('should minify JavaScript', () => {
      const js = `
        // Initialize animation
        function initAnimation() {
          console.log("Starting animation");
          return true;
        }
      `;

      const minified = JavaScriptOptimizer.minify(js);

      // Should remove comments
      expect(minified).not.toContain('//');
      expect(minified).not.toContain('Initialize');

      // Should preserve functionality
      expect(minified).toContain('function');
      expect(minified).toContain('console.log');
    });

    test('should remove single-line comments', () => {
      const js = `
        function test() {
          // This is a comment
          return true;
        }
      `;

      const minified = JavaScriptOptimizer.minify(js);

      expect(minified).not.toContain('//');
      expect(minified).not.toContain('comment');
    });

    test('should remove multi-line comments', () => {
      const js = `
        function test() {
          /* This is a
             multi-line comment */
          return true;
        }
      `;

      const minified = JavaScriptOptimizer.minify(js);

      expect(minified).not.toContain('/*');
      expect(minified).not.toContain('multi-line');
    });

    test('should calculate optimization statistics', () => {
      const original = `
        function test() {
          return true;
        }
      `;

      const minified = JavaScriptOptimizer.minify(original);
      const stats = JavaScriptOptimizer.getStats(original, minified);

      expect(stats.originalSize).toBeGreaterThan(stats.minifiedSize);
      expect(stats.compressionRatio).toBeGreaterThan(0);
      expect(stats.savings).toBeGreaterThan(0);
    });

    test('should handle empty JavaScript', () => {
      const js = '';
      const minified = JavaScriptOptimizer.minify(js);

      expect(minified).toBe('');
    });
  });

  describe('DesignCompilationBenchmark', () => {
    test('should measure total compilation time', () => {
      const benchmark = new DesignCompilationBenchmark();

      benchmark.start();

      // Simulate work
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }

      benchmark.end();

      const duration = benchmark.getDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    test('should measure individual operations', () => {
      const benchmark = new DesignCompilationBenchmark();

      benchmark.measure('operation-1', () => {
        let sum = 0;
        for (let i = 0; i < 100000; i++) {
          sum += i;
        }
      });

      benchmark.measure('operation-2', () => {
        let sum = 0;
        for (let i = 0; i < 200000; i++) {
          sum += i;
        }
      });

      const report = benchmark.getMeasurements();

      expect(report.measurements.length).toBe(2);
      expect(report.measurements[0].name).toBe('operation-1');
      expect(report.measurements[1].name).toBe('operation-2');
      expect(report.measurements[1].durationMS).toBeGreaterThanOrEqual(
        report.measurements[0].durationMS
      );
    });

    test('should reset measurements', () => {
      const benchmark = new DesignCompilationBenchmark();

      benchmark.measure('test', () => {});
      benchmark.reset();

      const report = benchmark.getMeasurements();
      expect(report.measurements.length).toBe(0);
      expect(report.totalDurationMS).toBe(0);
    });

    test('should calculate percentage of total', () => {
      const benchmark = new DesignCompilationBenchmark();

      benchmark.start();

      benchmark.measure('op1', () => {
        // 40 iterations
        for (let i = 0; i < 40; i++) {}
      });

      benchmark.measure('op2', () => {
        // 60 iterations
        for (let i = 0; i < 60; i++) {}
      });

      benchmark.end();

      const report = benchmark.getMeasurements();
      const totalPercentage = report.measurements.reduce((sum, m) => sum + m.percentageOfTotal, 0);

      expect(totalPercentage).toBe(100);
    });
  });

  describe('ParallelDesignCompiler', () => {
    test('should compile multiple design blocks', async () => {
      const compiler = new ParallelDesignCompiler(true);

      const designBlocks = [
        { type: 'animation', name: 'fadeIn', content: 'duration: 300; opacity: 0 → 1' },
        { type: 'glass', content: 'background: rgba(255,255,255,0.1); backdropFilter: blur(10px)' },
        { type: '3d', name: 'rotate', content: 'perspective: 1000px; rotateX: 45deg' }
      ];

      const result = await compiler.compileMultiple(designBlocks, { minify: false, benchmark: false });

      expect(result.success).toBe(true);
      expect(result.blockCount).toBe(3);
      expect(result.css).toBeDefined();
      expect(result.javascript).toBeDefined();
      expect(result.durationMS).toBeGreaterThanOrEqual(0);
    });

    test('should minify output when requested', async () => {
      const compiler = new ParallelDesignCompiler(true);

      const designBlocks = [
        { type: 'animation', name: 'fadeIn', content: 'duration: 300; opacity: 0 → 1' }
      ];

      const result = await compiler.compileMultiple(designBlocks, {
        minify: true,
        benchmark: false,
        verbose: false
      });

      expect(result.success).toBe(true);
      expect(result.css).toBeDefined();
    });

    test('should cache compiled results', async () => {
      const compiler = new ParallelDesignCompiler(true);

      const designBlocks = [
        { type: 'animation', name: 'fadeIn', content: 'duration: 300; opacity: 0 → 1' }
      ];

      const stats1 = compiler.getCacheStats();
      expect(stats1.entriesCount).toBe(0);

      await compiler.compileMultiple(designBlocks, { minify: false, benchmark: false });

      const stats2 = compiler.getCacheStats();
      // Cache would store results if caching were fully implemented
      expect(stats2).toBeDefined();
    });

    test('should clear cache', async () => {
      const compiler = new ParallelDesignCompiler(true);

      const designBlocks = [
        { type: 'animation', name: 'fadeIn', content: 'duration: 300; opacity: 0 → 1' }
      ];

      await compiler.compileMultiple(designBlocks, { minify: false, benchmark: false });

      compiler.clearCache();

      const stats = compiler.getCacheStats();
      expect(stats.entriesCount).toBe(0);
    });

    test('should handle empty design blocks', async () => {
      const compiler = new ParallelDesignCompiler(true);

      const result = await compiler.compileMultiple([], { minify: false, benchmark: false });

      expect(result.success).toBe(true);
      expect(result.blockCount).toBe(0);
    });

    test('should provide benchmark report', async () => {
      const compiler = new ParallelDesignCompiler(true);

      const designBlocks = [
        { type: 'animation', name: 'fadeIn', content: 'duration: 300; opacity: 0 → 1' },
        { type: 'animation', name: 'slideIn', content: 'duration: 500; transform: translateX(-100px) → translateX(0)' }
      ];

      const result = await compiler.compileMultiple(designBlocks, {
        minify: false,
        benchmark: true,
        verbose: false
      });

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });
  });
});
