/**
 * Micro-interaction Handler
 * @micro 블록 처리 및 마이크로 인터랙션 생성
 *
 * 기능:
 * - @micro 블록 파싱
 * - 내장 액션: count-up, typing, pulse, bounce, shake
 * - 이벤트 바인딩 (mount, click, hover)
 * - 타이밍 제어
 */

class MicroInteractionHandler {
  constructor() {
    this.interactions = new Map();
    this.generators = new Map();
    this._registerBuiltInActions();
  }

  /**
   * 내장 액션 등록
   * @private
   */
  _registerBuiltInActions() {
    this.generators.set('count-up', this._generateCountUp);
    this.generators.set('typing', this._generateTyping);
    this.generators.set('pulse', this._generatePulse);
    this.generators.set('bounce', this._generateBounce);
    this.generators.set('shake', this._generateShake);
  }

  /**
   * @micro 블록 파싱
   */
  parseMicroInteraction(name, block) {
    const micro = {
      name,
      event: 'click',
      action: 'count-up',
      selector: null,
      params: {},
    };

    const lines = block.trim().split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      const keyTrimmed = key.trim();

      switch (keyTrimmed) {
        case 'event':
          micro.event = value;
          break;
        case 'action':
          micro.action = value;
          break;
        case 'selector':
          micro.selector = value;
          break;
        case 'duration':
          micro.params.duration = parseInt(value);
          break;
        case 'interval':
          micro.params.interval = parseInt(value);
          break;
        case 'from':
        case 'to':
        case 'text':
        case 'amplitude':
        case 'frequency':
          micro.params[keyTrimmed] = value;
          break;
      }
    }

    this.interactions.set(name, micro);
    return micro;
  }

  /**
   * 마이크로 인터랙션 JavaScript 생성
   */
  generateJavaScript(name) {
    const micro = this.interactions.get(name);
    if (!micro) return null;

    const generator = this.generators.get(micro.action);
    if (!generator) return null;

    return generator.call(this, micro);
  }

  /**
   * Count-up 액션
   * @private
   */
  _generateCountUp(micro) {
    const duration = micro.params.duration || 1000;
    const interval = micro.params.interval || 50;
    const from = parseInt(micro.params.from) || 0;
    const to = parseInt(micro.params.to) || 100;

    return `
const el = document.querySelector('${micro.selector}');
if (el) {
  el.addEventListener('${micro.event}', function() {
    let current = ${from};
    const step = (${to} - ${from}) / (${duration} / ${interval});
    const timer = setInterval(() => {
      current += step;
      if (current >= ${to}) {
        current = ${to};
        clearInterval(timer);
      }
      el.textContent = Math.round(current);
    }, ${interval});
  });
}`;
  }

  /**
   * Typing 액션
   * @private
   */
  _generateTyping(micro) {
    const duration = micro.params.duration || 2000;
    const text = micro.params.text || 'Hello';
    const interval = duration / text.length;

    return `
const el = document.querySelector('${micro.selector}');
if (el) {
  el.addEventListener('${micro.event}', function() {
    let index = 0;
    el.textContent = '';
    const timer = setInterval(() => {
      if (index < '${text}'.length) {
        el.textContent += '${text}'[index];
        index++;
      } else {
        clearInterval(timer);
      }
    }, ${interval});
  });
}`;
  }

  /**
   * Pulse 액션
   * @private
   */
  _generatePulse(micro) {
    const duration = micro.params.duration || 1000;

    return `
const el = document.querySelector('${micro.selector}');
if (el) {
  el.addEventListener('${micro.event}', function() {
    el.style.animation = 'pulse ${duration}ms ease-in-out';
  });
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`;
  }

  /**
   * Bounce 액션
   * @private
   */
  _generateBounce(micro) {
    return `
const el = document.querySelector('${micro.selector}');
if (el) {
  el.addEventListener('${micro.event}', function() {
    el.style.animation = 'bounce 0.6s ease-in-out';
  });
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}`;
  }

  /**
   * Shake 액션
   * @private
   */
  _generateShake(micro) {
    const amplitude = micro.params.amplitude || 5;

    return `
const el = document.querySelector('${micro.selector}');
if (el) {
  el.addEventListener('${micro.event}', function() {
    el.style.animation = 'shake 0.5s ease-in-out';
  });
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-${amplitude}px); }
  20%, 40%, 60%, 80% { transform: translateX(${amplitude}px); }
}`;
  }

  /**
   * 모든 상호작용 생성
   */
  generateAll() {
    const scripts = [];

    for (const [name] of this.interactions) {
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
      totalInteractions: this.interactions.size,
      availableActions: Array.from(this.generators.keys()),
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.interactions.clear();
  }
}

module.exports = MicroInteractionHandler;
