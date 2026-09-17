# Safari 文件上传选择框 Bug — 调查报告

> 调查时间：2026-09-17
> 结论：**Safari 兼容性问题**（@layer + 内联 class="hidden" 交互）

---

## 1. 问题描述

Safari 在 OMA Studio 的 new chat 首页显示了一个文件上传选择框（file picker），Chrome 不显示。

---

## 2. 代码分析

### 文件上传 input 位置

`static/index.html` 第 292-300 行：

```html
<input
  x-ref="uploadInput"
  class="hidden"          <!-- 依赖 Tailwind CSS 的 .hidden 工具类 -->
  type="file"
  multiple
  @change="handleUploadSelection($event)"
  :disabled="uploadingFiles"
  :aria-label="t('chat.browseFiles')"
/>
```

**这是全项目唯一一处使用 `class="hidden"` 的地方。**

### 控制逻辑

- Alpine.js 通过 `this.$refs.uploadInput` 在 JS 中触发文件选择（`app.js` 第 1095 行附近）
- input 元素始终在 DOM 中，靠 CSS `display: none` 隐藏
- 没有 `x-show` 或 `x-if` 控制其可见性

---

## 3. 根因判断

### 这是 Safari 兼容性问题，不是通用 bug

### 根因：Tailwind CDN v4 的 `@layer` + Safari < 17.2

**证据链：**

1. **Tailwind CDN v4** 将 `.hidden { display: none }` 放在 `@layer utilities` 内注入（通过 JS 运行时扫描 class 名生成）
2. **CSS `@layer` 语法** Safari 17.2+（2024年3月）才支持
3. **Safari < 17.2** 不理解 `@layer`，`.hidden` 规则被忽略，input 可见
4. **Chrome** 和 **Safari 17.2+** 支持 `@layer`，`.hidden` 生效，input 隐藏

### DaisyUI 不帮助

- DaisyUI v5 CSS 中**没有** `.hidden` class 规则
- DaisyUI v5 CSS 中**没有** `[hidden]` attribute 规则
- DaisyUI 完全不处理 `hidden` 相关的 CSS

### Tailwind 的 `[hidden]` attribute 规则存在但不生效

Tailwind CDN 的 preflight CSS 中有：

```css
[hidden]:where(:not([hidden='until-found'])) {
  display: none !important;
}
```

但代码用的是 `class="hidden"`（CSS 类），不是 `hidden`（HTML 属性），所以这个规则**不匹配**。

### 为什么 Chrome 没问题

Chrome 支持 `@layer`（Chrome 99+，2022年），`.hidden` 在 `@layer utilities` 中正常生效。

---

## 4. 修复方案

### 推荐方案：改用 `hidden` HTML 属性

**修改文件：** `static/index.html` 第 294 行

```diff
  <input
    x-ref="uploadInput"
-   class="hidden"
+   hidden
    type="file"
    multiple
```

**原因：**
- Tailwind 的 preflight 已经为 `[hidden]` HTML 属性生成了 `display: none !important`
- 该规则在 `@layer base` 中，Safari < 17.2 也会生效（`@layer` 中的 base 规则会被视为无层规则）
- 语义更准确：`hidden` 属性就是用来隐藏元素的
- 不依赖 Tailwind 的运行时 class 扫描

### 备选方案：内联样式

```diff
  <input
    x-ref="uploadInput"
-   class="hidden"
+   style="display:none"
    type="file"
    multiple
```

**优点：** 100% 兼容，不受 `@layer` 影响
**缺点：** 不够语义化，且如果 Tailwind 的 `@layer utilities` 中的 `.hidden` 生效，会产生重复声明

### 备选方案：CSS 规则补充

在 `static/styles.css` 中添加：

```css
.hidden {
  display: none;
}
```

**优点：** 所有使用 `class="hidden"` 的地方都会生效
**缺点：** 与 Tailwind 的 `@layer utilities` 中的 `.hidden` 重复；且 `class="hidden"` 可能还有语义问题（Tailwind 生成的 `.hidden` 在 `@layer` 中，项目 CSS 中无层规则会覆盖 `@layer` 规则）

### 推荐选择

**方案 1（`hidden` HTML 属性）最佳：** 一行改动，语义正确，兼容所有浏览器版本。

---

## 5. 附带发现

### Tailwind CDN v4 的 @layer 在 Safari < 17.2 的普遍影响

这个问题不仅仅是 file input。Tailwind CDN v4 的所有工具类都在 `@layer utilities` 中：
- `.flex`, `.grid`, `.block`, `.hidden` 等
- `.text-*`, `.bg-*`, `.p-*`, `.m-*` 等

在 Safari < 17.2 中，**如果 Tailwind CDN 的 JS 运行时扫描延迟**（比如首屏渲染时），这些 utility class 可能短暂不可用。这是一个广泛存在的兼容性问题，file input 只是第一个被发现的实例。

### 建议

如果项目要支持 Safari 15.4+（之前报告中推荐的最低版本），建议：

1. 所有用 `class="hidden"` 隐藏元素的地方，改用 `hidden` HTML 属性
2. 考虑在 `styles.css` 中为关键 utility class 添加 fallback 规则
3. 或者重新评估是否需要 Tailwind CDN 的运行时扫描——改用构建时生成（`npm run build:css` 已经生成 typography.css，但只包含 typography 相关）
