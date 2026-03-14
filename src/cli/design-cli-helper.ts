/**
 * Phase 10.5: CLI Design Compilation Helper
 *
 * 파서가 생성한 Module AST의 designBlocks를 컴파일하여
 * CSS + JavaScript 아티팩트를 생성
 *
 * 흐름:
 *   .free 파일
 *     ↓
 *   Parser (Phase 10.1-10.3) → Module AST (designBlocks 포함)
 *     ↓
 *   DesignCompilationHelper.compileDesigns()
 *     ├─ Module AST 파싱
 *     ├─ designBlocks 추출
 *     ├─ DesignIntegration으로 라우팅
 *     └─ CSS/JS 생성
 *       ↓
 *   CSS 파일 (*.design.css)
 *   JavaScript 파일 (*.design.js)
 */

import * as fs from 'fs';
import * as path from 'path';
import { compileDesignBlocks } from '../design-integration';
import { Module } from '../parser/ast';

export interface DesignCompilationResult {
  success: boolean;
  error?: string;
  cssPath?: string;
  jsPath?: string;
  cssSize?: number;
  jsSize?: number;
  designBlockCount?: number;
  duration?: number;
  stats?: Record<string, any>;
}

/**
 * Design 아티팩트를 파일 시스템에 저장
 *
 * 출력 경로:
 *   <designOutput>/
 *     ├─ <basename>.design.css
 *     └─ <basename>.design.js
 */
export class DesignCLIHelper {
  /**
   * .free 파일의 Module AST에서 디자인 블록을 컴파일하여
   * CSS + JavaScript 아티팩트 생성
   *
   * @param sourceFile .free 파일 경로
   * @param designOutput 출력 디렉토리 경로
   * @param module Parser가 생성한 Module AST
   * @param verbose 상세 로그 출력 여부
   */
  public static compileDesigns(
    sourceFile: string,
    designOutput: string,
    module: Module,
    verbose: boolean = false
  ): DesignCompilationResult {
    const startTime = Date.now();

    try {
      // 1. designBlocks 확인
      if (!module.designBlocks || module.designBlocks.length === 0) {
        if (verbose) {
          console.log(`[design] No design blocks found in ${sourceFile}`);
        }
        return {
          success: true,
          designBlockCount: 0,
          duration: Date.now() - startTime,
          stats: {}
        };
      }

      if (verbose) {
        console.log(
          `[design] Found ${module.designBlocks.length} design blocks in ${sourceFile}`
        );
      }

      // 2. DesignIntegration으로 컴파일
      const compilationResult = compileDesignBlocks(module);

      if (!compilationResult) {
        throw new Error('DesignIntegration compilation returned invalid result');
      }

      // 3. 출력 디렉토리 생성
      if (!fs.existsSync(designOutput)) {
        fs.mkdirSync(designOutput, { recursive: true });
        if (verbose) {
          console.log(`[design] Created output directory: ${designOutput}`);
        }
      }

      // 4. 아티팩트 파일명 결정
      const basename = path.basename(sourceFile, path.extname(sourceFile));
      const cssPath = path.join(designOutput, `${basename}.design.css`);
      const jsPath = path.join(designOutput, `${basename}.design.js`);

      // 5. CSS 파일 작성
      const cssContent = compilationResult.css || '';
      fs.writeFileSync(cssPath, cssContent, 'utf-8');
      const cssSize = Buffer.byteLength(cssContent, 'utf-8');

      if (verbose) {
        console.log(`[design] CSS generated: ${cssPath} (${cssSize} bytes)`);
      }

      // 6. JavaScript 파일 작성
      const jsContent = compilationResult.javascript || '';
      fs.writeFileSync(jsPath, jsContent, 'utf-8');
      const jsSize = Buffer.byteLength(jsContent, 'utf-8');

      if (verbose) {
        console.log(`[design] JavaScript generated: ${jsPath} (${jsSize} bytes)`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        cssPath,
        jsPath,
        cssSize,
        jsSize,
        designBlockCount: module.designBlocks.length,
        duration,
        stats: compilationResult.stats
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMessage,
        duration,
        stats: {}
      };
    }
  }

  /**
   * 컴파일 결과를 콘솔에 출력
   */
  public static printResult(
    result: DesignCompilationResult,
    sourceFile: string,
    verbose: boolean = false
  ): void {
    if (!result.success) {
      console.error(`[design-error] Failed to compile designs for ${sourceFile}`);
      if (result.error) {
        console.error(`  ${result.error}`);
      }
      return;
    }

    if (result.designBlockCount === 0) {
      console.log(`[design] No design blocks to compile in ${sourceFile}`);
      return;
    }

    console.log(`[design] ✅ Successfully compiled ${result.designBlockCount} design blocks`);

    if (result.cssPath) {
      console.log(`  CSS:  ${result.cssPath} (${result.cssSize} bytes)`);
    }

    if (result.jsPath) {
      console.log(`  JS:   ${result.jsPath} (${result.jsSize} bytes)`);
    }

    if (result.duration !== undefined) {
      console.log(`  Time: ${result.duration}ms`);
    }

    if (verbose && result.stats) {
      console.log(`  Stats:`, JSON.stringify(result.stats, null, 2));
    }
  }

  /**
   * 디렉토리 내의 모든 .free 파일에서 디자인 블록 컴파일
   *
   * (향후 Phase 10.6에서 구현)
   */
  public static compileDesignsInDirectory(
    directory: string,
    designOutput: string,
    verbose: boolean = false
  ): DesignCompilationResult[] {
    const results: DesignCompilationResult[] = [];

    // TODO: Phase 10.6에서 구현
    // 1. directory 내의 모든 .free 파일 탐색
    // 2. 각 파일을 Parser로 파싱하여 Module AST 획득
    // 3. 각 Module에 대해 compileDesigns() 호출
    // 4. 결과 수집

    return results;
  }
}

export default DesignCLIHelper;
