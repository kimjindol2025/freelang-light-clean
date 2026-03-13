/**
 * SSR Engine (서버사이드 렌더링)
 * 서버에서 컴포넌트를 HTML로 렌더링
 *
 * 기능:
 * - 컴포넌트 렌더링
 * - 초기 상태 직렬화
 * - 클라이언트 하이드레이션
 */

class SSREngine {
  constructor() {
    this.components = new Map();
    this.renderedComponents = [];
  }

  /**
   * 컴포넌트 등록
   */
  registerComponent(name, component) {
    this.components.set(name, component);
  }

  /**
   * 컴포넌트 렌더링
   */
  async renderComponent(name, props = {}, state = {}) {
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Component "${name}" not found`);
    }

    const context = { props, state };

    const html = await this._renderHTML(component, context);
    const renderedData = {
      name,
      props,
      state,
      html,
      timestamp: Date.now(),
    };

    this.renderedComponents.push(renderedData);
    return html;
  }

  /**
   * HTML 렌더링
   * @private
   */
  async _renderHTML(component, context) {
    let html = '';

    if (typeof component.render === 'function') {
      html = await component.render(context);
    } else if (typeof component === 'function') {
      html = await component(context);
    } else {
      html = `<div>${JSON.stringify(component)}</div>`;
    }

    return html;
  }

  /**
   * 초기 상태 직렬화
   */
  serializeState(state) {
    return JSON.stringify(state);
  }

  /**
   * 하이드레이션 스크립트 생성
   */
  generateHydrationScript(initialState) {
    const serialized = this.serializeState(initialState);
    return `<script>window.__INITIAL_STATE__ = ${serialized};</script>`;
  }

  /**
   * 완전한 HTML 페이지 생성
   */
  async renderFullPage(title, component, props, state) {
    const componentHTML = await this.renderComponent(
      component,
      props,
      state
    );

    const hydrationScript = this.generateHydrationScript(state);

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body>
    <div id="app">${componentHTML}</div>
    ${hydrationScript}
  </body>
</html>`;

    return html;
  }

  /**
   * 렌더링 통계
   */
  getStats() {
    return {
      registeredComponents: this.components.size,
      renderedCount: this.renderedComponents.length,
      lastRendered: this.renderedComponents[this.renderedComponents.length - 1]
        ?.timestamp,
    };
  }
}

/**
 * Hydration - 클라이언트 하이드레이션
 */
class Hydration {
  constructor(initialState) {
    this.initialState = initialState;
    this.mounted = false;
  }

  /**
   * 클라이언트에서 상태 복원
   */
  async initialize(appElement, components) {
    // 서버에서 렌더링된 HTML 유지
    this.appElement = appElement;

    // 이벤트 리스너 재연결
    await this._reattachEventListeners(appElement, components);

    this.mounted = true;
    return this.initialState;
  }

  /**
   * 이벤트 리스너 재연결
   * @private
   */
  async _reattachEventListeners(element, components) {
    // 모든 이벤트 위임 등록
    const eventTypes = [
      'click',
      'change',
      'submit',
      'input',
      'focus',
      'blur',
    ];

    for (const eventType of eventTypes) {
      element.addEventListener(eventType, (event) => {
        // 이벤트 처리
        const handler = event.target.getAttribute(`on${eventType}`);
        if (handler && components[handler]) {
          components[handler](event);
        }
      });
    }
  }

  /**
   * 상태 동기화
   */
  syncState(newState) {
    Object.assign(this.initialState, newState);
  }

  /**
   * 마운트 여부
   */
  isMounted() {
    return this.mounted;
  }
}

module.exports = SSREngine;
module.exports.Hydration = Hydration;
