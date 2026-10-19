# Frontend architecture and compatibility

## One frontend, one production server

OMA Studio keeps Alpine.js for interaction, DaisyUI 5 for components, Lucide for
icons and the existing OMA theme/custom styles. Vite builds them; FastAPI serves
the generated HTML and `/static` resources. There is no runtime Node/Vite server
and no framework/UI redesign in this migration.

```text
frontend/index.html             existing Alpine templates
frontend/src/platform.js        existing application state and interactions
frontend/src/main.js            one explicit dependency/Alpine boot sequence
frontend/src/browser.js         shared UUID/clipboard integration
frontend/src/ui/code-themes.js  locally bundled highlight.js themes
frontend/input.css              Tailwind + DaisyUI + typography entry
frontend/src/styles.css         existing OMA tokens/layouts/touch styles
static/                        public images and locale JSON
.browserslistrc                  shared JS/polyfill/CSS targets
vite.config.js                  production build
          ↓ npm ci && npm run build
dist/                          complete generated frontend (gitignored)
          ↓ app/frontend.py + FastAPI
/chat, /agents, /share/*        generated SPA shell + escaped social metadata
/static/assets/*               immutable content-hashed build dependencies
/static/locales/*, images       revalidated public files
```

Always deploy a complete build. `dist/` contains no credentials; it is created
in Docker's Node build stage and copied into the runtime image. An absent build
fails startup with the required setup command. Share metadata markers remain in
the generated shell. The server re-reads the shell/build manifest when they
change, so the build watcher works with the same FastAPI process.

## Commands

Node >=22.12 and Python >=3.11 are required. The Docker build pins Node 24.

```sh
npm ci
npm run build
uv sync
uv run uvicorn app.main:app --env-file .env --reload
# Separate terminal: rebuild assets on source edits, still served by FastAPI.
npm run dev
```

`npm run dev` is intentionally `vite build --watch`: browser tests and local
Safari use the same generated syntax/polyfill/CSS pipeline as production. The
legacy plugin's production polyfills are not silently omitted by a second dev
server. Refresh after an asset rebuild. `build:css` is a compatibility alias for
the complete build; never hand-edit generated CSS or commit `dist/`.

```sh
npm run format
npm run format:check
npm run lint
npm run build
uv run pytest -q
npm run test:frontend:install
npm run test:frontend
```

Browser tests launch an isolated FastAPI instance with temporary SQLite,
sessions/workspace/logs and disposable credentials. They do not send prompts to
Pi or mutate production. Failure traces/screenshots live in ignored
`test-results/` and `playwright-report/`; CI uploads them on failure.

## Browser policy

The current minimum is Safari / iOS / iPadOS 16.4, Chrome / Edge 111 and Firefox
128, expressed in **one** `.browserslistrc`. Keep it consistent with the explicit
unsupported-browser notice. Changing the floor requires checking the component
and CSS stack, not just the JavaScript compiler.

ESLint's compatibility rule reads the same Browserslist and flags known unsupported Web API calls in application source. Its API/receiver-analysis coverage is not complete; it complements compilation and browser tests rather than certifying every DOM call. Standard-library polyfills do not make an unsupported DOM API available.

Three distinct layers are handled centrally:

1. Vite compiles JavaScript syntax for the configured targets.
2. Official `@vitejs/plugin-legacy` modern-polyfill mode scans the final graph
   (application plus dependencies) and emits required core-js polyfills before
   the entry point. Explicit targets prevent an arbitrary bleeding-edge
   polyfill bundle. No IE/SystemJS bundle is shipped.
3. Tailwind's Vite plugin compiles DaisyUI, typography and utilities ahead of
   time; Lightning CSS processes styles for the same targets. No browser-time
   Tailwind compiler or external script/style CDN is required.

For browser/OS APIs outside ECMAScript, use `browser.js`: UUIDs come from the
maintained `uuid` implementation and clipboard writes from `clipboard-polyfill`.
Provider code should not reintroduce browser-name checks or independent copy/ID
fallbacks. Secure contexts, OS permissions, keyboard/viewport behavior and
engine bugs are not solved by core-js. Retain existing touch/safe-area rules and
real-device checks.

Chromium, Firefox, desktop WebKit and mobile WebKit projects validate boot with
external scripts/styles blocked, missing native randomUUID, dynamic Lucide icons,
settings/theme/language flows, file-input hiding, sanitized Markdown/highlighting,
Mermaid chunks, request IDs, deep links and cache behavior. Latest Playwright
WebKit **does not certify historical Safari 16.4 or real iOS keyboard/file-picker
behavior**. Use the device checklist in safari-ipad-compatibility.md before
claiming a specific older device is verified.

## Component and dependency rules

- DaisyUI is the single CSS component library. Preserve the existing markup,
  light/dark OMA tokens, layouts and interactions. Use existing semantic colors
  and component classes instead of adding another visual library.
- Use Lucide `data-lucide` attributes everywhere, including dynamic markup. The
  existing `renderIcons`/observer remains the single render path; npm replaces
  the former UMD CDN global behind that boundary.
- Put Tailwind utility names in complete literal strings in scanned HTML/JS.
  Do not construct names such as `bg-${color}`; map states to full class names.
- Alpine evaluates directive expressions from HTML at runtime; Vite does not
  transpile JavaScript stored in HTML strings. Keep those expressions simple and
  within the support baseline, and put complex/new-language logic in compiled
  modules.
- Keep shared browser integrations and boot wiring outside platform state;
  avoid adding a new framework or splitting unrelated feature logic during
  compatibility work.
- Markdown and generated highlights remain DOMPurify-sanitized. Do not inject
  untrusted HTML to bypass rendering incompatibilities.
- Dependencies and npm lockfile define the deployed versions. Update them
  deliberately, rebuild, run the cross-engine suite and compare existing UI
  before publishing. Never reintroduce floating CDN majors.
- Vite hashes replace manual `?v=` increments for compiled JS/CSS. Public locale
  and image files are revalidated. No-cache HTML avoids referencing an obsolete
  build from a browser's shell cache.

## References

- Vite build and polyfill boundary: https://vite.dev/guide/build.html
- Official legacy plugin: https://github.com/vitejs/vite/tree/main/packages/plugin-legacy
- Tailwind CSS compatibility: https://tailwindcss.com/docs/compatibility
- Alpine npm boot sequence: https://alpinejs.dev/essentials/installation
