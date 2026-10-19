# Vue and TypeScript frontend migration

## Approved direction

Replace Alpine with Vue 3 single-file components and strict TypeScript. Keep FastAPI as the sole production server, Vite as the build pipeline, the existing OMA UI, Tailwind 4/DaisyUI 5, Lucide, i18next, and the sanitized Markdown/rendering stack. No SSR, Pinia, additional production server, API redesign, or persistence change.

## Module ownership

`app/` composes one application instance and its lifecycle. Feature directories own fresh state factories, explicitly typed action interfaces, and Vue views: identity, chat, agents, marketplace, artifacts, autopilots, shares, settings, usage. Rendering, localization, transport, formatting, and DOM integration have separate modules.

The initial migration preserves existing orchestration with bound action modules. Each action module declares a `Pick<Workspace, ...>` dependency contract; each view obtains only named reactive references through `useWorkspaceScope`. The workspace is a private per-mount composition object, not a window global or persistent singleton. This avoids rewriting streaming behavior during the framework replacement. Future changes should reduce cross-feature dependencies through concrete typed interfaces rather than expanding that composition object into a universal store.

Transport payloads default to unknown; endpoint consumers declare response shapes. These TypeScript contracts are maintained locally in this phase, not generated from incomplete backend OpenAPI responses. They describe compile-time expectations and do not validate arbitrary JSON. Streaming events have a discriminated union; external payload validation remains a separate runtime boundary.

## Rendering and lifecycle

Compile all authored templates as Vue SFCs. Render template icons with the official Lucide Vue package. Confine imperative Lucide/Mermaid processing to dynamic-content containers. Preserve DOMPurify sanitization. Dynamic HTML never becomes an executable Vue template and contains no handlers referencing a window application object; use narrowly delegated content events.

The app owns teardown of stream watching, pending chat reads, health polling, observers and document/window listeners. Debounced searches clean up when views unmount. Preserve chat view tokens, abort semantics, streaming recovery and polling fallbacks.

Keep the existing theme and CSS cascade. Do not turn the entire stylesheet into scoped styles during this migration. Preserve public paths, generated manifest/caching behavior and share metadata markers.

## Build gate

Use TypeScript strict mode, noUncheckedIndexedAccess, isolated modules and strict Vue templates. `npm run build` executes vue-tsc before Vite. ESLint covers TS/Vue and browser API compatibility. Policy tests deliberately introduce broken template symbols, component props, API fields and imports and require typecheck to fail. Browser tests remain necessary for network/timing, DOM ownership, safety and layout.

## Validation and implementation sequence

1. Add Vue, TypeScript, official Vite plugin, vue-tsc and compatible lint dependencies.
2. Split state/actions and migrate views while retaining styles and transport semantics.
3. Replace Alpine-only event modifiers, global callbacks and DOM ownership assumptions.
4. Remove Alpine and the old platform/bootstrap files; adapt source-inspection tests and replace browser state hooks with user-visible actions.
5. Run formatting, compatibility policies, typecheck/build, backend lint/types/tests and desktop/mobile cross-engine browser regression. Review final diff and screenshots. No merge or push without an explicit request.

## Verification

Validated locally on the migration branch: clean npm installation; Prettier;
ESLint including TS/Vue compatibility probes and dependency boundaries; strict
vue-tsc plus negative typecheck policy; production Vite build; Ruff formatting
and lint; Pyright; 263 passing Python tests; 36 passing Playwright cases across
Chromium, Firefox, desktop WebKit and mobile WebKit. Desktop/mobile screenshots
were inspected. Browser chat streams use fixtures and do not call a live Pi model.

The duplicate web-results drawer from the old template is represented by one
component. Template icons use an explicit registry of official Vue Lucide imports
to avoid bundling all Vue icon components. Existing backend APIs and persistence
were not modified. No merge or push was performed.
