# Frontend architecture and compatibility

## One frontend, one production server

Vue 3 SFCs and strict TypeScript implement the OMA interface. DaisyUI 5/Tailwind 4
and existing OMA styles define appearance; Lucide is the only icon system. Vite
builds the app and FastAPI serves the generated HTML and `/static` resources.
There is no production Node/Vite server, SSR or separate frontend service.

```text
frontend/index.html        static shell and share metadata markers
frontend/src/main.ts       Vue/bootstrap and CSS entry
frontend/src/app/          composition, scoped reactive bindings, lifecycle
frontend/src/features/     feature views, state factories, typed actions
frontend/src/shared/       transport, rendering, i18n, DOM helpers and DTOs
frontend/src/ui/           Lucide Vue wrapper and content event adapters
frontend/src/styles.css    existing OMA tokens/layouts/touch styles
frontend/input.css         Tailwind + DaisyUI + typography entry
static/                    public images and locale JSON
.browserslistrc             shared JS/polyfill/CSS targets
          ↓ npm ci && npm run build (vue-tsc, then Vite)
dist/                      complete generated frontend (gitignored)
          ↓ app/frontend.py + FastAPI
/chat, /agents, /share/*    generated SPA shell + escaped social metadata
/static/assets/*           immutable content-hashed dependencies
```

Always deploy a complete build. Docker's Node stage builds `dist/`; the runtime
image serves it through FastAPI. An absent build fails startup with the required
setup command. The backend re-reads the shell/build manifest when they change,
so the watcher works with the same FastAPI process.

## Feature boundaries

Identity, chat, agents, marketplace, artifacts, autopilots, shares, settings and
usage have separate state/action modules and Vue views. Rendering, transport,
localization, formatting and DOM integration are separate reusable capabilities.

Each mount constructs fresh feature state. The initial migration binds typed
feature actions at a private composition root to preserve existing orchestration;
there is no `window.omaPlatform` or singleton application store. Actions declare
explicit dependency contracts, and views request named reactive references.
Add behavior to its owning module rather than adding an unrelated root method.
Prefer concrete interfaces and props/emits when extracting reusable components;
do not pass the entire workspace to components or expose it on window.

The current History API routes remain in the application module. Pinia, Vue
Router and SSR are not required for this migration. They need a concrete use case
before introduction.

## Commands and checks

Node >=22.12 and Python >=3.11 are required. Docker pins Node 24.

```sh
npm ci
npm run typecheck
npm run lint
npm run test:typecheck:policy
npm run test:compatibility:policy
npm run build
uv sync
uv run uvicorn app.main:app --env-file .env --reload
# Separate terminal: rebuild assets on edits; FastAPI continues serving them.
npm run dev
npm run format
npm run format:check
uv run pytest -q
npm run test:frontend:install
npm run test:frontend
```

`build` runs `vue-tsc --noEmit` before Vite. Vite only transpiles TypeScript;
its successful build alone does not prove type correctness. Strict templates and
strict TS (including checked indexed access) cover scripts and component bindings.
The typecheck policy test demonstrates failure for broken templates, props, API
fields and imports. DTOs currently describe local endpoint contracts; they do not
validate arbitrary network JSON or replace backend response validation.

`npm run dev` remains `vite build --watch`, preserving the production compatibility
pipeline. For continuous type feedback, run `npm run typecheck -- --watch` in
another terminal. The publishing build always checks types. Refresh after rebuild;
do not hand-edit generated CSS or commit `dist/`.

## Browser policy

The minimum remains Safari/iOS/iPadOS 16.4, Chrome/Edge 111 and Firefox 128,
expressed in one `.browserslistrc`. Keep the unsupported-browser notice consistent.
Vite handles syntax, the official legacy plugin emits modern core-js polyfills,
and Lightning CSS processes Tailwind/DaisyUI output for the same targets.
No IE/SystemJS bundle or browser-time Tailwind compiler is shipped.

ESLint compatibility rules cover authored TS and Vue scripts. Their receiver/API
analysis is incomplete; policy probes and real browser tests complement them.
Use the shared browser adapter for UUIDs and clipboard writes; avoid independent
fallbacks or browser-name sniffing. OS permissions, keyboard behavior and engine
bugs cannot be solved by ECMAScript polyfills.

Playwright starts an isolated FastAPI instance with temporary data/workspace/logs
and disposable credentials. Tests do not send prompts to Pi. Failure evidence is
stored in ignored `test-results/` and `playwright-report/`. Chromium, Firefox,
desktop WebKit and mobile WebKit cover boot, settings, navigation, rendering,
clipboard, Agent editing and fixture streaming. Latest WebKit does not certify
historical Safari 16.4 or real iOS keyboards/file pickers; retain the device checklist
in safari-ipad-compatibility.md.

## Rendering and dependency rules

- DaisyUI is the sole CSS component library. Preserve OMA colors, layout and
  interactions. Use literal Tailwind class names in scanned `.vue`/`.ts` sources.
- Vue templates use the shared `OmaIcon` wrapper around official `@lucide/vue`.
  Dynamic HTML uses `data-lucide` with the single scoped post-render helper.
  Imperative icon replacement must not touch Vue-owned SVG nodes.
- Dynamic HTML is not compiled as Vue templates. Retain DOMPurify, structured
  state and short markup keys. Delegate only known content controls; never embed
  raw JSON in attributes or window application callbacks in generated HTML.
- Scope Mermaid/icon processing to content containers. Release streams, timers,
  observers and listeners at the lifecycle boundary that owns them.
- Keep import dependencies explicit, avoid `any` and broad suppression, and use
  unknown at untyped external boundaries. Type assertions do not validate JSON.
- Keep global CSS order stable while migrating. Do not apply scoped styles to
  the entire old stylesheet or introduce a replacement component library.
- Lock dependencies, rebuild, run cross-engine tests and inspect screenshots
  before publishing. Vite hashes replace manual JS/CSS cache tokens; HTML remains
  no-cache and public images/locale JSON remain revalidated.

References: [Vue TypeScript](https://vuejs.org/guide/typescript/overview),
[Vite build](https://vite.dev/guide/build.html),
[DaisyUI Vue](https://daisyui.com/docs/install/vue/),
[Lucide v1](https://lucide.dev/guide/version-1).
