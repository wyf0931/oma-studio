# OMA Studio i18n 调研

日期：2026-09-15

## 结论摘要

当前技术栈可以支持成熟的 i18n，但 Alpine.js 和 daisyUI 本身都不是翻译方案。
Alpine 官方提供可扩展的 magic、directive 和 state API，可接入翻译服务；daisyUI
是 framework-agnostic 的 CSS 组件库，只负责组件样式，不参与文案翻译。

推荐采用 **i18next core + OMA 自己的 Alpine 绑定层 + 静态 JSON locale 文件**：

- i18next 负责 key lookup、fallback、插值、复数和后续 namespace 扩展。
- Alpine 继续负责响应式状态；不引入社区非官方 Alpine i18n 插件作为核心依赖。
- `static/locales/en.json` 和 `static/locales/zh-CN.json` 由 FastAPI 现有静态文件服务提供。
- OMA 的 `t(key, variables)` 包装器负责把当前 `language` 接入 Alpine，并统一处理缺失 key。
- `Intl.DateTimeFormat`、`Intl.NumberFormat`、`Intl.RelativeTimeFormat` 负责日期、数字和相对时间格式化。

这适合当前“单个静态 HTML + 一个 Alpine component + CDN 依赖 + 无 bundler”的 MVP，
同时不会把界面文案继续散落成不可审计的自然语言 key。

## 当前代码证据

当前 `static/app.js` 已有 `language: localStorage.getItem("oma-language") || "en"`，
但 `saveLanguage()` 会把任何非英语值强制改回 `en`，因此选择器目前实际上只有占位行为。
`static/index.html` 的根元素也固定为 `<html lang="en">`，设置页只有 English 选项。

界面文案大量直接写在 `static/index.html` 和 `static/app.js` 中，包括导航、登录、设置、
聊天、文件、Agents、Marketplace、Autopilots、Usage、分享和错误提示。当前日期显示还使用
`toLocaleDateString(undefined, ...)`，跟随浏览器默认语言，而不是设置页选中的语言。

需要区分两类文本：

1. OMA 自己的界面文本、按钮、提示、空状态、错误包装和日期/数字格式，应进入 i18n。
2. 用户创建的 Agent 名称、描述、标签、提示词、Pi 输出和聊天内容，不应被自动翻译，保持原文。

## 方案比较

| 方案 | 优点 | 主要代价/风险 | 结论 |
| --- | --- | --- | --- |
| 自建 `t()` + 两份 JSON | 零新增运行时依赖，完全贴合现有单文件 Alpine | 需要自行补 fallback、插值、复数、namespace、格式化和缺失 key 规则；长期容易重新造轮子 | 适合极小页面，不适合“整个系统” |
| `alpinejs-i18n` 社区插件 | 与 Alpine 的 `$t()` / `$locale()` 直接集成，支持变量、嵌套 key、语言切换后的响应式刷新，并支持 CDN | 项目明确标注为 unofficial；需要遵守其 Alpine 初始化顺序；仍要自己维护翻译文件和审计流程 | 可做快速原型，不建议作为 OMA 核心依赖 |
| i18next core + OMA Alpine adapter | 成熟的 key-based 资源模型，支持 fallback、插值、复数、namespace、CDN/HTTP 加载和语言检测；不依赖具体 UI 框架 | 需要写一层很薄的 Alpine `t()` 响应式适配，以及处理首次加载状态 | **推荐** |
| FormatJS/ICU 全套 | ICU 消息格式和格式化能力强，适合复杂产品与编译型工作流 | 对当前无 bundler、单 Alpine component 的页面偏重，接入成本高 | 暂不采用 |

## 关键来源与技术判断

### Alpine.js

Alpine 官方文档把扩展定位为可注册的 custom magic/directive，并要求在 Alpine 初始化前完成
注册；这足以承载一个 OMA 自己的 `$t` 或普通 `t()` 适配层，但官方文档没有提供一个内置
的翻译目录、locale loader 或完整 i18n 体系。[Alpine Extending](https://alpinejs.dev/advanced/extending)

Alpine 的 state 可以在 `x-data` 或全局 `Alpine.store()` 中提供，且依赖状态的表达式会随状态变化
重新计算。因此把当前 locale 放进现有 `platform()` 状态，配合 `t()` 读取 `this.language`，
可以让 `x-text`、`:placeholder`、`:title` 和 `:aria-label` 在切换语言后重新渲染。
[Alpine State](https://alpinejs.dev/essentials/state)

社区的 `alpinejs-i18n` 插件提供 `$t()` 和 `$locale()`，宣称支持变量、嵌套 key、切换后的
自动更新和 CDN 安装，但仓库明确写明它是 “unofficial”，并只声明 Alpine v3 对应 2.x 版本。
[alpinejs-i18n README](https://github.com/rehhouari/alpinejs-i18n)

因此，若追求最少代码可以试用该插件；若考虑 OMA 后续增加 namespace、错误码、格式化和离线
可预测性，自己包一层 i18next 更容易控制初始化、fallback 和安全边界。

### i18next

i18next 官方支持 CDN UMD 构建，并明确建议生产环境固定版本而不是使用 latest。它提供
`init`、`t`、插值、格式化和 plurals，并且支持通过 backend 或直接内嵌资源加载翻译；这些能力
正好覆盖 OMA 的静态 JSON 文件和未来按页面拆分资源的需求。
[i18next Getting Started](https://www.i18next.com/overview/getting-started)

i18next 的 fallback namespace 能让页面专属资源缺少 key 时回退到 common 资源。建议 OMA 第一版
使用 `common`、`chat`、`agents`、`marketplace`、`settings`、`usage` 六个 namespace，先把
跨页面的导航、按钮、通用错误和空状态放进 `common`。
[i18next Namespace Fallback](https://www.i18next.com/principles/fallback)

i18next 的 API 允许组合 backend、localStorage backend、browser language detector 等插件，
但当前项目不需要一次性引入全部插件。第一阶段只需固定版本的 core，加一个简单的本地 JSON
loader或直接加载两份资源；语言已经由 OMA 的 localStorage 选择器管理。
[i18next API](https://www.i18next.com/overview/api)

### daisyUI / Tailwind CSS

daisyUI 官方说明它是 Tailwind CSS 上的 CSS class/component layer，可以和任意 framework 混用，
也可以脱离 Tailwind 使用。它提供 button、card、input、modal 等视觉组件，但不提供文本翻译、
locale state 或翻译资源管理。因此 i18n 应放在 Alpine/JavaScript 层，不能期待通过 DaisyUI
主题解决语言切换。[daisyUI Introduction](https://daisyui.com/docs/intro/)

daisyUI 5 的 release notes 还明确提到可以用于 no-build 的 Alpine.js 项目；这说明引入 i18next
不会要求迁移现有 DaisyUI/Tailwind 结构，也不需要新增前端 bundler。
[daisyUI v5 release notes](https://daisyui.com/docs/v5/)

### 浏览器原生国际化能力

翻译字符串之外，日期、数字和相对时间应使用浏览器标准 `Intl` API，并显式传入 OMA 选择的
locale。MDN 将 `Intl.DateTimeFormat` 和 `Intl.NumberFormat` 标为广泛可用；`Intl` 还覆盖
列表、相对时间等文化敏感格式。[MDN Internationalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Internationalization)

切换语言时还应同步 `document.documentElement.lang`，使用 BCP 47 值如 `en` 和 `zh-CN`。MDN
指出 `lang` 对可访问性很重要，屏幕阅读器会据此选择正确发音。[MDN lang attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang)

### 社区经验

Hacker News 关于前端 i18n 的讨论强调，问题不只是“选哪个库”，还包括翻译上下文、完整句子、
伪语言和布局长度测试。推荐使用完整句子和 pseudo locale 检查硬编码与布局溢出；这对 OMA
的长按钮、空状态和移动端布局尤其重要。[HN: Lessons From Linguistics](https://news.ycombinator.com/item?id=37062755)

另一条 Alpine.js 的 HN 讨论认为 Alpine 适合轻量交互，但当代码和字符串规模持续增长时，缺乏
类型/集中结构会增加长期维护成本。OMA 仍可保留 Alpine，但应把翻译资源集中到 JSON，并通过
key audit 防止继续散落硬编码文案。[HN: Alpine.js](https://news.ycombinator.com/item?id=34365515)

Stack Overflow 的 Alpine.js 高频问题主要集中在如何复用 Alpine data、初始化顺序和响应式绑定，
而不是一个官方 i18n 方案。这与官方 Alpine 的定位一致：翻译应作为 state/extension 层接入，
不是由 DaisyUI 或 Alpine 核心自动完成。[Stack Overflow Alpine.js questions](https://stackoverflow.com/questions/tagged/alpine.js?sort=frequent)

## 推荐架构

```text
Settings select
      |
      v
platform.language + localStorage("oma-language")
      |
      +--> document.documentElement.lang
      +--> i18next.changeLanguage(locale)
      +--> t(key, vars) --------------+
                                      |
     x-text / :placeholder / :title / :aria-label
                                      |
                              rendered interface

static/locales/en.json  <-->  i18next fallback  <-->  static/locales/zh-CN.json
```

建议的实现边界：

1. 第一阶段只支持 `en` 和 `zh-CN`，默认 `en`，未知 locale 回退 `en`。
2. 用稳定 key，不用英文自然语言作为 key，例如 `nav.newTask`、`marketplace.search`、
   `errors.loadWorkspace`。
3. 优先把 `static/index.html` 的静态文本迁移到 `x-text`、`:placeholder`、`:title`、
   `:aria-label`；带图标或复杂 HTML 的地方保留结构，只翻译内部文本节点。
4. `static/app.js` 中所有用户可见的 toast、错误包装、状态文案通过 `t()` 返回；API 错误
   后续可增加稳定 error code，再在前端映射翻译，避免把英文服务器句子当 key。
5. 日期、数字、相对时间 helper 全部使用 `this.locale()` 传给 `Intl`，不再使用 `undefined`。
6. 加入开发期 missing-key 日志和静态 key 审计；生产环境缺失时显示英文 fallback，不显示裸 key。
7. 使用 CSS/伪语言或至少长中文文案做桌面和移动端验收，重点检查按钮、tabs、dialog、侧边栏、
   表格和空状态的溢出。

## 分阶段落地建议

### Phase 1：基础设施与公共文案

引入固定版本 i18next，建立 locale JSON、`t()`、locale 归一化、fallback、`lang` 同步和
`saveLanguage()`。先迁移导航、登录、通用按钮、Settings、空状态、通用错误和日期/数字 helper。

### Phase 2：业务页面

按页面迁移 Chat、Library、Autopilots、Agents、Marketplace、Usage、分享和用户管理文案。
每个页面完成后补静态 key audit 和中文/英文浏览器 smoke check。

### Phase 3：质量与扩展

加入 pseudo locale、缺失 key CI 检查、稳定 API error codes，以及在需要时采用 i18next backend
按 namespace 延迟加载。这个阶段再考虑翻译管理平台，不要在 MVP 中引入远程翻译服务。

## 风险与不建议

- 不建议用 MutationObserver 扫描整个 DOM 后替换自然语言。HN 讨论指出这会与 Alpine 等 DOM
  修改框架产生耦合；显式绑定更容易审计，也更安全。
- 不建议把 Agent/用户内容自动送入翻译服务。它们可能包含敏感信息，且产品语义上不属于 OMA
  界面文案。
- 不建议仅依赖 `navigator.language` 覆盖用户选择。浏览器语言可以作为首次默认值，但显式
  Settings 选择应优先，并持久化到现有 localStorage。
- 不建议让 DaisyUI theme 或 Tailwind class 承担语言职责；它们只处理样式和布局。

## 最终建议

采用 i18next core，但在 OMA 内部只暴露一个很薄的 `t()` 和 locale formatter API；不直接把
第三方插件 API 散落到 HTML。保留 Alpine 单组件架构，翻译资源集中在 `static/locales/`，
按 namespace 组织，先完成 English/简体中文的完整界面覆盖，再扩展其他语言。
