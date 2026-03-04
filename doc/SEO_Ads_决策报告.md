# SEO 与 Google 广告位决策报告

## 1. 默认语言

- 当前默认语言为英文：
  - `src/core/i18n/index.ts` 默认 `locale: 'en'`
  - `index.html` 根标签 `lang="en"`
- 已保留用户主动切换语言并持久化能力。

## 2. Google SEO 技术实施清单

### 2.1 站点地图与 robots

- 已生成 `public/sitemap.xml`
- 已生成 `public/robots.txt`
- 已提供自动生成命令：
  - `npm run seo:generate`
  - 支持 `VITE_SITE_URL` 或 `SITE_URL` 注入域名

### 2.2 页面级元信息

- 已实现按路由动态注入：
  - `title`
  - `description`
  - `canonical`
  - `hreflang`（`en`、`zh-CN`、`x-default`）
  - Open Graph / Twitter 元信息
  - JSON-LD（`WebSite` + `WebPage`）
- 关键文件：
  - `src/core/seo/index.ts`
  - `src/core/router/guards.ts`
  - `src/core/router/index.ts`

### 2.3 抓取与可访问性

- `robots.txt` 已允许核心页面抓取
- 已补齐图片懒加载与异步解码：
  - `loading="lazy"`
  - `decoding="async"`

### 2.4 Core Web Vitals 优化动作

- 已减少图片主线程压力（懒加载 + 异步解码）
- 已加入广告位占位容器保留尺寸，降低广告接入时 CLS 抖动风险
- 已在构建层维持代码分包

### 2.5 HTTPS / 压缩 / 缓存

- 已提供 Nginx 生产配置模板：
  - `deploy/nginx-seo.conf`
  - 包含 HTTPS 重定向、Gzip、Brotli、静态资源长期缓存

### 2.6 PageSpeed 与移动友好

- 本地可继续执行：
  - Google Mobile Friendly Test
  - PageSpeed Insights（移动端）
- 目标阈值：
  - LCP < 2.5s
  - INP < 200ms
  - CLS < 0.1
  - PSI >= 90

## 3. Google 广告位预留策略决策

### 3.1 结论

- 当前采用：
  - 默认不展示广告（`VITE_ADS_ENABLED=false`）
  - 预埋广告注入点与样式钩子，后续可快速启用
- 原因：
  - 保持当前视觉层级稳定
  - 上线广告时无需重构主布局
  - 通过固定最小高度控制 CLS 风险

### 3.2 页面位置图（注入点）

```text
App
├─ Header
├─ AdSlot(top-banner, 728x90/自适应横幅)
├─ Main Content(router-view)
├─ AdSlot(in-feed, 自适应信息流)
├─ Footer/Global Components
└─ AdSlot(sticky-bottom, 粘底横幅)
```

### 3.3 尺寸建议

- Top Banner：`728x90`（桌面），移动端自动降级为自适应横幅
- In-feed：自适应，最小保留高度 `120px`
- Sticky Bottom：移动端常用 `320x50 / 320x100`，已预留固定底部容器

### 3.4 加载方式

- 建议异步加载：
  - AdSense 脚本 `async`
  - 组件挂载后再请求渲染
- 当前实现：
  - `src/components/common/AdSlot.vue`
  - `src/core/ads/config.ts`

### 3.5 隐私与政策

- 继续使用现有隐私同意条（GDPR/CCPA）后再启用个性化广告
- 建议在广告正式上线时：
  - 仅在同意后加载个性化广告参数
  - 未同意时使用非个性化广告模式

## 4. 上线前操作

1. 设置 `.env`：
   - `VITE_SITE_URL`
   - `VITE_ADS_ENABLED`
   - `VITE_ADS_PROVIDER`
   - `VITE_ADSENSE_CLIENT`
   - 各广告 slot id
2. 执行 `npm run seo:generate`
3. 在 Google Search Console 提交：`https://你的域名/sitemap.xml`
4. 按生产环境部署 `deploy/nginx-seo.conf` 的同等策略
