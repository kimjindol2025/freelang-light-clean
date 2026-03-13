/**
 * Animation Engine
 * @animation 블록 파싱 및 CSS 키프레임 생성
 *
 * 기능:
 * - @animation 블록 파싱
 * - CSS 키프레임 생성
 * - JavaScript 트리거 바인딩
 * - 타이밍 함수 지원 (ease, ease-in, ease-out, linear)
 */

class AnimationEngine {
  constructor() {
    this.animations = new Map();
    this.keyframes = new Map();
    this.triggers = new Map();
  }

  /**
   * @animation 블록 파싱
   */
  parseAnimation(name, block) {
    const animation = {
      name,
      properties: {},
      duration: 200,
      timing: 'ease-out',
      delay: 0,
      iterations: 1,
    };

    // 블록 파싱
    const lines = block.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      switch (key.trim()) {
        case 'duration':
          animation.duration = parseInt(value);
          break;
        case 'timing':
          animation.timing = value;
          break;
        case 'delay':
          animation.delay = parseInt(value);
          break;
        case 'iterations':
          animation.iterations = value === 'infinite' ? 'infinite' : parseInt(value);
          break;
        default:
          // CSS 프로퍼티
          animation.properties[key.trim()] = value;
      }
    }

    this.animations.set(name, animation);
    this._generateKeyframes(name, animation);
    return animation;
  }

  /**
   * CSS 키프레임 생성
   * @private
   */
  _generateKeyframes(name, animation) {
    const keyframe = `@keyframes ${name} {
  0% {
    ${this._getCSSProperties(animation.properties, false)}
  }
  100% {
    ${this._getCSSProperties(animation.properties, true)}
  }
}`;

    this.keyframes.set(name, keyframe);
  }

  /**
   * CSS 프로퍼티 변환
   * @private
   */
  _getCSSProperties(props, isEndState) {
    const cssProps = [];

    for (const [key, value] of Object.entries(props)) {
      const cssProp = this._convertToCSS(key, value, isEndState);
      if (cssProp) cssProps.push(cssProp);
    }

    return cssProps.join('\n    ');
  }

  /**
   * FreeLang 프로퍼티를 CSS로 변환
   * @private
   */
  _convertToCSS(key, value, isEndState) {
    const trimmedValue = value.trim();

    // 화살표 표기법 (0 → 1)
    if (trimmedValue.includes('→')) {
      const [start, end] = trimmedValue.split('→').map(v => v.trim());
      const finalValue = isEndState ? end : start;
      return `${this._toCSSProperty(key)}: ${finalValue};`;
    }

    // 단순 값
    return `${this._toCSSProperty(key)}: ${trimmedValue};`;
  }

  /**
   * camelCase를 CSS 프로퍼티로 변환
   * @private
   */
  _toCSSProperty(camelCase) {
    // transform 관련 프로퍼티들
    const transformProps = ['scale', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'translate', 'skew'];

    if (transformProps.includes(camelCase)) {
      return 'transform';
    }

    return camelCase.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * 트리거 바인딩 (hover, click, scroll 등)
   */
  bindTrigger(selector, trigger, animationName) {
    const key = `${selector}:${trigger}`;
    this.triggers.set(key, {
      selector,
      trigger,
      animation: animationName,
      duration: this.animations.get(animationName)?.duration || 200,
      timing: this.animations.get(animationName)?.timing || 'ease-out',
    });
  }

  /**
   * JavaScript 이벤트 핸들러 생성
   */
  generateEventHandler(selector, trigger, animationName) {
    const animation = this.animations.get(animationName);
    if (!animation) return null;

    const duration = animation.duration;
    const timing = animation.timing;
    const iterations = animation.iterations;

    return `
const element = document.querySelector('${selector}');
if (element) {
  element.addEventListener('${trigger}', function() {
    this.style.animation = '${animationName} ${duration}ms ${timing} forwards';
    ${iterations === 'infinite' ? `this.style.animationIterationCount = 'infinite';` : ''}
  });
}`;
  }

  /**
   * 모든 CSS 키프레임 생성
   */
  generateAllKeyframes() {
    return Array.from(this.keyframes.values()).join('\n\n');
  }

  /**
   * 모든 이벤트 핸들러 생성
   */
  generateAllEventHandlers() {
    const handlers = [];

    for (const [key, trigger] of this.triggers.entries()) {
      const handler = this.generateEventHandler(
        trigger.selector,
        trigger.trigger,
        trigger.animation
      );
      if (handler) handlers.push(handler);
    }

    return handlers.join('\n\n');
  }

  /**
   * 통계
   */
  getStats() {
    return {
      totalAnimations: this.animations.size,
      totalKeyframes: this.keyframes.size,
      totalTriggers: this.triggers.size,
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.animations.clear();
    this.keyframes.clear();
    this.triggers.clear();
  }
}

module.exports = AnimationEngine;
