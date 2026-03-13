/**
 * Vue Component Adapter
 * FreeLang 컴포넌트를 Vue.js와 호환되도록 변환
 *
 * 기능:
 * - Props 변환 (FreeLang → Vue props)
 * - Markup을 Vue template으로 변환
 * - Event handlers 처리
 * - Slot 지원
 * - 양방향 바인딩 (v-model)
 */

class VueComponentAdapter {
  constructor(freelangComponent) {
    this.component = freelangComponent;
    this.name = freelangComponent.name;
    this.props = freelangComponent.props || {};
    this.style = freelangComponent.style || '';
    this.markup = freelangComponent.markup || '';
    this.script = freelangComponent.script || '';
    this.events = new Map();
  }

  /**
   * Props 정의를 Vue props로 변환
   * @returns {Object} Vue props 스펙
   */
  getVueProps() {
    const vueProps = {};

    for (const [propName, propDef] of Object.entries(this.props)) {
      const vuePropsSpec = {
        type: this._mapTypeToVueType(propDef.type),
      };

      // 기본값 설정
      if (propDef.default !== undefined) {
        vuePropsSpec.default = propDef.default;
      }

      // required 설정
      if (propDef.required !== false) {
        vuePropsSpec.required = true;
      }

      // validator 추가
      if (propDef.validator) {
        vuePropsSpec.validator = propDef.validator;
      }

      vueProps[propName] = vuePropsSpec;
    }

    return vueProps;
  }

  /**
   * FreeLang 타입을 Vue 타입으로 매핑
   * @param {string} type - FreeLang 타입
   * @returns {Function} Vue 타입
   */
  _mapTypeToVueType(type) {
    const typeMap = {
      'string': String,
      'number': Number,
      'boolean': Boolean,
      'object': Object,
      'array': Array,
      'bool': Boolean,
      'int': Number,
      'float': Number,
    };
    return typeMap[type] || String;
  }

  /**
   * 마크업을 Vue template으로 변환
   * @returns {string} Vue template 문자열
   */
  getVueTemplate() {
    let template = this.markup;

    // Props 바인딩: {prop} → {{ prop }}
    template = template.replace(/\{([^}]+)\}/g, '{{ $1 }}');

    // 조건부 렌더링: if condition { ... } → v-if
    template = template.replace(
      /if\s+(\w+)\s*\{([^}]+)\}/g,
      '<template v-if="$1">$2</template>'
    );

    // 반복: for item in items { ... } → v-for
    template = template.replace(
      /for\s+(\w+)\s+in\s+(\w+)\s*\{([^}]+)\}/g,
      '<template v-for="$1 in $2" :key="$1"><template>$3</template></template>'
    );

    // Event handlers: onclick → @click
    template = template.replace(/on(\w+)=/g, '@${this._camelToKebab($1)}=');
    template = template.replace(/@(\w+)="(\w+)\(\)"/g, '@$1="$2"');

    // Slot 지원: <slot /> 유지
    // template은 이미 <slot /> 형식이므로 추가 처리 불필요

    // v-model 지원: bind:value → v-model
    template = template.replace(/bind:value=/g, 'v-model:value=');

    return template;
  }

  /**
   * camelCase를 kebab-case로 변환
   * @param {string} str - 변환할 문자열
   * @returns {string} kebab-case 문자열
   */
  _camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * CSS를 Vue scoped style로 변환
   * @returns {string} Vue scoped style 문자열
   */
  getVueStyle() {
    // scoped 속성을 추가하고 스타일을 그대로 반환
    // Vue는 자동으로 scoped 속성을 처리함
    return this.style;
  }

  /**
   * Vue 컴포넌트 객체 생성
   * @returns {Object} Vue 컴포넌트 정의
   */
  toVueComponent() {
    const vueComponent = {
      name: this.name,
      template: this.getVueTemplate(),
      props: this.getVueProps(),
      data() {
        return {
          // FreeLang 스크립트에서 선언된 데이터
          ...(this._parseData()),
        };
      },
      methods: this._parseMethods(),
      computed: this._parseComputed(),
      watch: this._parseWatchers(),
      mounted() {
        // 라이프사이클 후크
        this.$emit('mounted');
      },
      beforeUnmount() {
        this.$emit('beforeUnmount');
      },
    };

    return vueComponent;
  }

  /**
   * Vue 단일 파일 컴포넌트 (SFC) 생성
   * @returns {string} Vue SFC (.vue) 형식
   */
  toVueSFC() {
    const template = `<template>
  ${this.getVueTemplate()}
</template>`;

    const script = `<script>
export default {
  name: '${this.name}',
  props: ${JSON.stringify(this.getVueProps(), null, 2)},
  ${this.script ? `methods: {\n${this._indentCode(this.script)}\n},` : ''}
}
</script>`;

    const style = `<style scoped>
${this.getVueStyle()}
</style>`;

    return `${template}

${script}

${style}`;
  }

  /**
   * 코드를 들여쓰기
   * @param {string} code - 들여쓸 코드
   * @param {number} spaces - 들여쓰기 공간
   * @returns {string} 들여쓴 코드
   */
  _indentCode(code, spaces = 2) {
    const indent = ' '.repeat(spaces);
    return code
      .split('\n')
      .map(line => indent + line)
      .join('\n');
  }

  /**
   * 스크립트에서 데이터 변수 추출
   * @returns {Object} 데이터 객체
   */
  _parseData() {
    const data = {};
    // 간단한 정규식으로 변수 선언 추출
    const varPattern = /let\s+(\w+)\s*=\s*([^;]+);/g;
    let match;
    while ((match = varPattern.exec(this.script)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();
      data[varName] = this._parseValue(varValue);
    }
    return data;
  }

  /**
   * 값을 JavaScript 값으로 파싱
   * @param {string} str - 파싱할 문자열
   * @returns {*} 파싱된 값
   */
  _parseValue(str) {
    try {
      // JSON.parse 시도
      return JSON.parse(str);
    } catch {
      // 실패하면 문자열로 반환
      return str.replace(/['"`]/g, '');
    }
  }

  /**
   * 스크립트에서 메서드 추출
   * @returns {Object} 메서드 객체
   */
  _parseMethods() {
    const methods = {};
    // 함수 선언 패턴 추출
    const funcPattern = /function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = funcPattern.exec(this.script)) !== null) {
      const funcName = match[1];
      const funcBody = match[3];
      methods[funcName] = new Function(funcBody);
    }
    return methods;
  }

  /**
   * 계산 속성 추출
   * @returns {Object} 계산 속성 객체
   */
  _parseComputed() {
    // computed 패턴 추출 가능
    return {};
  }

  /**
   * Watcher 추출
   * @returns {Object} Watcher 객체
   */
  _parseWatchers() {
    // watcher 패턴 추출 가능
    return {};
  }

  /**
   * 이벤트 핸들러 등록
   * @param {string} eventName - 이벤트 이름
   * @param {Function} handler - 핸들러 함수
   */
  registerEventHandler(eventName, handler) {
    this.events.set(eventName, handler);
  }

  /**
   * 이벤트 핸들러 조회
   * @param {string} eventName - 이벤트 이름
   * @returns {Function|undefined} 핸들러 함수
   */
  getEventHandler(eventName) {
    return this.events.get(eventName);
  }

  /**
   * Vue Composition API용 setup 함수 생성
   * @returns {string} setup 함수 코드
   */
  toVueSetup() {
    return `
export default {
  name: '${this.name}',
  props: ${JSON.stringify(this.getVueProps(), null, 2)},
  setup(props, { emit, slots }) {
    // 상태 및 메서드 정의
    ${this._parseData()}

    return {
      // 반환할 상태 및 메서드
    }
  }
}
`;
  }

  /**
   * 호환성 검사
   * @returns {Object} 호환성 정보
   */
  checkCompatibility() {
    const issues = [];

    // Props 검사
    for (const [name, def] of Object.entries(this.props)) {
      if (!def.type) {
        issues.push(`Props "${name}" 타입이 정의되지 않았습니다`);
      }
    }

    // 마크업 검사
    if (!this.markup) {
      issues.push('Markup이 정의되지 않았습니다');
    }

    // 지원하지 않는 문법 검사
    if (this.markup.includes('v-')) {
      issues.push('Vue 디렉티브(v-)를 FreeLang에서 직접 사용할 수 없습니다');
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings: [],
      info: {
        componentName: this.name,
        propsCount: Object.keys(this.props).length,
        hasStyle: Boolean(this.style),
        hasScript: Boolean(this.script),
      },
    };
  }

  /**
   * 마이그레이션 가이드 생성
   * @returns {string} 마이그레이션 가이드
   */
  getMigrationGuide() {
    const guide = `
# ${this.name} Vue 마이그레이션 가이드

## Props 정의
\`\`\`vue
props: ${JSON.stringify(this.getVueProps(), null, 2)}
\`\`\`

## Template
\`\`\`vue
<template>
${this.getVueTemplate()}
</template>
\`\`\`

## Style (Scoped)
\`\`\`vue
<style scoped>
${this.getVueStyle()}
</style>
\`\`\`

## 사용 예제
\`\`\`vue
<${this.name} ${Object.keys(this.props).map(p => `:${p}="prop${p}"`).join(' ')} />
\`\`\`
`;
    return guide;
  }
}

module.exports = VueComponentAdapter;
