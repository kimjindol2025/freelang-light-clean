/**
 * Theme System (테마 시스템)
 * 다크/라이트 모드 및 커스텀 테마 지원
 *
 * 기능:
 * - 테마 정의 및 로드
 * - CSS 변수 생성
 * - 테마 동기화
 * - 색상 팔레트 관리
 */

/**
 * ColorSystem - 색상 관리
 */
class ColorSystem {
  constructor() {
    this.baseColors = {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      success: '#4CD964',
      warning: '#FF9500',
      error: '#FF3B30',
      info: '#00C7FF',
    };
  }

  /**
   * Hex를 RGB로 변환
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  /**
   * RGB를 Hex로 변환
   */
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * 명도 조정
   */
  adjustLightness(hex, percent) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const factor = 1 + percent / 100;
    const r = Math.min(255, Math.floor(rgb.r * factor));
    const g = Math.min(255, Math.floor(rgb.g * factor));
    const b = Math.min(255, Math.floor(rgb.b * factor));

    return this.rgbToHex(r, g, b);
  }

  /**
   * 색상 대비도 계산 (WCAG)
   */
  getContrast(hex1, hex2) {
    const getLuminance = (hex) => {
      const rgb = this.hexToRgb(hex);
      if (!rgb) return 0.5;

      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * 대비도 충분한지 확인 (WCAG AA: 4.5:1)
   */
  isAccessible(hex1, hex2) {
    return this.getContrast(hex1, hex2) >= 4.5;
  }

  /**
   * 색상 팔레트 생성
   */
  generatePalette(baseHex, name = 'color') {
    return {
      [`${name}-50`]: this.adjustLightness(baseHex, 80),
      [`${name}-100`]: this.adjustLightness(baseHex, 60),
      [`${name}-200`]: this.adjustLightness(baseHex, 40),
      [`${name}-300`]: this.adjustLightness(baseHex, 20),
      [`${name}-400`]: baseHex,
      [`${name}-500`]: this.adjustLightness(baseHex, -20),
      [`${name}-600`]: this.adjustLightness(baseHex, -40),
      [`${name}-700`]: this.adjustLightness(baseHex, -60),
      [`${name}-800`]: this.adjustLightness(baseHex, -80),
    };
  }
}

/**
 * Theme - 테마 정의
 */
class Theme {
  constructor(name, mode = 'light') {
    this.name = name;
    this.mode = mode; // 'light' or 'dark'
    this.colors = {};
    this.typography = {};
    this.spacing = {};
    this.shadows = {};
    this.borderRadius = {};
  }

  /**
   * 색상 설정
   */
  setColors(colors) {
    this.colors = colors;
  }

  /**
   * 타이포그래피 설정
   */
  setTypography(typography) {
    this.typography = typography;
  }

  /**
   * 여백 설정
   */
  setSpacing(spacing) {
    this.spacing = spacing;
  }

  /**
   * 그림자 설정
   */
  setShadows(shadows) {
    this.shadows = shadows;
  }

  /**
   * 테마를 CSS 변수로 변환
   */
  toCSSVariables() {
    const variables = {};

    // 색상
    for (const [key, value] of Object.entries(this.colors)) {
      variables[`--${key}`] = value;
    }

    // 타이포그래피
    for (const [key, value] of Object.entries(this.typography)) {
      variables[`--font-${key}`] = value;
    }

    // 여백
    for (const [key, value] of Object.entries(this.spacing)) {
      variables[`--space-${key}`] = value;
    }

    // 그림자
    for (const [key, value] of Object.entries(this.shadows)) {
      variables[`--shadow-${key}`] = value;
    }

    return variables;
  }

  /**
   * CSS 문자열 생성
   */
  generateCSS() {
    const variables = this.toCSSVariables();
    let css = ':root {\n';

    for (const [key, value] of Object.entries(variables)) {
      css += `  ${key}: ${value};\n`;
    }

    css += '}';
    return css;
  }
}

/**
 * ThemeManager - 테마 관리
 */
class ThemeManager {
  constructor(defaultTheme = 'light') {
    this.themes = new Map(); // name -> Theme
    this.currentTheme = null;
    this.currentMode = defaultTheme; // 'light' or 'dark'
    this.colorSystem = new ColorSystem();
    this.listeners = new Set();
  }

  /**
   * 테마 등록
   */
  registerTheme(theme) {
    this.themes.set(theme.name, theme);
  }

  /**
   * 테마 설정
   */
  setTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return false;
    }

    this.currentTheme = theme;
    this._applyTheme(theme);
    this._notifyListeners();
    return true;
  }

  /**
   * 모드 변경 (라이트/다크)
   */
  setMode(mode) {
    if (mode !== 'light' && mode !== 'dark') {
      console.warn(`Invalid mode: ${mode}`);
      return false;
    }

    this.currentMode = mode;

    // 현재 테마가 있으면 재적용
    if (this.currentTheme) {
      const newTheme = this.themes.get(
        `${this.currentTheme.name}-${mode}`
      ) || this.currentTheme;
      this.setTheme(newTheme.name);
    }

    this._notifyListeners();
    return true;
  }

  /**
   * 테마 적용
   * @private
   */
  _applyTheme(theme) {
    if (typeof document === 'undefined') return;

    let styleEl = document.getElementById('freelang-theme');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'freelang-theme';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = theme.generateCSS();
  }

  /**
   * 현재 테마 조회
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * 변경 감지 구독
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 리스너 알림
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({
          theme: this.currentTheme?.name,
          mode: this.currentMode,
        });
      } catch (error) {
        console.error('ThemeManager listener error:', error);
      }
    });
  }

  /**
   * 색상 대비 확인
   */
  checkContrast(hex1, hex2) {
    return this.colorSystem.getContrast(hex1, hex2);
  }

  /**
   * 색상 팔레트 생성
   */
  generateColorPalette(baseHex, name) {
    return this.colorSystem.generatePalette(baseHex, name);
  }

  /**
   * 테마 목록
   */
  listThemes() {
    return Array.from(this.themes.keys());
  }

  /**
   * 통계
   */
  getStats() {
    return {
      currentTheme: this.currentTheme?.name,
      currentMode: this.currentMode,
      availableThemes: this.listThemes(),
      themeCount: this.themes.size,
      listenerCount: this.listeners.size,
    };
  }
}

module.exports = ThemeManager;
module.exports.Theme = Theme;
module.exports.ColorSystem = ColorSystem;
