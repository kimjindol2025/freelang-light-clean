/**
 * Plugin System (플러그인 시스템)
 * FreeLang Light 확장성을 위한 플러그인 아키텍처
 *
 * 기능:
 * - Hook 기반 플러그인 시스템
 * - 라이프사이클 관리
 * - 의존성 해결
 * - 우선도 처리
 */

/**
 * Plugin - 플러그인 기본 클래스
 */
class Plugin {
  constructor(name, version = '1.0.0') {
    this.name = name;
    this.version = version;
    this.enabled = true;
    this.hooks = new Map();
    this.dependencies = [];
    this.metadata = {};
  }

  /**
   * 플러그인 초기화
   */
  async initialize(context) {
    // 서브클래스에서 구현
  }

  /**
   * 플러그인 활성화
   */
  async activate(context) {
    this.enabled = true;
  }

  /**
   * 플러그인 비활성화
   */
  async deactivate(context) {
    this.enabled = false;
  }

  /**
   * 플러그인 정리
   */
  async destroy() {
    this.hooks.clear();
  }

  /**
   * Hook 등록
   */
  registerHook(name, handler, priority = 0) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name).push({ handler, priority });
    // 우선도순 정렬
    this.hooks.get(name).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Hook 얻기
   */
  getHooks(name) {
    return this.hooks.get(name) || [];
  }

  /**
   * 메타데이터 설정
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * 메타데이터 얻기
   */
  getMetadata(key) {
    return this.metadata[key];
  }
}

/**
 * PluginManager - 플러그인 관리
 */
class PluginManager {
  constructor() {
    this.plugins = new Map(); // name -> Plugin
    this.hooks = new Map(); // hookName -> [handlers]
    this.context = {};
    this.pluginOrder = []; // 로드 순서
  }

  /**
   * 플러그인 등록
   */
  async registerPlugin(plugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" already registered`);
      return false;
    }

    // 의존성 확인
    if (!this._checkDependencies(plugin)) {
      console.error(`Plugin "${plugin.name}" has unmet dependencies`);
      return false;
    }

    this.plugins.set(plugin.name, plugin);
    this.pluginOrder.push(plugin.name);
    return true;
  }

  /**
   * 플러그인 의존성 확인
   * @private
   */
  _checkDependencies(plugin) {
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 플러그인 초기화
   */
  async initializePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    try {
      await plugin.initialize(this.context);
      this._registerPluginHooks(plugin);
      return true;
    } catch (error) {
      console.error(`Failed to initialize plugin "${name}":`, error);
      return false;
    }
  }

  /**
   * 모든 플러그인 초기화
   */
  async initializeAll() {
    for (const name of this.pluginOrder) {
      await this.initializePlugin(name);
    }
  }

  /**
   * 플러그인 Hook 등록
   * @private
   */
  _registerPluginHooks(plugin) {
    for (const [hookName, handlers] of plugin.hooks.entries()) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }

      for (const { handler, priority } of handlers) {
        this.hooks.get(hookName).push({
          handler,
          priority,
          plugin: plugin.name,
        });
      }

      // 우선도순 정렬
      this.hooks.get(hookName).sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Hook 실행
   */
  async executeHook(name, data = {}) {
    const handlers = this.hooks.get(name) || [];
    let result = data;

    for (const { handler, plugin } of handlers) {
      try {
        result = await handler(result, this.context);
      } catch (error) {
        console.error(`Hook error in plugin "${plugin}":`, error);
      }
    }

    return result;
  }

  /**
   * Hook 추가 등록
   */
  registerHook(name, handler, priority = 0) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }

    this.hooks.get(name).push({
      handler,
      priority,
      plugin: 'core',
    });

    this.hooks.get(name).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 플러그인 활성화
   */
  async enablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    try {
      await plugin.activate(this.context);
      return true;
    } catch (error) {
      console.error(`Failed to enable plugin "${name}":`, error);
      return false;
    }
  }

  /**
   * 플러그인 비활성화
   */
  async disablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    try {
      await plugin.deactivate(this.context);
      return true;
    } catch (error) {
      console.error(`Failed to disable plugin "${name}":`, error);
      return false;
    }
  }

  /**
   * 플러그인 제거
   */
  async unregisterPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    try {
      await plugin.destroy();
      this.plugins.delete(name);
      this.pluginOrder = this.pluginOrder.filter((n) => n !== name);

      // Hook에서도 제거
      for (const [hookName, handlers] of this.hooks.entries()) {
        this.hooks.set(
          hookName,
          handlers.filter((h) => h.plugin !== name)
        );
      }

      return true;
    } catch (error) {
      console.error(`Failed to unregister plugin "${name}":`, error);
      return false;
    }
  }

  /**
   * 플러그인 정보
   */
  getPluginInfo(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return null;

    return {
      name: plugin.name,
      version: plugin.version,
      enabled: plugin.enabled,
      dependencies: plugin.dependencies,
      hooks: Array.from(plugin.hooks.keys()),
      metadata: plugin.metadata,
    };
  }

  /**
   * 모든 플러그인 목록
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map((plugin) => ({
      name: plugin.name,
      version: plugin.version,
      enabled: plugin.enabled,
    }));
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      pluginCount: this.plugins.size,
      hookCount: this.hooks.size,
      totalHooks: Array.from(this.hooks.values()).reduce(
        (sum, handlers) => sum + handlers.length,
        0
      ),
      plugins: this.listPlugins(),
    };
  }
}

/**
 * Built-in Plugins
 */

/**
 * DevTools Plugin - 개발자 도구
 */
class DevToolsPlugin extends Plugin {
  constructor() {
    super('devtools', '1.0.0');
    this.logs = [];
    this.maxLogs = 100;
  }

  async initialize(context) {
    this.registerHook('beforeHook', async (data) => {
      this.logs.push({
        type: 'before',
        data,
        timestamp: Date.now(),
      });
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      return data;
    });

    this.registerHook('afterHook', async (data) => {
      this.logs.push({
        type: 'after',
        data,
        timestamp: Date.now(),
      });
      return data;
    });
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

/**
 * Logger Plugin - 로깅
 */
class LoggerPlugin extends Plugin {
  constructor() {
    super('logger', '1.0.0');
  }

  async initialize(context) {
    this.registerHook('log', async (data) => {
      console.log(`[${new Date().toISOString()}] ${data.message}`, data.meta);
      return data;
    });
  }
}

/**
 * Analytics Plugin - 분석
 */
class AnalyticsPlugin extends Plugin {
  constructor() {
    super('analytics', '1.0.0');
    this.events = [];
  }

  async initialize(context) {
    this.registerHook('event', async (data) => {
      this.events.push({
        ...data,
        timestamp: Date.now(),
      });
      return data;
    });
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

module.exports = PluginManager;
module.exports.Plugin = Plugin;
module.exports.DevToolsPlugin = DevToolsPlugin;
module.exports.LoggerPlugin = LoggerPlugin;
module.exports.AnalyticsPlugin = AnalyticsPlugin;
