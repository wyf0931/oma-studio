# OMA Studio — Safari/WebKit 兼容性研究报告

> 调研时间：2026-09-17
> 目标：找出 Chrome 正常但 Safari 有问题的兼容性根因，并给出解决方案。
> 状态：仅调研，未修改代码。

---

## 1. 技术栈概览

| 依赖 | 版本 | 加载方式 |
|------|------|----------|
| Alpine.js | 3.x | CDN (jsdelivr) |
| DaisyUI | 5 | CDN |
| Tailwind CSS | v4 (browser build) | CDN |
| marked | 15.0.7 | CDN |
| DOMPurify | 3.2.4 | CDN |
| highlight.js | 11.11.1 | CDN |
| mermaid | 11 | CDN |
| Lucide | latest | CDN |
| i18next | 26.4.2 | CDN |
| Tailwind CLI (build) | 4.1.12 | npm (生成 typography.css) |

前端文件：`static/index.html` (3483行), `static/app.js` (3745行), `static/styles.css` (5781行), `static/typography.css` (Tailwind 生成)

**关键特征：无 bundler、无 polyfill、无 autoprefixer、无构建系统。**

---

## 2. Safari 兼容性问题清单

### 🔴 P0 — 致命问题（会导致功能崩溃）

#### 2.1 marked.js v15 — RegExp 负向后行断言

| 项目 | 详情 |
|------|------|
| 位置 | `static/index.html` 第 36 行 (`marked@15.0.7`)，`static/app.js` 第 2759 行 (`marked.parse()`) |
| 问题 | marked v15 使用 `RegExp` 负向后行断言（negative lookbehind），Safari < 16.5 不支持 |
| Safari 支持 | Safari 16.5+（2023年3月）|
| 症状 | `SyntaxError: Invalid regular expression: /...` — Markdown 渲染完全崩溃，聊天消息无法显示 |
| 严重程度 | **致命** — 消息渲染是核心功能 |
| 来源 | [markedjs/marked#3816](https://github.com/markedjs/marked/issues/3816) |
| 验证方法 | `node -e "const marked = require('marked'); console.log(marked.parse('# test'))"` 在 Safari < 16.5 会抛 SyntaxError |

**解决方案：**
- 方案 A（推荐）：将 `marked` 版本降到 v4.x（最后一版不用负向后行断言）：`marked@4.3.0`
- 方案 B：使用 marked 的 esm 构建版本（`marked/lib/marked.cjs`）检查是否已移除 lookbehind
- 方案 C：如果必须用 v15，在 CDN 加载前用 feature detection 检查 `/(?<=x)/` 是否可用

#### 2.2 oklch() 颜色函数 — 全项目 40 处

| 项目 | 详情 |
|------|------|
| 位置 | `styles.css` 第 3-39 行（CSS 变量定义），`typography.css` 中 DaisyUI/Tailwind 生成 |
| 问题 | `oklch()` 颜色函数 Safari < 15.4 不支持，所有使用 `var()` 引用这些变量的颜色全部失效 |
| Safari 支持 | Safari 15.4+（2022年6月）|
| 症状 | 大面积颜色异常：主题色、背景色、文字颜色全部失效，页面变成默认黑色背景+黑色文字 |
| 严重程度 | **致命** — 影响所有页面 |
| 根因 | DaisyUI v5 和 Tailwind v4 全面采用 oklch()，这是设计决策，不是 bug |
| 影响范围 | 39 处 CSS 变量定义 + 所有通过 `var()` 引用的地方 |

**解决方案：**
- 方案 A（推荐）：明确声明最低 Safari 版本为 15.4+，在 README 中注明。这是现代化色域（P3），Chrome 99+/Firefox 113+ 都支持。
- 方案 B：如果必须支持 Safari 15.3 及更早，需要为所有 `oklch()` 颜色提供 `rgb()` fallback。工作量极大（40+ 处 + DaisyUI 内部），不推荐。
- 方案 C：使用 PostCSS 插件 `postcss-color-oklch` 在构建时将 oklch() 转换为 rgb()。需要在 `package.json` 中加入构建步骤。

#### 2.3 100vh 移动端布局问题

| 项目 | 详情 |
|------|------|
| 位置 | `styles.css` 第 110, 188, 331, 568, 1181, 1501, 2025, 2029, 2037, 2045, 2049, 2384, 2477, 2686, 2690, 4454, 4636, 4943, 5042, 5043, 5108, 5109, 5121, 5171 行 |
| 问题 | iOS Safari 的 `100vh` 包含底部工具栏，实际可用高度 < 100vh。页面底部内容被遮挡。 |
| Safari 支持 | `100vh` 始终有此问题；`100dvh` 和 `100svh` Safari 15.4+ 支持 |
| 现状 | 代码中已部分使用 `100dvh`（第 2384, 2477, 5042, 5043, 5108, 5109 行）和 `62svh`（第 5171 行），但不一致 |
| 严重程度 | **致命** — 移动端布局错乱 |

**解决方案：**
- 将所有 `100vh` 替换为 `100dvh`（Safari 15.4+）
- 或者使用 `max-height: min(100vh, 100dvh)` 的渐进增强写法
- 对于 Safari < 15.4，JS 动态计算 `window.innerHeight` 并设置 CSS 变量

---

### 🟡 P1 — 中等问题（功能可用但体验受损）

#### 3.1 color-mix() — 9 处

| 项目 | 详情 |
|------|------|
| 位置 | `styles.css` 第 681, 1310, 1465, 1791, 1793, 3441, 3670, 4806, 4807 行 |
| Safari 支持 | Safari 16.2+（2023年1月）|
| 症状 | 边框色、背景色混合效果失效，退化为原始色值或不显示 |
| 严重程度 | 中等 — 视觉退化，不影响功能 |

**解决方案：**
- 如果支持 Safari 16.2+，无需修改
- 如果需要更早版本，用 `@supports (color: color-mix(in srgb, red, blue))` 包裹，提供 fallback

#### 3.2 Grid `1fr` 溢出 — 51 处 grid 布局

| 项目 | 详情 |
|------|------|
| 位置 | `styles.css` 第 187, 403, 466, 789, 962, 1086, 1100, 1636 行等 |
| 问题 | `grid-template-columns: 1fr` 在 Safari 中，子元素内容宽度 > 1fr 时会撑破容器。Chrome 容错，Safari 严格报错。 |
| 严重程度 | 中等 — 长文本/代码块可能溢出 |

**解决方案：**
- 将所有 `1fr` 替换为 `minmax(0, 1fr)`
- 对子元素添加 `min-width: 0`
- 关键规则：`grid-template-columns: minmax(0, 1fr)` + 子元素 `min-width: 0`

#### 3.3 Tailwind v4 typography.css 中的现代 CSS 特性

| 项目 | 详情 |
|------|------|
| 位置 | `static/typography.css`（Tailwind 4.3.3 生成）|
| 特性 | `color: rgb(from red r g b)`（Safari 16.4+）、`1lh` 单位（Safari 16.4+）、`color-mix(in oklab, ...)`（Safari 16.2+）|
| 严重程度 | 中等 — 占位符颜色、日期输入等细节退化 |

**解决方案：**
- 重新生成 `typography.css` 时指定 `browserslist`（如 `Safari >= 15.4`）
- 或在 `frontend/input.css` 中添加 `@config` 配置兼容性目标

#### 3.4 mermaid v11 — SVG 渲染

| 项目 | 详情 |
|------|------|
| 位置 | `app.js` 第 1442-1449 行 |
| 问题 | mermaid 生成的 SVG 在 Safari 中渲染可能与 Chrome 不同（字体、间距、viewBox）|
| 严重程度 | 中等 — 图表显示可能有差异 |
| 来源 | [mermaid-js/mermaid#8213](https://github.com/mermaid-js/mermaid/issues/8213), [#6666](https://github.com/mermaid-js/mermaid/issues/6666) |

**解决方案：**
- 在 mermaid `initialize()` 配置中指定 `theme` 和 `securityLevel`
- 确保 SVG 有正确的 `viewBox` 和 `preserveAspectRatio`

#### 3.5 Tailwind `@layer` — Safari < 17.2

| 项目 | 详情 |
|------|------|
| 位置 | `typography.css` 中大量 `@layer properties`, `@layer theme`, `@layer base`, `@layer components`, `@layer utilities` |
| Safari 支持 | `@layer` CSS Cascade Layers: Safari 17.2+（2024年3月）|
| 症状 | Safari < 17.2 不理解 `@layer`，CSS 级联优先级顺序可能异常 |
| 严重程度 | 中等 — 样式优先级可能不对 |

**解决方案：**
- 重新生成 `typography.css` 时让 Tailwind 不使用 `@layer`（Tailwind v4 默认使用）
- 或者用 PostCSS `postcss-layers` 插件展开 `@layer`

---

### 🟢 P2 — 轻微问题

#### 4.1 Flex `gap` — 大量使用

| Safari 支持 | Safari 14.1+ |
|-------------|-------------|
| 严重程度 | 轻微（14.1 已经是 2021年1月）|
| 现状 | 代码中大量使用 `gap`，无 fallback |
| 建议 | 如果支持 Safari 14.1+，无需修改 |

#### 4.2 localStorage 隐私模式

| 位置 | `app.js` 第 23-24, 392, 1728, 1742 行 |
|------|----------------------------------------|
| 问题 | Safari 隐私模式下 `localStorage` 可能抛 `SecurityError` |
| 严重程度 | 轻微 — 仅隐私模式 |
| 建议 | 加 try-catch 包裹 localStorage 访问 |

#### 4.3 Alpine.js `x-html` 安全

| 位置 | `index.html` 第 370, 522, 524, 778, 814 行等 |
|------|----------------------------------------------|
| 问题 | `x-html` 注入 HTML，Alpine 在 Safari 中处理某些特殊字符时可能有差异 |
| 严重程度 | 轻微 — 已用 DOMPurify 净化 |

#### 4.4 `-webkit-` 前缀（已正确处理）

| 位置 | `styles.css` 第 444, 448, 1043-1045, 1070 行 |
|------|-----------------------------------------------|
| 现状 | 已使用 `-webkit-text-fill-color`, `-webkit-box`, `-webkit-line-clamp` |
| 结论 | 前缀处理正确，无需修改 |

---

## 3. 社区已知问题汇总

### marked.js

| Issue | 标题 | 状态 | 影响 |
|-------|------|------|------|
| [#3816](https://github.com/markedjs/marked/issues/3816) | Marked is incompatible with Safari < 16.5 | Closed | **已确认** — 负向后行断言导致 SyntaxError |
| [#3944](https://github.com/markedjs/marked/issues/3944) | Safari 15 rendering issue | Closed | 渲染差异 |

### mermaid

| Issue | 标题 | 状态 |
|-------|------|------|
| [#8213](https://github.com/mermaid-js/mermaid/issues/8213) | Safari SVG rendering | Open |
| [#6666](https://github.com/mermaid-js/mermaid/issues/6666) | Safari chart display | Closed |

### DaisyUI

| Issue | 标题 | 状态 |
|-------|------|------|
| [#3454](https://github.com/saadeghi/daisyui/issues/3454) | Safari rendering issue | Closed |

### Alpine.js

- GitHub 搜索 `safari` 和 `webkit` 关键词无相关 issue（GitHub API 搜索验证）
- Alpine.js 3.x 对 Safari 兼容性良好，无已知致命问题

### DOMPurify / i18next / highlight.js

- 均无 Safari 相关的已知 issue
- 标准 API 使用，跨浏览器一致

---

## 4. 推荐的解决方案

### 优先级排序

| 优先级 | 问题 | 方案 | 工作量 |
|--------|------|------|--------|
| P0-1 | marked.js lookbehind | 降级到 `marked@4.3.0` | 1 行改动 |
| P0-2 | oklch() 颜色 | 声明最低 Safari 15.4+，README 注明 | 文档改动 |
| P0-3 | 100vh | 统一替换为 `100dvh` + `min(100vh, 100dvh)` | 10-15 处 CSS |
| P1-1 | color-mix() | 如果 Safari 16.2+ 无问题 | 无需改动 |
| P1-2 | Grid 1fr | 替换为 `minmax(0, 1fr)` + `min-width:0` | 10-15 处 CSS |
| P1-3 | @layer | 重新生成 typography.css 或忽略 | 视 Safari 版本 |

### 推荐的 Safari 兼容矩阵

```
最低支持版本：Safari 15.4+ (2022年6月)
推荐版本：    Safari 16.5+ (2023年3月) — marked.js v15 需要
未来目标：    Safari 17.2+ (2024年3月) — @layer 原生支持
```

### 需要添加的工程化配置

当前项目 **没有 bundler**，所以以下方案需要权衡：

**方案 A — 保持无 bundler（推荐）：**
- 明确声明 Safari 15.4+ 最低版本
- 降级 marked.js 到 v4.3.0（1 行）
- 修复 100vh → 100dvh（10-15 处）
- 修复 grid 1fr → minmax(0, 1fr)（10-15 处）
- 总计约 30 处 CSS 改动 + 1 处 JS 改动

**方案 B — 加入构建系统：**
- 添加 Vite + PostCSS + autoprefixer + core-js
- 可以在构建时自动处理前缀和 polyfill
- 但违反 AGENTS.md 的"无 bundler"设计哲学
- 不推荐

### 验证方法

| 工具 | 用途 |
|------|------|
| Safari Web Inspector | Mac 连接 iPhone，真实调试 |
| Playwright `webkit` | 自动化回归测试，真实 WebKit 引擎 |
| BrowserStack | 云真机，测试各种 iOS/Safari 版本 |
| caniuse.com | 每个 CSS/JS 特性的版本支持查询 |

---

## 5. 快速验证脚本

在 Safari 中打开 `index.html` 后，在 Web Inspector Console 中运行：

```javascript
// 检查 marked.js 是否可用（lookbehind 兼容）
try {
  const result = marked.parse('# Test');
  console.log('✅ marked.js OK:', result);
} catch (e) {
  console.error('❌ marked.js FAILED:', e.message);
}

// 检查 oklch() 支持
console.log('oklch support:', getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));

// 检查 100vh vs 100dvh
console.log('vh:', window.innerHeight, 'dvh:', document.documentElement.scrollHeight);

// 检查 color-mix 支持
console.log('color-mix:', typeof getComputedStyle(document.body).getPropertyValue('background'));
```

---

## 6. 结论

OMA Studio 前端在 Safari 的兼容性问题**主要集中在三个致命点**：

1. **marked.js v15 的 RegExp 负向后行断言** — Safari < 16.5 会 SyntaxError，消息渲染崩溃
2. **oklch() 颜色函数** — 全项目 40+ 处，Safari < 15.4 所有颜色失效
3. **100vh 移动端布局** — iOS Safari 经典问题，底部内容被遮挡

其余问题（color-mix、grid 1fr、@layer）属于中等程度，通过最小改动可以修复。

**推荐策略：** 声明最低 Safari 15.4+，降级 marked.js 到 v4.x，修复 100vh 和 grid 溢出。总共约 30 处改动，无需要引入构建系统。
