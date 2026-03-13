/**
 * i18n (국제화)
 * FreeLang Light의 다국어 지원 시스템
 *
 * 기능:
 * - 다국어 메시지 관리
 * - 동적 언어 전환
 * - 복수형 처리
 * - 폴백 언어 지원
 */

/**
 * i18n 코어 시스템
 */
class i18n {
  constructor(defaultLocale = 'en') {
    this.locales = new Map(); // locale -> messages
    this.defaultLocale = defaultLocale;
    this.currentLocale = defaultLocale;
    this.fallbackLocale = defaultLocale;
    this.listeners = new Set();
  }

  /**
   * 언어 등록
   * @param {string} locale - 로케일 (예: 'ko', 'en', 'ja')
   * @param {Object} messages - 메시지 객체
   */
  registerLocale(locale, messages) {
    this.locales.set(locale, messages);
  }

  /**
   * 언어 설정
   */
  setLocale(locale) {
    if (!this.locales.has(locale)) {
      console.warn(`Locale "${locale}" not registered, using fallback`);
      locale = this.fallbackLocale;
    }

    this.currentLocale = locale;
    this._notifyListeners();
  }

  /**
   * 현재 언어 조회
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * 메시지 번역
   * @param {string} key - 메시지 키 (예: 'common.hello')
   * @param {Object} params - 치환 매개변수
   * @returns {string} 번역된 메시지
   */
  t(key, params = {}) {
    let message = this._getMessage(key, this.currentLocale);

    // 없으면 폴백 로케일에서 찾기
    if (!message && this.currentLocale !== this.fallbackLocale) {
      message = this._getMessage(key, this.fallbackLocale);
    }

    // 없으면 키 자체 반환
    if (!message) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }

    // 매개변수 치환
    return this._interpolate(message, params);
  }

  /**
   * 메시지 조회 (로케일별)
   * @private
   */
  _getMessage(key, locale) {
    const messages = this.locales.get(locale);
    if (!messages) return null;

    const keys = key.split('.');
    let value = messages;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * 매개변수 치환
   * @private
   */
  _interpolate(message, params) {
    let result = message;

    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * 복수형 처리
   * @param {string} key - 메시지 키
   * @param {number} count - 개수
   * @param {Object} params - 매개변수
   * @returns {string} 번역된 메시지
   */
  tc(key, count, params = {}) {
    const message = this._getMessage(key, this.currentLocale);

    if (!message || typeof message !== 'object') {
      return this.t(key, params);
    }

    // 복수형 규칙 적용
    let pluralForm = this._getPluralForm(count);
    const text = message[pluralForm] || message['other'] || key;

    return this._interpolate(text, { ...params, count });
  }

  /**
   * 복수형 결정 (영어/기본)
   * @private
   */
  _getPluralForm(count) {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(date, format = 'short') {
    const locale = this.currentLocale;

    if (format === 'short') {
      return new Date(date).toLocaleDateString(locale);
    }

    if (format === 'long') {
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return new Date(date).toLocaleDateString(locale);
  }

  /**
   * 숫자 포맷팅
   */
  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.currentLocale, options).format(number);
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
        listener(this.currentLocale);
      } catch (error) {
        console.error('i18n listener error:', error);
      }
    });
  }

  /**
   * 사용 가능한 로케일 목록
   */
  availableLocales() {
    return Array.from(this.locales.keys());
  }

  /**
   * 통계
   */
  getStats() {
    return {
      currentLocale: this.currentLocale,
      fallbackLocale: this.fallbackLocale,
      availableLocales: this.availableLocales(),
      messageCount: Array.from(this.locales.values()).reduce(
        (sum, msgs) => sum + Object.keys(msgs).length,
        0
      ),
      listenerCount: this.listeners.size,
    };
  }
}

/**
 * LocaleManager - 로케일 관리
 */
class LocaleManager {
  constructor(i18nInstance) {
    this.i18n = i18nInstance;
    this.localeHistory = [];
    this.preferences = {};
  }

  /**
   * 다국어 추가
   */
  addLanguage(locale, messages) {
    this.i18n.registerLocale(locale, messages);
  }

  /**
   * 언어 전환
   */
  switchLocale(locale) {
    this.localeHistory.push(this.i18n.getLocale());
    this.i18n.setLocale(locale);
  }

  /**
   * 이전 언어로 돌아가기
   */
  revertLocale() {
    if (this.localeHistory.length > 0) {
      const previousLocale = this.localeHistory.pop();
      this.i18n.setLocale(previousLocale);
      return previousLocale;
    }
    return null;
  }

  /**
   * 사용자 선호도 저장
   */
  setPreference(key, value) {
    this.preferences[key] = value;
  }

  /**
   * 사용자 선호도 조회
   */
  getPreference(key) {
    return this.preferences[key];
  }

  /**
   * 브라우저 언어 감지
   */
  detectBrowserLocale() {
    if (typeof navigator === 'undefined') return null;

    const lang = navigator.language || navigator.userLanguage;
    const locale = lang.split('-')[0];
    return locale;
  }

  /**
   * 자동 언어 설정
   */
  autoSetLocale() {
    const detected = this.detectBrowserLocale();
    if (detected && this.i18n.locales.has(detected)) {
      this.i18n.setLocale(detected);
      return detected;
    }
    return this.i18n.getLocale();
  }

  /**
   * 모든 로케일 메시지 내보내기
   */
  exportMessages() {
    const result = {};
    for (const [locale, messages] of this.i18n.locales.entries()) {
      result[locale] = messages;
    }
    return result;
  }

  /**
   * 로케일 메시지 가져오기
   */
  importMessages(data) {
    for (const [locale, messages] of Object.entries(data)) {
      this.i18n.registerLocale(locale, messages);
    }
  }
}

module.exports = i18n;
module.exports.LocaleManager = LocaleManager;
