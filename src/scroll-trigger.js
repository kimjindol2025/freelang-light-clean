/**
 * Scroll Trigger System
 * @scroll 블록 처리 및 스크롤 기반 애니메이션
 *
 * 기능:
 * - @scroll 블록 파싱
 * - Intersection Observer 통합
 * - 스크롤 트리거 애니메이션
 * - 오프셋 및 타이밍 제어
 */

class ScrollTriggerSystem {
  constructor() {
    this.triggers = new Map();
    this.intersectionObservers = new Map();
  }

  /**
   * @scroll 블록 파싱
   */
  parseScrollTrigger(name, block) {
    const trigger = {
      name,
      selector: null,
      triggerEvent: 'enter-viewport',
      animation: null,
      duration: 500,
      offset: 0,
      once: false,
      delay: 0,
    };

    const lines = block.trim().split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      const keyTrimmed = key.trim();

      switch (keyTrimmed) {
        case 'selector':
          trigger.selector = value.replace(/['"]/g, '');
          break;
        case 'trigger':
          trigger.triggerEvent = value;
          break;
        case 'animation':
          trigger.animation = value;
          break;
        case 'duration':
          trigger.duration = parseInt(value);
          break;
        case 'offset':
          trigger.offset = parseInt(value);
          break;
        case 'once':
          trigger.once = value === 'true';
          break;
        case 'delay':
          trigger.delay = parseInt(value);
          break;
      }
    }

    this.triggers.set(name, trigger);
    return trigger;
  }

  /**
   * Intersection Observer 설정
   */
  setupIntersectionObserver(name) {
    const trigger = this.triggers.get(name);
    if (!trigger) return null;

    const options = {
      root: null,
      rootMargin: `${trigger.offset}px`,
      threshold: 0.1,
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this._triggerAnimation(entry.target, trigger);

          if (trigger.once) {
            observer.unobserve(entry.target);
          }
        }
      });
    };

    const observer = new (typeof IntersectionObserver !== 'undefined'
      ? IntersectionObserver
      : class {})( callback, options);

    this.intersectionObservers.set(name, observer);
    return observer;
  }

  /**
   * 애니메이션 트리거
   * @private
   */
  _triggerAnimation(element, trigger) {
    if (trigger.delay > 0) {
      setTimeout(() => {
        element.style.animation = `${trigger.animation} ${trigger.duration}ms ease-out forwards`;
      }, trigger.delay);
    } else {
      element.style.animation = `${trigger.animation} ${trigger.duration}ms ease-out forwards`;
    }
  }

  /**
   * 스크롤 트리거 JavaScript 생성
   */
  generateJavaScript(name) {
    const trigger = this.triggers.get(name);
    if (!trigger) return null;

    return `
const scrollTrigger_${name} = {
  selector: '${trigger.selector}',
  animation: '${trigger.animation}',
  duration: ${trigger.duration},
  offset: ${trigger.offset},
  delay: ${trigger.delay},
  once: ${trigger.once},
};

if ('IntersectionObserver' in window) {
  const options = {
    root: null,
    rootMargin: '${trigger.offset}px',
    threshold: 0.1
  };

  const callback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (scrollTrigger_${name}.delay > 0) {
          setTimeout(() => {
            el.style.animation = '${trigger.animation} ${trigger.duration}ms ease-out forwards';
          }, scrollTrigger_${name}.delay);
        } else {
          el.style.animation = '${trigger.animation} ${trigger.duration}ms ease-out forwards';
        }
        
        if (scrollTrigger_${name}.once) {
          observer.unobserve(el);
        }
      }
    });
  };

  const observer = new IntersectionObserver(callback, options);
  const elements = document.querySelectorAll(scrollTrigger_${name}.selector);
  elements.forEach(el => observer.observe(el));
}`;
  }

  /**
   * 모든 트리거 JavaScript 생성
   */
  generateAll() {
    const scripts = [];

    for (const [name] of this.triggers) {
      const script = this.generateJavaScript(name);
      if (script) scripts.push(script);
    }

    return scripts.join('\n\n');
  }

  /**
   * 통계
   */
  getStats() {
    return {
      totalTriggers: this.triggers.size,
      totalObservers: this.intersectionObservers.size,
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.triggers.clear();
    this.intersectionObservers.clear();
  }
}

module.exports = ScrollTriggerSystem;
