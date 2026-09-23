# Safari / iPadOS compatibility

Knowledge base and device checklist for the static frontend (`static/`). Written
2026-09-22 after an audit of iPad Safari defects (issue #161). Update it whenever
a new Safari-specific fix lands or a pitfall is confirmed on a device.

## 1. Support baseline: Safari / iPadOS ≥ 16.4

The stack pins this floor implicitly, so it is now explicit:

| Dependency | Requirement | Why it matters for us |
| --- | --- | --- |
| `@tailwindcss/browser@4` (CDN, `static/index.html`) | **Safari 16.4** (Tailwind v4 documented floor, alongside Chrome 111 / Firefox 128) | Tailwind 4 emits `@property`, `@layer`, `color-mix()` and `oklch()` |
| `daisyui@5` (CDN) | modern engines | theme tokens are `oklch()` |
| `static/typography.css` (Tailwind CLI output) | same floor | minified output contains `@property` / `@layer` / `oklch()` / `color-mix()` |
| `static/styles.css` (hand-written) | `oklch()` ×39, `color-mix()` ×9, `:has()` ×10 | the `:has()` rules are load-bearing for the chat layout (`.content-panel:has(.conversation) .message-list`) |

On an engine below that floor the UI cannot be made correct piecemeal: `@property`
breaks Tailwind's variable plumbing, `color-mix()` breaks colours, and `:has()`
breaks the chat layout. Instead of shipping a broken screen, the app shows a
dismissible notice:

- markup: `div.unsupported-browser` (first element in `<body>`, `static/index.html`)
- CSS: gated by `@supports not (color: color-mix(in oklab, red, blue))` in
  `static/styles.css`; the "Close" checkbox dismisses it with no JavaScript
  (`:has(.unsupported-browser-dismiss:checked)`).
- copy: `common.unsupportedBrowser` in `static/locales/{en,zh-CN}.json`

Supporting iPadOS < 16.4 would mean abandoning Tailwind 4 and reintroducing a
CSS build pipeline — a deliberate non-goal (see §4).

## 2. Pitfall catalogue (community-sourced, mapped to our code)

| Pitfall | Symptom on iPad | Our status | Sources |
| --- | --- | --- | --- |
| `100vh` is the *large* viewport | address bar / keyboard changes the visible height → composer pushed out of view, double scrollbars | **fixed**: every layout height now pairs `100vh` with a `100dvh` companion | SO [37112218](https://stackoverflow.com/questions/37112218/css3-100vh-not-constant-in-mobile-browser), [74144034](https://stackoverflow.com/questions/74144034/why-is-the-css-height100vh-rule-exceeding-the-viewport-height-on-mobile-device), [58886797](https://stackoverflow.com/questions/58886797/how-to-access-the-real-100vh-on-ios-in-css); caniuse [viewport-unit-variants](https://caniuse.com/viewport-unit-variants) |
| Soft keyboard overlays fixed/sticky bottom bars | the composer is covered while typing | **not fixed** — needs device evidence, then a ~10-line `visualViewport` handler (`--keyboard-inset`) | SO [43833049](https://stackoverflow.com/questions/43833049/how-to-make-fixed-content-go-above-ios-keyboard), [48320336](https://stackoverflow.com/questions/48320336/how-to-keep-fixed-html-element-visible-on-bottom-of-screen-when-the-soft-keyboar), [79758083](https://stackoverflow.com/questions/79758083/ios-26-safari-visualviewport-change-after-dismissing-keyboard) |
| iOS 26 fixed/sticky displacement regression | fixed elements drift as you scroll | **watch** — documented in the checklist; only restructure if it reproduces | SO [79753701](https://stackoverflow.com/questions/79753701/ios-26-safari-web-layouts-are-breaking-due-to-fixed-sticky-position-elements-g), WebKit [297779](https://bugs.webkit.org/show_bug.cgi?id=297779) |
| Focus-zoom on fields below 16px | tapping an input zooms the page and offsets the layout | **fixed on iOS only**: the five compact controls are raised to 16px inside the `-webkit-touch-callout` block, so desktop/Chrome sizing is untouched | iOS Safari behaviour (documented in the test) |
| Sticky `:hover` on touch, hover-revealed actions | first tap only "enters hover"; delete/publish appear to need two taps | **fixed**: the three hover-revealed card actions are always visible on iOS | WebKit [209292](https://bugs.webkit.org/show_bug.cgi?id=209292), r/webdev [g5gdlz](https://www.reddit.com/r/webdev/comments/g5gdlz/fyi_ipad_does_not_handle_pointerhover_media/) |
| `pointer` / `hover` media queries unreliable on iPad | `@media (hover: hover)` gating cannot be trusted | **avoided**: the iOS path is gated by `@supports (-webkit-touch-callout: none)` instead | r/webdev above, [humanwhocodes](https://humanwhocodes.com/blog/2012/07/05/ios-has-a-hover-problem/) |
| Missing touch primitives | tap flash, double-tap zoom, accidental text selection | **fixed**: `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `-webkit-text-size-adjust: 100%` | iOS Safari conventions |
| `backdrop-filter` needs the `-webkit-` prefix below Safari 18 | blur silently ignored | **fixed**: every `backdrop-filter` now has a `-webkit-` companion, enforced by test | caniuse / WebKit |
| `overflow: hidden` on `body` is not a scroll lock on iOS | background scrolls behind dialogs | **partly**: we use native `<dialog>` + `overscroll-behavior: contain` on `.modal-box`; verify per dialog | WebKit [153852](https://bugs.webkit.org/show_bug.cgi?id=153852) |
| `oklch()` / `color-mix()` / `@property` / `:has()` | colours collapse, utilities stop applying, chat layout breaks | **baseline**: Safari 16.4+; below that the notice is shown | Tailwind [compatibility](https://tailwindcss.com/docs/compatibility), r/tailwindcss [1j5a3r8](https://www.reddit.com/r/tailwindcss/comments/1j5a3r8/tailwind_v4_colors_not_working_on_older_ios/), caniuse oklch / color-mix |
| Breakpoints flip on rotation | iPad portrait (768px) uses the `max-width: 800px` chrome, landscape (1024px) uses the desktop chrome | **accepted**: no change, but it explains layout differences between orientations | our own `@media` audit |

Background reading on the general "Safari is the new IE" debate (useful context,
not action): HN [9804533](https://news.ycombinator.com/item?id=9804533),
[27968394](https://news.ycombinator.com/item?id=27968394),
[42167749](https://news.ycombinator.com/item?id=42167749).

## 3. What this pass changed

| Change | Where |
| --- | --- |
| `100vh` → `vh` + `dvh` companion pairs (17 sites) | `static/styles.css` |
| Form-control focus-zoom floor raised **inside the iOS block only** (`.agent-select`, `.theme-picker .select`, `.composer textarea`, `.chat-title-input`, `.library-search input`); desktop and Chrome keep their 12–15px sizes | `static/styles.css` |
| iOS/iPadOS touch block (`@supports (-webkit-touch-callout: none)`): text-size-adjust, tap highlight, `touch-action`, the 16px control floor, always-visible card actions | `static/styles.css` |
| `-webkit-backdrop-filter` companion | `static/styles.css` (`backdrop-filter: none`) |
| `overscroll-behavior: contain` on `.modal-box`; `min-height: 0` on `.message-list` | `static/styles.css` |
| Unsupported-browser notice (CSS-gated, CSS-dismissible) + copy | `static/index.html`, `static/styles.css`, `static/locales/*` |
| Executable contract | `tests/unit/test_style_compat.py` |

## 4. Non-goals

- Legacy build for iPadOS < 16.4 (see §1).
- New dependencies, polyfill libraries, or a CSS preprocessor.
- Layout redesign, or `position: fixed` → `sticky` restructuring without device
  evidence that the iOS 26 drift bug reaches us.
- **Changing the desktop (Chrome) rendering.** Safari support is incremental:
  every fix here is either inert on Chrome (`100dvh` equals `100vh` without a
  dynamic browser UI, `-webkit-touch-callout` never matches, the below-baseline
  notice stays hidden because Chrome supports `color-mix()`) or scoped inside
  the iOS-only block. The one shared change is `overscroll-behavior: contain` on
  `.modal-box`, which also improves Chrome's dialog behaviour.

## 5. Device checklist (run on a real iPad before a UI release)

Safari's Responsive Design Mode and the iOS Simulator do **not** reproduce the
viewport/keyboard/scroll behaviours below, so this needs hardware. Connect the
iPad over USB and open **Develop → [iPad] → the page** in desktop Safari to
inspect the live DOM, console and `visualViewport`.

1. **Focus zoom** — tap the composer, the chat title, the library search and the
   theme picker: the page must not zoom or shift horizontally.
2. **Keyboard** — focus the composer at the bottom of a long conversation: the
   composer and the caret stay visible above the keyboard; no page-level
   horizontal scroll while typing.
3. **Orientation** — rotate portrait ↔ landscape on a conversation, the library
   and a dialog: layout reflows, header/composer stay pinned, no clipped content.
4. **Touch actions** — on the Agents page, the card's delete/publish/update
   controls are visible without a first "hover" tap, and a single tap activates
   them.
5. **Long press** — long-pressing a card, button or icon does not select text or
   trigger the callout menu.
6. **Dialogs** — open the share, publish, settings and file-view dialogs: the
   background does not scroll behind them, and swipe inside the dialog does not
   chain to the page.
7. **Safe areas** — with `viewport-fit=cover`, nothing important sits under the
   home indicator (check the composer and any bottom-fixed bar in landscape).
8. **Baseline notice** — if you can reach an older iPadOS (< 16.4), confirm the
   notice is legible and dismissible.

## 6. Executable contract

`tests/unit/test_style_compat.py` fails when a change silently breaks the
baseline assumptions: a layout height loses its `dvh` companion, a
`backdrop-filter` loses its `-webkit-` prefix, a form control drops below 16px,
the iOS touch block loses a declaration, or the unsupported-browser notice loses
its gate/markup/copy. Extend that file (cheaply, with substring/rule scans — the
pattern used by `tests/unit/test_deploy_config.py`) rather than adding prose.
