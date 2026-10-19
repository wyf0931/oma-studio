# Frontend reliability upgrade (#172)

Owner approved the frontend review and implementation/release sequence. Preserve Vue 3,
strict TypeScript, generated API contracts, DaisyUI/Tailwind and FastAPI static serving.

1. #173: make generic error reporting presentation-only. Chat owns run failure state,
   preserves partial answers, and stops only the failing turn's streaming marker.
   One idempotent authenticated startup installs polling after either session recovery
   or login. Application navigation listeners live for the app lifetime. Logout,
   session expiry and disposal invalidate transport work and call each feature's reset
   command. Shell uses readonly peer state and named mutation commands.
2. #174: use request generations plus cancellation for superseded usage/library/file
   reads. Only current requests update data/errors/loading. Poll chat after the previous
   request completes, retry at most three consecutive failures, cancel on stop, and
   surface a safe request-correlated error while keeping transcript content.
3. #175: load secondary pages/dialogs on demand via Vue's built-in async components.
   Load Mermaid only when diagram nodes exist, await asynchronous errors, keep sanitization
   and existing layout. No new framework, state store or production server.

Alternative of adding a router/store is unnecessary for these concrete defects. Broad
component/CSS rewrites would increase regression scope without fixing ownership/timing.
Tests use deferred responses and controlled timers for races and polling; browser checks
exercise real login, history, logout and existing sanitized rendering across four engines.
Full gates include formatting, lint, negative TS policy, module/contracts tests, live schema
check, production build, Python typing/tests and browsers. Keep each issue in its isolated
worktree/commit, integrate sequentially into develop and release main after validation.
Published issues remain awaiting owner acceptance after successful deployment.
