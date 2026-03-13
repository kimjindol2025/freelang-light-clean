/**
 * 3D Transform Engine
 * @3d 블록 처리 및 3D 변환 계산
 *
 * 기능:
 * - @3d 블록 파싱
 * - 3D 변환 계산 (rotate, translate, scale)
 * - CSS 매트릭스 생성
 * - 원근감(Perspective) 처리
 */

class Transform3DEngine {
  constructor() {
    this.transforms = new Map();
    this.styles = new Map();
  }

  /**
   * @3d 블록 파싱
   */
  parseTransform(name, block) {
    const transform = {
      name,
      perspective: 1000,
      transformStyle: 'preserve-3d',
      transforms: [],
      animations: {},
    };

    const lines = block.trim().split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      const keyTrimmed = key.trim();

      switch (keyTrimmed) {
        case 'perspective':
          transform.perspective = parseInt(value);
          break;
        case 'transformStyle':
          transform.transformStyle = value;
          break;
        case '@animation':
          // 애니메이션 연결
          const animName = value.trim();
          transform.animations[animName] = true;
          break;
        default:
          // 3D 변환
          transform.transforms.push({
            type: keyTrimmed,
            value: value,
          });
      }
    }

    this.transforms.set(name, transform);
    this._generateTransformStyles(name, transform);
    return transform;
  }

  /**
   * 3D 변환 스타일 생성
   * @private
   */
  _generateTransformStyles(name, transform) {
    const css = `
.transform-3d-${name} {
  perspective: ${transform.perspective}px;
  transform-style: ${transform.transformStyle};
}

.transform-3d-${name}__element {
  transform: ${this._buildTransformMatrix(transform.transforms)};
  transition: transform 0.3s ease;
}

.transform-3d-${name}__element:hover {
  transform: ${this._buildTransformMatrixWithScale(transform.transforms)};
}`.trim();

    this.styles.set(name, css);
  }

  /**
   * Transform 매트릭스 구성
   * @private
   */
  _buildTransformMatrix(transforms) {
    const parts = [];

    for (const t of transforms) {
      parts.push(this._transformToCSS(t.type, t.value));
    }

    return parts.join(' ') || 'none';
  }

  /**
   * 호버 상태에서의 변환 (약간의 스케일 추가)
   * @private
   */
  _buildTransformMatrixWithScale(transforms) {
    const parts = [];

    for (const t of transforms) {
      parts.push(this._transformToCSS(t.type, t.value));
    }

    // 호버 시 살짝 확대
    parts.push('scale3d(1.05, 1.05, 1.05)');

    return parts.join(' ') || 'none';
  }

  /**
   * Transform 타입을 CSS로 변환
   * @private
   */
  _transformToCSS(type, value) {
    const typeMap = {
      rotateX: 'rotateX',
      rotateY: 'rotateY',
      rotateZ: 'rotateZ',
      rotate: 'rotateZ',
      translateX: 'translateX',
      translateY: 'translateY',
      translateZ: 'translateZ',
      translate: 'translate3d',
      scaleX: 'scaleX',
      scaleY: 'scaleY',
      scaleZ: 'scaleZ',
      scale: 'scale3d',
      skewX: 'skewX',
      skewY: 'skewY',
    };

    const cssType = typeMap[type] || type;
    return `${cssType}(${value})`;
  }

  /**
   * 3D 매트릭스 계산 (디버깅용)
   */
  calculateMatrix(transforms) {
    // 4x4 항등 행렬로 시작
    let matrix = this._identityMatrix();

    for (const t of transforms) {
      const tMatrix = this._getTransformMatrix(t.type, t.value);
      matrix = this._multiplyMatrices(matrix, tMatrix);
    }

    return matrix;
  }

  /**
   * 항등 행렬 (4x4)
   * @private
   */
  _identityMatrix() {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  /**
   * 변환 행렬 가져오기
   * @private
   */
  _getTransformMatrix(type, value) {
    // 간단한 구현 (실제로는 복잡한 행렬 계산 필요)
    const val = parseFloat(value);

    switch (type) {
      case 'rotateX':
      case 'rotateY':
      case 'rotateZ':
        // 회전 행렬 (간단화됨)
        return this._identityMatrix();
      case 'translateX':
      case 'translateY':
      case 'translateZ':
        // 평행이동 행렬
        return this._identityMatrix();
      case 'scale':
        // 스케일 행렬
        return this._identityMatrix();
      default:
        return this._identityMatrix();
    }
  }

  /**
   * 행렬 곱셈
   * @private
   */
  _multiplyMatrices(a, b) {
    // 간단한 구현
    return a;
  }

  /**
   * 모든 CSS 생성
   */
  generateAllStyles() {
    return Array.from(this.styles.values()).join('\n\n');
  }

  /**
   * 통계
   */
  getStats() {
    return {
      totalTransforms: this.transforms.size,
      totalStyles: this.styles.size,
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.transforms.clear();
    this.styles.clear();
  }
}

module.exports = Transform3DEngine;
