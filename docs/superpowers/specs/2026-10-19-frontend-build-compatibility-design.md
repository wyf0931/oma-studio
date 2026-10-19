# Frontend build and browser compatibility (#171)

The product owner requested a focused architecture upgrade with an active goal, a separate branch, and no UI/UX changes. This explicitly authorizes introducing a build system while retaining FastAPI as the single production server.

## Choice

Use Vite with the existing Alpine.js + DaisyUI 5 + Tailwind 4 + Lucide stack. A full React/Vue and visual component-library rewrite would add behavioral and visual risk without addressing CSS/engine compatibility by itself. Adding polyfills to the old CDN setup would retain runtime compilation, floating dependencies and uncontrolled boot order. The selected solution centralizes dependencies, compilation, support policy and regression gates.

## Source and serving

Frontend HTML, application logic and styles live under frontend/; static/ retains public images/locales. Vite emits an ignored dist/ directory containing the complete deployable frontend. npm dependencies are versioned and locked, and scripts/styles execute locally without CDN compilation. FastAPI serves /static from dist and uses dist/index.html for deep links and escaped share metadata. Missing builds produce an actionable setup error. Development uses a build watcher with the same FastAPI server; an optional Vite development command may proxy the API without changing production architecture.

## Compatibility policy

Retain the existing minimum Safari/iOS/iPadOS 16.4, Chrome/Edge 111 and Firefox 128. Older versions are not added to this change. One browser-target configuration drives JavaScript compilation and core-js-backed usage-based polyfill generation via the official Vite legacy plugin's modern-polyfill mode. No unneeded IE/SystemJS bundle is emitted. CSS is compiled at build time through Tailwind's Vite integration, including DaisyUI and typography, and browser-targeted CSS processing. Preserve existing theme tokens, custom rules, touch/viewport behavior and markup.

JavaScript syntax transforms, standard-library polyfills and browser/OS APIs are separate layers. core-js does not implement CSS, soft keyboards, secure-context requirements or WebKit engine fixes. Centralize the few required platform operations (UUID/clipboard if existing call sites need them) behind a small tested browser integration module rather than scattering new browser branches. Keep current UI flows and feedback. Do not claim that latest Playwright WebKit tests verify historical Safari 16.4 or real iOS keyboard behavior.

## Component and boot conventions

DaisyUI remains the single CSS component library, with existing custom OMA tokens and selectors retained. Lucide is bundled from npm and still renders data-lucide nodes through the existing helper/observer. A single entry installs compatibility support and dependencies before registering/starting Alpine once; public Markdown rendering remains DOMPurify-sanitized. Keep heavy Mermaid/highlight functionality compatible with current content and themes. Preserve template references and do not introduce a second UI framework, handwritten SVG icon system or new visible settings.

## Delivery and validation

Docker builds assets in a dedicated Node build stage and copies only output into the runtime. CI installs locked dependencies, validates format/build, runs Python checks and executes Playwright projects for Chromium/Firefox/WebKit. Browser tests use isolated local state and deterministic fixtures; cover login, navigation, settings, theme/language, file input, Markdown/diagram rendering, generated icons, deep links and share pages. Compare desktop/mobile screenshots and computed geometry to pre-upgrade captures. Coordinate the existing null fileViewer expressions with #163 so the regression suite can enforce no page errors.

Update AGENTS.md, README and Safari docs to the new source/build layout, commands, support floor and upgrade procedure. Old research documents are historical evidence rather than authoritative browser-support tables; correct obsolete claims by linking the new policy. Do not commit generated dist assets, node_modules, credentials or test runtime data. No merge/push/deployment is included in this job without a later request.


## Validation evidence

- Fresh `npm ci`, format check, Web API compatibility lint and a negative policy probe passed. The probe confirms the lint configuration flags a known unsupported API; static receiver/API coverage is not exhaustive.
- Vite production build passed, emitting local content-hashed JS/CSS and an automatically selected 64 KB (about 23 KB gzip) polyfill chunk. No external application script/style CDN is needed. Some Mermaid/icon-related chunks remain above Vite's advisory 500 KB size threshold; no artificial threshold increase hides the warning.
- Ruff format/check, Pyright (0 errors/warnings), 263 Python tests and git diff --check passed.
- All 24 Playwright cases passed across Chromium, Firefox, desktop WebKit and mobile WebKit: boot with external dependencies blocked, missing native UUID/clipboard APIs, copy feedback, navigation/deep-link reload, file selection, settings/light-dark/language, sanitized Markdown/highlighting, Mermaid and cache/request-ID behavior. No page errors were allowed.
- A markup comparison confirmed all 1,577 body element/attribute entries are retained, except null-safe fileViewer access coordinated with #163. Desktop settings/input/menu geometry, font sizes, radii, colors and spacing matched the pre-upgrade captures; desktop/mobile screenshots were inspected.
- Build-watch round trip passed against a running FastAPI process: a temporary non-visible HTML marker appeared after rebuild without restarting the server, and disappeared after source restoration/rebuild. The marker is not in the submitted source or build.
- Local Docker daemon is unavailable. The multi-stage Dockerfile and build context were updated/reviewed, but the image itself was not built locally. CI YAML parses and includes build/lint/browser gates; the new workflow has not run remotely because this branch has not been pushed.
- Historical Safari 16.4 hardware and real iOS keyboard/OS-picker interactions were not tested. Latest Playwright WebKit is not presented as historical device certification.
