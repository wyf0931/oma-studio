# Safari / iPadOS compatibility

Updated 2026-10-19 for the owner-authorized Vite architecture upgrade (#171).
The old CDN-only strategy and its prohibition on adding a build pipeline are
superseded. The UI/UX, OMA theme and existing touch/viewport rules are retained.

## Support baseline

Safari / iOS / iPadOS **16.4+**, Chrome / Edge 111+, Firefox 128+. The authoritative
build targets live in `.browserslistrc`; source and build instructions are in
[frontend-architecture.md](frontend-architecture.md).

- Vite compiles syntax to the configured targets.
- Official legacy-plugin modern-polyfill mode generates usage-based core-js
  support for application and dependency code before Alpine starts.
- Tailwind 4, DaisyUI 5 and typography compile ahead of time; Lightning CSS
  processes the generated styles for those same targets.
- Locked npm packages replace floating CDN dependencies. Browser-time Tailwind
  compilation and external application script/style CDN requests are removed.
- UUID and clipboard integration use one shared browser module.

The CSS/component baseline still applies: JavaScript polyfills do not implement
CSS color-mix/oklch, layout engines, touch keyboards or secure-context APIs.
Supporting a lower floor requires a new CSS/component compatibility assessment,
not simply changing the Vite target or importing all of core-js.

## Existing device-specific behavior retained

- Pair layout `100vh` heights with `100dvh` companions.
- Keep iOS-only 16px compact-control overrides to avoid focus zoom without
  changing desktop typography.
- Keep the iOS touch gate, tap-highlight and text-size-adjust declarations.
- Keep hover-revealed card actions visible on iOS; do not rely on hover media
  queries alone for touch devices.
- Preserve backdrop-filter prefixes, safe areas, overscroll containment and
  the existing dismissible unsupported-browser notice.

`tests/unit/test_style_compat.py` retains these source contracts. The build now
also rejects malformed CSS instead of leaving recovery to different engines.
The existing null file-viewer expressions are guarded under #163, allowing
cross-engine page-error checks to fail on regressions instead of ignoring them.

## Automated checks

`npm run test:frontend` runs Chromium, Firefox, desktop WebKit and mobile WebKit
against built assets and an isolated FastAPI process. It checks locally served
boot, missing native randomUUID, Lucide, settings/themes/languages, Markdown
sanitization/highlighting, Mermaid, file inputs, deep links and cache behavior.

Latest Playwright WebKit is **not** historical Safari 16.4, and simulated mobile
metrics do not reproduce all real OS keyboard/file-picker behavior. Do not label
a hardware scenario verified solely because those projects pass.

## Real-device checklist

Before a Safari-sensitive UI release, connect the device via Safari's Develop
menu and check:

1. Focus composer/title/search/theme controls: no unexpected zoom or horizontal
   displacement.
2. With the soft keyboard open, the caret/composer remain visible; inspect
   visualViewport if this fails. OS regressions require device evidence.
3. Rotate portrait/landscape in conversations, library and dialogs: content
   reflows without clipped headers/composers.
4. Card actions activate with one tap and remain accessible without hover.
5. Select/upload a file through the OS picker; no duplicate visible file input.
6. Open share/settings/file dialogs: inner scrolling stays contained and the
   background does not scroll unexpectedly.
7. Check safe areas around the home indicator and landscape screen edges.
8. On a below-baseline device, verify the existing notice is legible/dismissible.

Historical reports (`safari-compatibility-research.md`,
`safari-file-upload-bug.md`) preserve prior investigations, including unverified
causal claims. They do not override the current build policy or browser support
data. In particular, older claims that CSS cascade layers first appeared in
Safari 17.2 were incorrect; do not use them to choose a support floor.

References:
- https://tailwindcss.com/docs/compatibility
- https://vite.dev/guide/build.html
- https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/layer.json
