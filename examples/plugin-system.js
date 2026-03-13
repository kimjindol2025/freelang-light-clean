/**
 * FreeLang Blog Plugin System
 *
 * 플러그인 기반 아키텍처로 기능을 동적으로 확장
 */

class PluginManager {
  constructor(baseDir = '/tmp/freelang-light/examples/plugins') {
    this.baseDir = baseDir;
    this.plugins = new Map();
    this.hooks = new Map();
    this.initialized = false;
  }

  /**
   * 플러그인 등록 (메모리 기반)
   */
  registerPlugin(name, config) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} already registered`);
    }

    const plugin = {
      name,
      version: config.version || '1.0.0',
      description: config.description || '',
      author: config.author || 'Unknown',
      enabled: config.enabled !== false,
      hooks: config.hooks || {},
      apiEndpoints: config.apiEndpoints || {},
      uiComponents: config.uiComponents || {},
      settings: config.settings || {}
    };

    this.plugins.set(name, plugin);
    console.log(`✅ Plugin registered: ${name} v${plugin.version}`);
    return plugin;
  }

  /**
   * 플러그인 활성화
   */
  enablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    plugin.enabled = true;
    return plugin;
  }

  /**
   * 플러그인 비활성화
   */
  disablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    plugin.enabled = false;
    return plugin;
  }

  /**
   * 플러그인 목록 조회
   */
  listPlugins(filter = 'all') {
    const plugins = Array.from(this.plugins.values());
    if (filter === 'enabled') return plugins.filter(p => p.enabled);
    if (filter === 'disabled') return plugins.filter(p => !p.enabled);
    return plugins;
  }

  /**
   * 플러그인 정보 조회
   */
  getPluginInfo(name) {
    return this.plugins.get(name);
  }

  /**
   * 플러그인 삭제
   */
  unregisterPlugin(name) {
    this.plugins.delete(name);
    console.log(`✅ Plugin unregistered: ${name}`);
  }

  /**
   * 후크 추가
   */
  addHook(hookName, pluginName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push({ pluginName, callback });
  }

  /**
   * 후크 실행
   */
  async executeHooks(hookName, context = {}) {
    const hooks = this.hooks.get(hookName) || [];
    const results = [];

    for (const { pluginName, callback } of hooks) {
      const plugin = this.plugins.get(pluginName);
      if (plugin && plugin.enabled) {
        try {
          const result = await callback(context);
          results.push({ pluginName, result });
        } catch (error) {
          console.error(`Error in hook ${hookName} for plugin ${pluginName}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * API 엔드포인트 반환
   */
  getApiEndpoints() {
    const endpoints = {};
    for (const [name, plugin] of this.plugins) {
      if (plugin.enabled && plugin.apiEndpoints) {
        for (const [path, handler] of Object.entries(plugin.apiEndpoints)) {
          endpoints[`/api/plugins/${name}${path}`] = handler;
        }
      }
    }
    return endpoints;
  }

  /**
   * UI 컴포넌트 생성
   */
  async renderUIComponents(position = 'sidebar') {
    const results = [];
    for (const [name, plugin] of this.plugins) {
      if (plugin.enabled && plugin.uiComponents && plugin.uiComponents[position]) {
        try {
          const html = await plugin.uiComponents[position]();
          results.push({ pluginName: name, html });
        } catch (error) {
          console.error(`Error rendering UI for plugin ${name}:`, error);
        }
      }
    }
    return results;
  }
}

/**
 * 기본 플러그인들 등록
 */
function initializeDefaultPlugins(manager) {
  // 1. 댓글 플러그인
  manager.registerPlugin('comments', {
    version: '1.0.0',
    description: 'Comment system for blog posts',
    author: 'FreeLang Team',
    enabled: true,
    apiEndpoints: {
      '/comments': async (postId) => {
        return {
          status: 'ok',
          comments: [
            { id: 1, author: 'User1', text: 'Great post!', timestamp: Date.now() }
          ]
        };
      },
      '/comments/add': async (data) => {
        return { status: 'ok', commentId: Math.floor(Math.random() * 10000) };
      }
    },
    uiComponents: {
      sidebar: async () => {
        return `
          <div style="background: rgba(255,255,255,0.95); padding: 20px; border-radius: 12px; margin-top: 20px;">
            <h3 style="color: #6366f1; margin-bottom: 15px;">💬 Recent Comments</h3>
            <div style="font-size: 0.9em; color: #64748b;">
              <p>• User1: Great post!</p>
              <p>• User2: Very helpful</p>
              <p>• User3: Thanks for sharing</p>
            </div>
          </div>
        `;
      }
    }
  });

  // 2. 분석 플러그인
  manager.registerPlugin('analytics', {
    version: '1.0.0',
    description: 'Blog analytics and statistics',
    author: 'FreeLang Team',
    enabled: true,
    apiEndpoints: {
      '/stats': async () => {
        return {
          totalVisitors: 1234,
          pageViews: 5678,
          avgTimeOnSite: '3m 45s'
        };
      }
    },
    uiComponents: {
      dashboard: async () => {
        return `
          <div style="display: grid; gap: 12px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 16px; border-radius: 10px;">
              <div style="font-size: 0.9em; opacity: 0.9;">Total Visitors</div>
              <div style="font-size: 1.8em; font-weight: 700;">1,234</div>
            </div>
            <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 16px; border-radius: 10px;">
              <div style="font-size: 0.9em; opacity: 0.9;">Page Views</div>
              <div style="font-size: 1.8em; font-weight: 700;">5,678</div>
            </div>
          </div>
        `;
      }
    }
  });

  // 3. 구독 플러그인
  manager.registerPlugin('newsletter', {
    version: '1.0.0',
    description: 'Email newsletter subscription',
    author: 'FreeLang Team',
    enabled: true,
    apiEndpoints: {
      '/subscribe': async (email) => {
        return { status: 'ok', message: 'Subscribed successfully' };
      }
    },
    uiComponents: {
      footer: async () => {
        return `
          <div style="background: rgba(255,255,255,0.95); padding: 24px; border-radius: 12px; margin-top: 30px;">
            <h3 style="color: #6366f1; margin-bottom: 12px;">📬 Subscribe to our Newsletter</h3>
            <div style="display: flex; gap: 8px;">
              <input type="email" placeholder="your@email.com" style="flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9em;">
              <button style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Subscribe</button>
            </div>
            <p style="font-size: 0.8em; color: #94a3b8; margin-top: 8px;">No spam, just great content</p>
          </div>
        `;
      }
    }
  });

  // 4. 갤러리 플러그인
  manager.registerPlugin('gallery', {
    version: '1.0.0',
    description: 'Image gallery for blog posts',
    author: 'FreeLang Team',
    enabled: true,
    apiEndpoints: {
      '/images': async (postId) => {
        return {
          images: [
            { id: 1, url: 'https://via.placeholder.com/300', title: 'Image 1' },
            { id: 2, url: 'https://via.placeholder.com/300', title: 'Image 2' }
          ]
        };
      }
    },
    uiComponents: {
      post: async () => {
        return `
          <div style="margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 12px;">📸 Post Images</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; color: #64748b;">🖼️ Image 1</div>
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; color: #64748b;">🖼️ Image 2</div>
            </div>
          </div>
        `;
      }
    }
  });

  // 5. 관련 글 플러그인
  manager.registerPlugin('related-posts', {
    version: '1.0.0',
    description: 'Show related posts',
    author: 'FreeLang Team',
    enabled: true,
    uiComponents: {
      post: async () => {
        return `
          <div style="margin: 30px 0; padding: 24px; background: #f8fafc; border-radius: 12px;">
            <h4 style="color: #333; margin-bottom: 16px;">📚 Related Posts</h4>
            <div style="display: grid; gap: 12px;">
              <div style="padding: 12px; background: white; border-radius: 8px; border-left: 3px solid #6366f1;">
                <div style="font-weight: 600; color: #333;">Related Post 1</div>
                <div style="font-size: 0.85em; color: #64748b;">Category • 5 min read</div>
              </div>
              <div style="padding: 12px; background: white; border-radius: 8px; border-left: 3px solid #6366f1;">
                <div style="font-weight: 600; color: #333;">Related Post 2</div>
                <div style="font-size: 0.85em; color: #64748b;">Category • 3 min read</div>
              </div>
            </div>
          </div>
        `;
      }
    }
  });

  console.log('✅ Default plugins initialized');
}

module.exports = { PluginManager, initializeDefaultPlugins };
