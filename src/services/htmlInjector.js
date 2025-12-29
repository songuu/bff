/**
 * HTML 动态注入服务
 * 在返回 HTML 前注入企业特定的配置
 */
class HtmlInjector {
  /**
   * 注入配置到 HTML
   * @param {string} html - 原始 HTML 字符串
   * @param {string} enterpriseId - 企业 ID
   * @param {Object} config - 企业配置对象
   * @returns {string} - 注入后的 HTML
   */
  injectConfig(html, enterpriseId, config = {}) {
    // 构建配置对象
    const appConfig = {
      enterprise_id: enterpriseId,
      theme: config.theme || 'default',
      feature_flags: config.feature_flags || [],
      api_base_url: config.api_base_url || '/api',
      ...config,
    };

    // 生成配置脚本
    const configScript = `
    <script>
      window.__APP_CONFIG__ = ${JSON.stringify(appConfig, null, 2)};
    </script>
    `;

    // 在 </head> 标签前注入配置
    if (html.includes('</head>')) {
      return html.replace('</head>', `${configScript}</head>`);
    }
    
    // 如果没有 </head>，在 <body> 前注入
    if (html.includes('<body>')) {
      return html.replace('<body>', `${configScript}<body>`);
    }

    // 如果都没有，在开头注入
    return `${configScript}${html}`;
  }

  /**
   * 根据企业 ID 生成默认配置
   * @param {string} enterpriseId - 企业 ID
   * @returns {Object}
   */
  generateDefaultConfig(enterpriseId) {
    // 可以根据企业 ID 返回不同的默认配置
    const configs = {
      'enterprise-a': {
        theme: 'blue',
        feature_flags: ['feature1', 'feature2'],
        api_base_url: '/api/v2',
      },
      'enterprise-b': {
        theme: 'green',
        feature_flags: ['feature1'],
        api_base_url: '/api/v1',
      },
      'default': {
        theme: 'default',
        feature_flags: [],
        api_base_url: '/api',
      },
    };

    return configs[enterpriseId] || configs['default'];
  }
}

// 导出单例
export const htmlInjector = new HtmlInjector();

