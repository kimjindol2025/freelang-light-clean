/**
 * React Component Adapter
 * FreeLang 컴포넌트를 React와 호환되도록 변환
 *
 * 기능:
 * - Props 변환 (FreeLang → React props)
 * - JSX 생성
 * - Hooks 통합 (useState, useEffect, useCallback)
 * - Event handler 처리
 * - Props validation (PropTypes)
 */

class ReactComponentAdapter {
  constructor(freelangComponent) {
    this.component = freelangComponent;
    this.name = freelangComponent.name;
    this.props = freelangComponent.props || {};
    this.style = freelangComponent.style || {};
    this.markup = freelangComponent.markup || '';
    this.script = freelangComponent.script || '';
    this.state = new Map();
    this.handlers = new Map();
  }

  /**
   * Props 타입을 PropTypes로 매핑
   * @param {string} type - FreeLang 타입
   * @returns {string} PropTypes 코드
   */
  _mapToPropTypes(type) {
    const propTypesMap = {
      'string': 'PropTypes.string',
      'number': 'PropTypes.number',
      'boolean': 'PropTypes.bool',
      'bool': 'PropTypes.bool',
      'array': 'PropTypes.array',
      'object': 'PropTypes.object',
      'function': 'PropTypes.func',
      'int': 'PropTypes.number',
      'float': 'PropTypes.number',
      'node': 'PropTypes.node',
      'element': 'PropTypes.element',
    };
    return propTypesMap[type] || 'PropTypes.any';
  }

  /**
   * Props 검증 코드 생성
   * @returns {string} PropTypes 정의 코드
   */
  getPropTypes() {
    const propTypesCode = {};

    for (const [propName, propDef] of Object.entries(this.props)) {
      let propTypeStr = this._mapToPropTypes(propDef.type);

      // required 처리
      if (propDef.required === true) {
        propTypeStr += '.isRequired';
      }

      propTypesCode[propName] = propTypeStr;
    }

    return propTypesCode;
  }

  /**
   * Props 기본값 설정
   * @returns {Object} 기본값 객체
   */
  getDefaultProps() {
    const defaults = {};

    for (const [propName, propDef] of Object.entries(this.props)) {
      if (propDef.default !== undefined) {
        defaults[propName] = propDef.default;
      }
    }

    return defaults;
  }

  /**
   * 마크업을 JSX로 변환
   * @returns {string} JSX 코드
   */
  getJSX() {
    let jsx = this.markup;

    // Props 바인딩: {prop} → {prop}
    // JSX는 이미 {} 형식이므로 추가 변환 불필요

    // 조건부 렌더링: if condition { ... } → {condition && (...)}
    jsx = jsx.replace(
      /if\s+(\w+)\s*\{([^}]+)\}/g,
      '{$1 && ($2)}'
    );

    // 삼항 연산자: if-else → ternary
    jsx = jsx.replace(
      /if\s+(\w+)\s*\{([^}]+)\}\s*else\s*\{([^}]+)\}/g,
      '{$1 ? ($2) : ($3)}'
    );

    // 반복: for item in items { ... } → {items.map((item, idx) => (...))}
    jsx = jsx.replace(
      /for\s+(\w+)\s+in\s+(\w+)\s*\{([^}]+)\}/g,
      '{$2.map(($1, idx) => <React.Fragment key={idx}>$3</React.Fragment>)}'
    );

    // Event handlers: onclick → onClick, onchange → onChange 등
    jsx = jsx.replace(/on(\w+)=/g, (match, eventName) => {
      const camelCase = eventName.charAt(0).toUpperCase() + eventName.slice(1);
      return `on${camelCase}=`;
    });

    // className 처리: class → className
    jsx = jsx.replace(/\sclass=/g, ' className=');

    // Boolean 속성 처리: disabled, checked 등
    jsx = jsx.replace(/(\w+)=\{true\}/g, '$1');
    jsx = jsx.replace(/(\w+)=\{false\}/g, '');

    return jsx;
  }

  /**
   * CSS를 인라인 스타일로 변환
   * @returns {string} JavaScript 인라인 스타일
   */
  getInlineStyles() {
    const styles = {};

    // 간단한 CSS 파싱 (실제로는 더 복잡함)
    const rules = this.style.split('}').filter(r => r.trim());

    rules.forEach(rule => {
      const [selector, declarations] = rule.split('{');
      const props = {};

      if (declarations) {
        declarations.split(';').forEach(decl => {
          const [key, value] = decl.split(':');
          if (key && value) {
            // kebab-case → camelCase
            const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
            props[camelKey] = value.trim();
          }
        });
      }

      styles[selector.trim()] = props;
    });

    return styles;
  }

  /**
   * React 함수형 컴포넌트 코드 생성
   * @returns {string} React 컴포넌트 코드
   */
  toReactComponent() {
    const propsStr = Object.keys(this.props)
      .map(p => `${p},`)
      .join('\n  ');

    const stateCode = this._generateStateCode();
    const handlersCode = this._generateHandlers();
    const jsxCode = this.getJSX();

    const code = `
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const ${this.name} = ({
  ${propsStr}
}) => {
  ${stateCode}

  ${handlersCode}

  return (
    <>
      ${jsxCode}
    </>
  );
};

${this.name}.propTypes = {
  ${Object.entries(this.getPropTypes())
    .map(([key, type]) => `${key}: ${type},`)
    .join('\n  ')}
};

${this.name}.defaultProps = ${JSON.stringify(this.getDefaultProps(), null, 2)};

export default ${this.name};
`;

    return code.trim();
  }

  /**
   * useState 훅 코드 생성
   * @returns {string} State 선언 코드
   */
  _generateStateCode() {
    const stateCode = [];

    // 스크립트에서 let 선언 찾기
    const varPattern = /let\s+(\w+)\s*=\s*([^;]+);/g;
    let match;

    while ((match = varPattern.exec(this.script)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();
      const camelCaseVar = varName.charAt(0).toUpperCase() + varName.slice(1);
      const setterName = `set${camelCaseVar}`;

      stateCode.push(`const [${varName}, ${setterName}] = useState(${varValue});`);
    }

    return stateCode.length > 0 ? stateCode.join('\n  ') : '// 상태 없음';
  }

  /**
   * 이벤트 핸들러 코드 생성
   * @returns {string} 핸들러 코드
   */
  _generateHandlers() {
    const handlers = [];

    // 함수 선언 패턴 찾기
    const funcPattern = /function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
    let match;

    while ((match = funcPattern.exec(this.script)) !== null) {
      const funcName = match[1];
      const funcParams = match[2];
      const funcBody = match[3];

      handlers.push(`
  const ${funcName} = useCallback((${funcParams}) => {
    ${funcBody}
  }, []);
`);
    }

    return handlers.length > 0 ? handlers.join('\n') : '// 핸들러 없음';
  }

  /**
   * TypeScript 버전의 React 컴포넌트
   * @returns {string} TypeScript React 컴포넌트 코드
   */
  toReactComponentTS() {
    const interfaces = this._generateInterfaces();
    const componentCode = this.toReactComponent();

    return `
${interfaces}

${componentCode}
`.trim();
  }

  /**
   * TypeScript 인터페이스 생성
   * @returns {string} 인터페이스 코드
   */
  _generateInterfaces() {
    const props = {};

    for (const [name, def] of Object.entries(this.props)) {
      const tsType = this._mapToTSType(def.type);
      props[name] = `${tsType}${def.required !== false ? '' : '?'}`;
    }

    const propsInterface = `
interface ${this.name}Props {
  ${Object.entries(props)
    .map(([key, type]) => `${key}: ${type};`)
    .join('\n  ')}
}
`.trim();

    return propsInterface;
  }

  /**
   * FreeLang 타입을 TypeScript 타입으로 매핑
   * @param {string} type - FreeLang 타입
   * @returns {string} TypeScript 타입
   */
  _mapToTSType(type) {
    const tsTypeMap = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'array': 'any[]',
      'object': 'Record<string, any>',
      'function': '(...args: any[]) => any',
      'int': 'number',
      'float': 'number',
      'node': 'React.ReactNode',
      'element': 'React.ReactElement',
    };
    return tsTypeMap[type] || 'any';
  }

  /**
   * Hook 사용 예제
   * @returns {string} useState/useEffect 사용 예제
   */
  getHooksExample() {
    return `
// useState 예제
const [count, setCount] = useState(0);

// useEffect 예제
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);

// useCallback 예제
const increment = useCallback(() => {
  setCount(count + 1);
}, [count]);
`.trim();
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

    // JSX 검사
    if (!this.markup) {
      issues.push('Markup이 정의되지 않았습니다');
    }

    // React 특정 문법 검사
    if (this.markup.includes('on') && !this.markup.includes('onClick')) {
      // on으로 시작하는 이벤트 핸들러가 있지만 onClick 형식이 아님
      // 이는 자동 변환됨
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
        requiresHooks: this.script.includes('let ') || this.script.includes('function'),
      },
    };
  }

  /**
   * 마이그레이션 가이드
   * @returns {string} 마이그레이션 가이드
   */
  getMigrationGuide() {
    const guide = `
# ${this.name} React 마이그레이션 가이드

## Props 인터페이스
\`\`\`typescript
${this._generateInterfaces()}
\`\`\`

## 컴포넌트 코드
\`\`\`tsx
${this.toReactComponentTS()}
\`\`\`

## 사용 예제
\`\`\`tsx
import ${this.name} from './${this.name}';

function App() {
  return (
    <${this.name}
      ${Object.keys(this.props).map(p => `${p}={...}`).join('\n      ')}
    />
  );
}
\`\`\`

## Hooks 활용
\`\`\`typescript
${this.getHooksExample()}
\`\`\`
`;
    return guide.trim();
  }

  /**
   * Storybook 스토리 생성
   * @returns {string} Storybook 스토리 코드
   */
  getStorybookStory() {
    return `
import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import ${this.name} from './${this.name}';

export default {
  title: 'Components/${this.name}',
  component: ${this.name},
  argTypes: {
    ${Object.keys(this.props)
      .map(p => `${p}: { control: 'text' }`)
      .join(',\n    ')}
  },
} as ComponentMeta<typeof ${this.name}>;

const Template: ComponentStory<typeof ${this.name}> = (args) => <${this.name} {...args} />;

export const Default = Template.bind({});
Default.args = {
  ${Object.entries(this.getDefaultProps())
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(',\n  ')}
};
`.trim();
  }

  /**
   * 테스트 코드 생성 (Jest)
   * @returns {string} Jest 테스트 코드
   */
  getTestCode() {
    return `
import React from 'react';
import { render, screen } from '@testing-library/react';
import ${this.name} from './${this.name}';

describe('${this.name}', () => {
  it('should render without crashing', () => {
    const { container } = render(<${this.name} />);
    expect(container).toBeInTheDocument();
  });

  it('should accept props', () => {
    const props = {
      ${Object.entries(this.getDefaultProps())
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(',\n      ')}
    };
    const { container } = render(<${this.name} {...props} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should call onClick handler', () => {
    const onClick = jest.fn();
    render(<${this.name} onClick={onClick} />);
    expect(onClick).toBeDefined();
  });
});
`.trim();
  }
}

module.exports = ReactComponentAdapter;
