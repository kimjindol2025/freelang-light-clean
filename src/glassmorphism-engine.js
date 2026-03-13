/**
 * Glassmorphism Engine
 * @glass 블록 처리 및 Glassmorphism CSS 생성
 *
 * 기능:
 * - @glass 블록 파싱
 * - Backdrop-filter CSS 생성
 * - 상태별 스타일 변환 (normal, hover, active)
 * - 투명도 및 블러 효과 조합
 */

class GlassmorphismEngine {
  constructor() {
    this.components = new Map();
    this.styles = new Map();
  }

  /**
   * @glass 블록 파싱
   */
  parseGlass(name, block) {
    const glass = {
      name,
      base: {},
      states: {},
    };

    const lines = block.trim().split('\n');
    let currentState = 'base';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      // 상태 감지 (@glass:hover, @glass:active)
      if (trimmed.startsWith('@glass:')) {
        currentState = trimmed.split(':')[1];
        glass.states[currentState] = {};
        continue;
      }

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      if (currentState === 'base') {
        glass.base[key.trim()] = value;
      } else {
        if (!glass.states[currentState]) glass.states[currentState] = {};
        glass.states[currentState][key.trim()] = value;
      }
    }

    this.components.set(name, glass);
    this._generateGlassStyles(name, glass);
    return glass;
  }

  /**
   * Glassmorphism CSS 생성
   * @private
   */
  _generateGlassStyles(name, glass) {
    let css = `.glass-${name} {\n`;

    // 기본 스타일
    css += this._buildCSSBlock(glass.base, 2);
    css += '\n}\n';

    // 상태별 스타일
    for (const [state, props] of Object.entries(glass.states)) {
      css += `\n.glass-${name}:${state} {\n`;
      css += this._buildCSSBlock({ ...glass.base, ...props }, 2);
      css += '\n}\n';
    }

    this.styles.set(name, css);
  }

  /**
   * CSS 블록 생성
   * @private
   */
  _buildCSSBlock(props, indent = 2) {
    const indentStr = ' '.repeat(indent);
    const lines = [];

    for (const [key, value] of Object.entries(props)) {
      lines.push(`${indentStr}${this._toCSSProperty(key)}: ${value};`);
    }

    return lines.join('\n');
  }

  /**
   * camelCase를 CSS 프로퍼티로 변환
   * @private
   */
  _toCSSProperty(camelCase) {
    return camelCase.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * 사전 정의된 Glassmorphism 프리셋
   */
  static getPreset(name) {
    const presets = {
      light: {
        base: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        },
        hover: {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 48px rgba(31, 38, 135, 0.5)',
        },
      },
      dark: {
        base: {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
        hover: {
          background: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
        },
      },
      card: {
        base: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '16px',
          transition: 'all 0.3s ease',
        },
        hover: {
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
        },
      },
      button: {
        base: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        },
        hover: {
          background: 'rgba(255, 255, 255, 0.2)',
          transform: 'scale(1.05)',
          backdropFilter: 'blur(15px)',
        },
        active: {
          transform: 'scale(0.95)',
        },
      },
    };

    return presets[name];
  }

  /**
   * 모든 CSS 생성
   */
  generateAllStyles() {
    return Array.from(this.styles.values()).join('\n');
  }

  /**
   * 통계
   */
  getStats() {
    return {
      totalComponents: this.components.size,
      totalStyles: this.styles.size,
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.components.clear();
    this.styles.clear();
  }
}

module.exports = GlassmorphismEngine;
