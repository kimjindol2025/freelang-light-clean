/**
 * Design Compiler
 * Phase 8 디자인 엔진을 FreeLang 컴파일 파이프라인에 통합
 */

const AnimationEngine = require('./animation-engine');
const GlassmorphismEngine = require('./glassmorphism-engine');
const Transform3DEngine = require('./transform3d-engine');
const MicroInteractionHandler = require('./micro-interaction');
const ScrollTriggerSystem = require('./scroll-trigger');

class DesignCompiler {
  constructor() {
    this.animation = new AnimationEngine();
    this.glass = new GlassmorphismEngine();
    this.transform = new Transform3DEngine();
    this.micro = new MicroInteractionHandler();
    this.scroll = new ScrollTriggerSystem();
  }

  /**
   * .free 파일의 디자인 블록 컴파일
   */
  compileDesignBlocks(freeContent) {
    const blocks = this._extractDesignBlocks(freeContent);

    for (const block of blocks) {
      this._compileBlock(block);
    }

    return {
      css: this._generateCSS(),
      javascript: this._generateJavaScript(),
    };
  }

  /**
   * 디자인 블록 추출
   * @private
   */
  _extractDesignBlocks(content) {
    const blocks = [];
    
    // @animation 블록
    const animPattern = /@animation\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = animPattern.exec(content)) !== null) {
      blocks.push({ type: 'animation', name: match[1], content: match[2] });
    }

    // @glass 블록
    const glassPattern = /@glass\s*\{([^}]+)\}/g;
    let idx = 0;
    while ((match = glassPattern.exec(content)) !== null) {
      blocks.push({ type: 'glass', name: `glass-${idx++}`, content: match[1] });
    }

    // @3d 블록
    const transform3dPattern = /@3d\s*\{([^}]+)\}/g;
    idx = 0;
    while ((match = transform3dPattern.exec(content)) !== null) {
      blocks.push({ type: 'transform3d', name: `3d-${idx++}`, content: match[1] });
    }

    // @micro 블록
    const microPattern = /@micro\s*\{([^}]+)\}/g;
    idx = 0;
    while ((match = microPattern.exec(content)) !== null) {
      blocks.push({ type: 'micro', name: `micro-${idx++}`, content: match[1] });
    }

    // @scroll 블록
    const scrollPattern = /@scroll\s*\{([^}]+)\}/g;
    idx = 0;
    while ((match = scrollPattern.exec(content)) !== null) {
      blocks.push({ type: 'scroll', name: `scroll-${idx++}`, content: match[1] });
    }

    return blocks;
  }

  /**
   * 블록 컴파일
   * @private
   */
  _compileBlock(block) {
    switch (block.type) {
      case 'animation':
        this.animation.parseAnimation(block.name, block.content);
        break;
      case 'glass':
        this.glass.parseGlass(block.name, block.content);
        break;
      case 'transform3d':
        this.transform.parseTransform(block.name, block.content);
        break;
      case 'micro':
        this.micro.parseMicroInteraction(block.name, block.content);
        break;
      case 'scroll':
        this.scroll.parseScrollTrigger(block.name, block.content);
        break;
    }
  }

  /**
   * CSS 생성
   * @private
   */
  _generateCSS() {
    const parts = [];

    const animationCSS = this.animation.generateAllKeyframes();
    if (animationCSS) parts.push(animationCSS);

    const glassCSS = this.glass.generateAllStyles();
    if (glassCSS) parts.push(glassCSS);

    const transformCSS = this.transform.generateAllStyles();
    if (transformCSS) parts.push(transformCSS);

    return parts.join('\n\n');
  }

  /**
   * JavaScript 생성
   * @private
   */
  _generateJavaScript() {
    const parts = [];

    const animationJS = this.animation.generateAllEventHandlers();
    if (animationJS) parts.push(animationJS);

    const microJS = this.micro.generateAll();
    if (microJS) parts.push(microJS);

    const scrollJS = this.scroll.generateAll();
    if (scrollJS) parts.push(scrollJS);

    return parts.join('\n\n');
  }

  /**
   * 통계
   */
  getStats() {
    return {
      animations: this.animation.getStats(),
      glassmorphisms: this.glass.getStats(),
      transforms: this.transform.getStats(),
      interactions: this.micro.getStats(),
      scrollTriggers: this.scroll.getStats(),
    };
  }

  /**
   * 리셋
   */
  reset() {
    this.animation.reset();
    this.glass.reset();
    this.transform.reset();
    this.micro.reset();
    this.scroll.reset();
  }
}

module.exports = DesignCompiler;
