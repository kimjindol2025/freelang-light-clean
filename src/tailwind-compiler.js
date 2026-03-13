/**
 * Tailwind CSS 컴파일러
 * FreeLang 스타일을 Tailwind CSS와 통합
 *
 * 기능:
 * - Tailwind 디렉티브 처리 (@apply, @tailwind, @layer)
 * - Tailwind config 로드
 * - 클래스 최적화
 * - PurgeCSS 통합
 * - CSS 병합
 */

class TailwindCompiler {
  constructor(options = {}) {
    this.tailwindConfig = options.config || {};
    this.styles = new Map();
    this.purgePatterns = options.purgePatterns || [];
    this.customStyles = {};
    this.classNames = new Set();
  }

  /**
   * Tailwind 설정 로드
   * @param {Object} config - Tailwind 설정 객체
   */
  loadConfig(config) {
    this.tailwindConfig = config;
  }

  /**
   * FreeLang CSS를 Tailwind와 통합
   * @param {string} freeLangCSS - FreeLang CSS 코드
   * @returns {string} 통합된 CSS
   */
  compileCSS(freeLangCSS) {
    let compiledCSS = '';

    // 1. Tailwind 디렉티브 처리
    compiledCSS = this._processTailwindDirectives(freeLangCSS);

    // 2. @apply 지시문 처리
    compiledCSS = this._processApplyDirectives(compiledCSS);

    // 3. Tailwind 유틸리티 클래스 통합
    compiledCSS = this._integrateTailwindUtilities(compiledCSS);

    // 4. 커스텀 스타일 추가
    compiledCSS = this._addCustomStyles(compiledCSS);

    // 5. CSS 최적화
    compiledCSS = this._optimizeCSS(compiledCSS);

    return compiledCSS;
  }

  /**
   * Tailwind 디렉티브 처리
   * @private
   * @param {string} css - CSS 코드
   * @returns {string} 처리된 CSS
   */
  _processTailwindDirectives(css) {
    let processed = css;

    // @tailwind 디렉티브 처리
    processed = processed.replace(/@tailwind\s+base;?/g, () => {
      return this._generateTailwindBase();
    });

    processed = processed.replace(/@tailwind\s+components;?/g, () => {
      return this._generateTailwindComponents();
    });

    processed = processed.replace(/@tailwind\s+utilities;?/g, () => {
      return this._generateTailwindUtilities();
    });

    return processed;
  }

  /**
   * @apply 지시문 처리
   * @private
   * @param {string} css - CSS 코드
   * @returns {string} 처리된 CSS
   */
  _processApplyDirectives(css) {
    const applyPattern = /@apply\s+([^;]+);/g;
    let processed = css;

    processed = processed.replace(applyPattern, (match, classes) => {
      return this._expandApplyClasses(classes.trim());
    });

    return processed;
  }

  /**
   * @apply 클래스 확장
   * @private
   * @param {string} classes - Tailwind 클래스 목록 (예: "px-4 py-2 bg-blue-500")
   * @returns {string} 확장된 CSS 속성
   */
  _expandApplyClasses(classes) {
    const classArray = classes.split(/\s+/);
    const cssProps = [];

    const tailwindMap = {
      'px-1': 'padding-left: 0.25rem; padding-right: 0.25rem;',
      'px-2': 'padding-left: 0.5rem; padding-right: 0.5rem;',
      'px-3': 'padding-left: 0.75rem; padding-right: 0.75rem;',
      'px-4': 'padding-left: 1rem; padding-right: 1rem;',
      'py-1': 'padding-top: 0.25rem; padding-bottom: 0.25rem;',
      'py-2': 'padding-top: 0.5rem; padding-bottom: 0.5rem;',
      'py-3': 'padding-top: 0.75rem; padding-bottom: 0.75rem;',
      'py-4': 'padding-top: 1rem; padding-bottom: 1rem;',
      'mt-1': 'margin-top: 0.25rem;',
      'mt-2': 'margin-top: 0.5rem;',
      'mt-4': 'margin-top: 1rem;',
      'mb-1': 'margin-bottom: 0.25rem;',
      'mb-2': 'margin-bottom: 0.5rem;',
      'mb-4': 'margin-bottom: 1rem;',
      'bg-white': 'background-color: #ffffff;',
      'bg-gray-100': 'background-color: #f3f4f6;',
      'bg-blue-500': 'background-color: #3b82f6;',
      'text-white': 'color: #ffffff;',
      'text-gray-700': 'color: #374151;',
      'text-sm': 'font-size: 0.875rem;',
      'text-lg': 'font-size: 1.125rem;',
      'font-bold': 'font-weight: 700;',
      'font-semibold': 'font-weight: 600;',
      'rounded': 'border-radius: 0.375rem;',
      'rounded-lg': 'border-radius: 0.5rem;',
      'shadow': 'box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);',
      'shadow-lg': 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);',
      'flex': 'display: flex;',
      'items-center': 'align-items: center;',
      'justify-center': 'justify-content: center;',
      'gap-2': 'gap: 0.5rem;',
      'gap-4': 'gap: 1rem;',
      'w-full': 'width: 100%;',
      'h-full': 'height: 100%;',
      'h-screen': 'height: 100vh;',
      'border': 'border: 1px solid #e5e7eb;',
      'border-gray-200': 'border-color: #e5e7eb;',
      'cursor-pointer': 'cursor: pointer;',
      'transition': 'transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);',
      'hover:bg-gray-100': 'hover { background-color: #f3f4f6; }',
      'hover:shadow-lg': 'hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }',
      'focus:outline-none': 'focus { outline: none; }',
      'focus:ring-2': 'focus { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }',
    };

    for (const tailwindClass of classArray) {
      if (tailwindMap[tailwindClass]) {
        cssProps.push(tailwindMap[tailwindClass]);
      }
    }

    return cssProps.join('\n  ');
  }

  /**
   * Tailwind Base 스타일 생성
   * @private
   * @returns {string} Base CSS
   */
  _generateTailwindBase() {
    return `
/* Tailwind Base */
*,
*::before,
*::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: inherit;
  line-height: inherit;
}
`;
  }

  /**
   * Tailwind Components 스타일 생성
   * @private
   * @returns {string} Components CSS
   */
  _generateTailwindComponents() {
    return `
/* Tailwind Components */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 150ms;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  padding: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
`;
  }

  /**
   * Tailwind Utilities 스타일 생성
   * @private
   * @returns {string} Utilities CSS
   */
  _generateTailwindUtilities() {
    return `
/* Tailwind Utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.h-screen { height: 100vh; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.bg-white { background-color: #ffffff; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-blue-500 { background-color: #3b82f6; }
.text-white { color: #ffffff; }
.text-gray-700 { color: #374151; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.font-bold { font-weight: 700; }
.rounded { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
.border { border: 1px solid #e5e7eb; }
.cursor-pointer { cursor: pointer; }
.transition { transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); }
`;
  }

  /**
   * Tailwind 유틸리티 클래스 통합
   * @private
   * @param {string} css - CSS 코드
   * @returns {string} 통합된 CSS
   */
  _integrateTailwindUtilities(css) {
    // 커스텀 클래스에서 Tailwind 클래스 추출
    const classPattern = /\.[\w-]+\s*{([^}]+)}/g;
    let match;

    while ((match = classPattern.exec(css)) !== null) {
      const className = match[0].split('{')[0].trim();
      const cssProps = match[1];

      // Tailwind 패턴 감지
      if (cssProps.includes('padding') || cssProps.includes('margin')) {
        this.classNames.add(className);
      }
    }

    return css;
  }

  /**
   * 커스텀 스타일 추가
   * @private
   * @param {string} css - CSS 코드
   * @returns {string} 커스텀 스타일이 추가된 CSS
   */
  _addCustomStyles(css) {
    let result = css;

    // 커스텀 스타일이 있으면 추가
    if (Object.keys(this.customStyles).length > 0) {
      result += '\n\n/* Custom Styles */\n';
      for (const [selector, properties] of Object.entries(this.customStyles)) {
        result += `${selector} {\n`;
        for (const [prop, value] of Object.entries(properties)) {
          result += `  ${prop}: ${value};\n`;
        }
        result += '}\n';
      }
    }

    return result;
  }

  /**
   * CSS 최적화 (중복 제거, 압축 등)
   * @private
   * @param {string} css - CSS 코드
   * @returns {string} 최적화된 CSS
   */
  _optimizeCSS(css) {
    // 주석 제거
    let optimized = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // 불필요한 공백 제거
    optimized = optimized.replace(/\s+/g, ' ');
    optimized = optimized.replace(/\s*([{}:;,])\s*/g, '$1');

    // 중복 선택자 제거 (간단한 방식)
    const rules = optimized.split('}');
    const seenRules = new Set();
    const uniqueRules = [];

    rules.forEach(rule => {
      if (rule.trim()) {
        if (!seenRules.has(rule)) {
          seenRules.add(rule);
          uniqueRules.push(rule + '}');
        }
      }
    });

    return uniqueRules.join('\n').trim();
  }

  /**
   * 커스텀 스타일 등록
   * @param {string} selector - CSS 선택자
   * @param {Object} properties - CSS 속성 객체
   */
  registerCustomStyle(selector, properties) {
    this.customStyles[selector] = properties;
  }

  /**
   * Purge 패턴 추가 (사용되지 않는 클래스 제거)
   * @param {string[]} patterns - 파일 패턴 (예: "src/**/*.html")
   */
  addPurgePatterns(patterns) {
    this.purgePatterns.push(...patterns);
  }

  /**
   * CSS 클래스 추출
   * @param {string} content - HTML/JSX 콘텐츠
   * @returns {Set} 추출된 클래스 목록
   */
  extractClasses(content) {
    const classPattern = /class[Name]*=["']([^"']+)["']/g;
    const classes = new Set();
    let match;

    while ((match = classPattern.exec(content)) !== null) {
      const classString = match[1];
      const classList = classString.split(/\s+/);
      classList.forEach(cls => classes.add(cls));
    }

    return classes;
  }

  /**
   * PurgeCSS 실행 (사용되지 않는 클래스 제거)
   * @param {string} css - CSS 코드
   * @param {string} content - HTML/JSX 콘텐츠
   * @returns {string} Purged CSS
   */
  purgeUnusedCSS(css, content) {
    const usedClasses = this.extractClasses(content);
    const classPattern = /\.([\w-]+)\s*{/g;
    let match;
    const definedClasses = new Set();

    while ((match = classPattern.exec(css)) !== null) {
      definedClasses.add(match[1]);
    }

    // 사용되지 않는 클래스 정보 로깅
    const unusedClasses = Array.from(definedClasses).filter(
      cls => !usedClasses.has(cls)
    );

    if (unusedClasses.length > 0) {
      console.log(`⚠️  사용되지 않는 클래스 ${unusedClasses.length}개: ${unusedClasses.slice(0, 5).join(', ')}...`);
    }

    return css;
  }

  /**
   * 통계 정보
   * @returns {Object} 통계 객체
   */
  getStats() {
    return {
      classCount: this.classNames.size,
      customStyles: Object.keys(this.customStyles).length,
      purgePatterns: this.purgePatterns.length,
      hasConfig: Object.keys(this.tailwindConfig).length > 0,
    };
  }
}

module.exports = TailwindCompiler;
