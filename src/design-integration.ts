/**
 * Phase 10.4: Design Integration
 *
 * Parser에서 생성된 Module AST의 designBlocks를 DesignCompiler와 연결
 *
 * 흐름:
 *   Module AST (from Parser Phase 10.3)
 *     ↓
 *   DesignIntegration.compile()
 *     ├─ designBlocks 추출
 *     ├─ DesignBlockDeclaration → DesignCompiler 형식 변환
 *     ├─ 블록 속성 파싱
 *     └─ DesignCompiler로 라우팅
 *       ↓
 *   DesignCompiler (Phase 9)
 *     ├─ AnimationEngine
 *     ├─ GlassmorphismEngine
 *     ├─ Transform3DEngine
 *     ├─ MicroInteractionHandler
 *     └─ ScrollTriggerSystem
 *       ↓
 *   CSS + JavaScript 생성
 */

import { Module, DesignBlockDeclaration } from './parser/ast';

// DesignCompiler는 JavaScript 모듈이므로 require 사용
const DesignCompiler = require('./design-compiler');

/**
 * Design Block Integration
 *
 * Parser AST의 designBlocks를 DesignCompiler와 연결
 */
export class DesignIntegration {
  private module: Module;
  private designCompiler: any;

  constructor(module: Module) {
    this.module = module;
    this.designCompiler = new DesignCompiler();
  }

  /**
   * Module의 designBlocks를 컴파일하여 CSS + JavaScript 생성
   *
   * @returns { css: string; javascript: string; stats: any }
   */
  public compile(): { css: string; javascript: string; stats: any } {
    // 모듈에 디자인 블록이 없으면 빈 결과 반환
    if (!this.module.designBlocks || this.module.designBlocks.length === 0) {
      return {
        css: '',
        javascript: '',
        stats: { designBlockCount: 0 }
      };
    }

    // 각 디자인 블록을 컴파일러로 전달
    for (const block of this.module.designBlocks) {
      this.compileDesignBlock(block);
    }

    // 결과 생성
    const css = this.designCompiler._generateCSS();
    const javascript = this.designCompiler._generateJavaScript();
    const stats = this.designCompiler.getStats();

    return {
      css: css || '',
      javascript: javascript || '',
      stats: {
        ...stats,
        designBlockCount: this.module.designBlocks.length
      }
    };
  }

  /**
   * 개별 디자인 블록 컴파일
   *
   * Phase 10.3 Parser에서 생성된 DesignBlockDeclaration을
   * DesignCompiler가 이해할 수 있는 형식으로 변환하여 전달
   */
  private compileDesignBlock(block: DesignBlockDeclaration): void {
    // DesignBlockDeclaration → DesignCompiler 형식 변환
    const designBlock = this.convertBlockFormat(block);

    // DesignCompiler의 _compileBlock() 호출
    // 이것은 phase 9의 design-compiler.js와 동일한 형식
    this.designCompiler._compileBlock(designBlock);
  }

  /**
   * DesignBlockDeclaration을 DesignCompiler 형식으로 변환
   *
   * 입력 (Parser AST):
   *   DesignBlockDeclaration {
   *     type: 'animation' | 'glass' | '3d' | 'micro' | 'scroll'
   *     name?: string
   *     content: string
   *     line: number
   *     column: number
   *   }
   *
   * 출력 (DesignCompiler 형식):
   *   {
   *     type: 'animation' | 'glass' | 'transform3d' | 'micro' | 'scroll'
   *     name: string
   *     content: string
   *   }
   */
  private convertBlockFormat(block: DesignBlockDeclaration): any {
    // 타입 매핑: '3d' → 'transform3d'
    const typeMap: Record<string, string> = {
      'animation': 'animation',
      'glass': 'glass',
      '3d': 'transform3d',
      'micro': 'micro',
      'scroll': 'scroll'
    };

    const designType = typeMap[block.type] || block.type;

    // 블록 이름 결정
    let name = block.name;
    if (!name) {
      // 이름이 없으면 자동 생성
      if (!blockCounter[designType]) {
        blockCounter[designType] = 0;
      }
      name = `${designType}-${blockCounter[designType]++}`;
    }

    return {
      type: designType,
      name: name,
      content: block.content.trim()
    };
  }

  /**
   * 통계 조회
   */
  public getStats(): any {
    return this.designCompiler.getStats();
  }

  /**
   * 컴파일러 리셋
   */
  public reset(): void {
    this.designCompiler.reset();
  }

  /**
   * 디자인 블록 개수 반환
   */
  public getDesignBlockCount(): number {
    return this.module.designBlocks?.length ?? 0;
  }

  /**
   * 디자인 블록 타입별 개수
   */
  public getDesignBlocksByType(): Record<string, number> {
    const result: Record<string, number> = {
      animation: 0,
      glass: 0,
      '3d': 0,
      micro: 0,
      scroll: 0
    };

    if (!this.module.designBlocks) {
      return result;
    }

    for (const block of this.module.designBlocks) {
      result[block.type]++;
    }

    return result;
  }
}

// blockCounter는 클래스 변수로 사용
let blockCounter: Record<string, number> = {};

/**
 * DesignIntegration 싱글톤 팩토리
 *
 * Module AST에서 CSS + JS 생성 (한 번에)
 */
export function compileDesignBlocks(module: Module): { css: string; javascript: string; stats: any } {
  const integration = new DesignIntegration(module);
  return integration.compile();
}

/**
 * 여러 Module을 일괄 처리할 때
 */
export function compileMultipleDesignBlocks(modules: Module[]): Array<{ css: string; javascript: string }> {
  return modules.map(module => compileDesignBlocks(module));
}

export default DesignIntegration;
