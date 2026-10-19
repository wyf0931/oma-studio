# AGENTS.md

Guidance for AI coding agents (pi, and any other agent) working in this repository.

## What this project is

OMA Studio — an experimental, local-first agent platform. A single FastAPI process serves
a static Vue 3 + TypeScript + DaisyUI frontend and a JSON API, and talks to the
[Pi coding agent](https://github.com/earendil-works/pi) via `pi --mode rpc` (JSONL over
stdin/stdout). SQLite stores platform metadata only; **Pi owns all message content and
session transcripts**. Status: MVP, single user, localhost.

## Tech stack (and why)

| Layer | Choice | Notes |
| --- | --- | --- |
| Python | 3.11+ managed by **uv** | Never use pip directly; use `uv` / `uv run`. |
| API | FastAPI + Pydantic | Request validation lives in Pydantic models in `app/main.py`. |
| Storage | SQLModel + SQLite (file `~/.oma-studio/data/platform.sqlite3`) | Metadata only; SQLite is the sole metadata store. Legacy TinyDB JSON is a read-only archive that no code path reads. |
| Agent runtime | Pi RPC subprocess | One short-lived Pi process per operation (send / stream / messages). |
| Frontend | Vite-built Vue 3 + TypeScript + DaisyUI 5 + Tailwind 4 | Source in `frontend/`, public assets in `static/`, output in ignored `dist/`. Lucide is the required icon system. |
| Markdown rendering | marked + DOMPurify + highlight.js + mermaid (locked npm packages) | Sanitized HTML only; never inject raw model output. |
| Frontend build/compatibility | Vite + Tailwind Vite plugin + Lightning CSS + core-js | `npm run build`; one `.browserslistrc`; generated `dist/` is not committed. |
| Observability | stdlib JSONL logging + request IDs | Logs go to stdout and rotating `PI_LOG_DIR`; no external collector in the MVP. |

## Commands

```bash
# Setup
cp .env.example .env      # then set the storage paths (see file comments)
uv sync                   # Python deps (also creates .venv)
npm ci                    # locked frontend deps; Node >=22.12
npm run build             # required before local server/API tests; Docker builds automatically
pi --version              # Pi CLI must be on PATH, with a provider credential configured

# Run (Docker Compose — app layer + process layer in one container, state via bind mounts)
bin/ops.sh start          # up -d --build on OMA_PORT or 8000; use: start 8080 or start -p 8080
# one-off alternate host port: bin/ops.sh start 8080 / restart 8080 / status 8080
# or foreground: docker compose up --build

# Run (local dev server with hot reload, no Docker)
uv run uvicorn app.main:app --env-file .env --reload

# Test (run before declaring any work done)
uv run pytest -q

# Frontend formatting (Prettier — required before publishing)
npm ci
npm run format            # frontend source, build config and browser tests
npm run typecheck
npm run test:typecheck:policy
npm run test:modules
npm run test:contracts
npm run api:check
npm run format:check      # merge-gate check
npm run lint              # Web API compatibility against .browserslistrc
npm run test:compatibility:policy

# Frontend production build and browser regression suite
npm run build             # frontend/ + static/ -> dist/ (gitignored)
npm run dev               # rebuild on edit; same production pipeline, served by FastAPI
npm run test:frontend:install
npm run test:frontend      # Chromium, Firefox, desktop/mobile WebKit
```

## Repository map

```text
app/
  config.py     Settings dataclass; env vars + a ~20-line built-in .env reader
  avatars.py    Agent avatar validation, persistent storage, and default-avatar seeding
  store.py      SQLModel/SQLite wrapper: metadata tables, BUILTIN_TOOLS, protected default agent
  pi_rpc.py     PiRpcClient (JSONL bridge) + PiRuntimeManager (process lifecycle, per-chat locks)
  observability.py Request IDs, JSONL logging, and request tracing middleware
  resources.py  Read-only discovery: extensions, skills, MCP servers, provider/model catalog
  files.py      Chat-generated file discovery + authorization (write/edit toolCall provenance)
  main.py       FastAPI app, routes, Pydantic payloads. NOTE: configures itself at import time
static/         Public images and locale JSON (copied into dist/)
frontend/       index.html, input.css, src/main.ts, src/app/, src/features/, src/shared/, src/ui/, src/styles.css
dist/           Generated Vite frontend; ignored, served by FastAPI at /static
vite.config.js  Locked dependency build, JS/polyfill/CSS targets from .browserslistrc
tests/          Mirrors app modules; conftest provides `client` and `temporary_agent` fixtures
bin/ops.sh      Container operations (start/stop/restart/status/logs) via Docker Compose
Dockerfile      Single image: app layer (Python/FastAPI) + process layer (pi, rg, fd, git)
docker-compose.yml  One-command run; bind mounts for data, logs, workspace, and Pi home
schemas/        Vendored compose-spec JSON schema for offline YAML validation
docs/           Design spec (docs/superpowers/specs/) + README screenshots
data/           Legacy runtime data (pre-normalization archive, gitignored, superseded
                by ~/.oma-studio/)
```

## Architecture invariants (do not break)

1. **Pi is the source of truth for messages.** Never store message bodies, tool results,
   or transcripts in SQLite. Chats carry metadata only (`id`, `session_id`, `agent_id`,
   `title`, `status`, timestamps). A unit test (`test_chat_index_does_not_store_messages`)
   enforces this.
2. **Chat id == Pi session id.** The UUID is shared deliberately; there is no mapping layer.
   Do not introduce one.
3. **One Agent per chat.** The binding is fixed at the first prompt and never changes.
4. **Discovery ≠ enablement.** `resources.py` only *lists* what exists. An Agent must opt
   in to tools/extensions/skills/MCP servers, and every selection must be validated against
   the discovered catalog before persistence (see create/update handlers in `main.py`).
5. **File serving is authorized twice over.** `resolve_chat_file` only returns files that
   (a) appear in that chat's own `write`/`edit` tool calls and (b) resolve inside
   `PI_CWD`. Both checks are the security model for file view/download — preserve them.
6. **`PI_CWD` is a working directory, not a sandbox.** The MVP has no auth and must not be
   exposed beyond localhost. Don't add "hardening" that implies a security boundary where
   none exists (e.g. path "jails" outside the authorized-files flow).
7. **Single process, single static frontend.** FastAPI serves the API and the Vite `dist/` build; the
   catch-all route renders the built `index.html`. The owner authorized Vite in #171.
   Do not add a second production server or replace the UI framework without a decision.

## Development philosophy

- **Don't reinvent wheels.** Prefer standard-library and community packages over
  hand-rolled code: Pydantic for validation, SQLModel for storage, Vue 3 + TypeScript + DaisyUI for
  UI, marked/DOMPurify/mermaid/highlight.js for rendering. Before writing a utility,
  check whether a small, well-maintained package already covers it.
  *Known deliberate exception:* the mini dotenv reader in `config.py` exists so that
  `uvicorn --reload` workers and tests pick up `.env` without adding a dependency. Don't
  grow it; if env handling becomes more complex, adopt `python-dotenv`/`pydantic-settings`
  instead of extending it.
- **No speculative design.** Build only what a current requirement needs. Future
  capabilities (SandboxRunner, auth, durable datastore, Agent marketplace) live in the README
  Roadmap and the design spec — do not pre-create stubs, interfaces, or config for them.
- **Pragmatism over purity.** Single process, feature-owned Vue state, file-based storage,
  plain dicts at the Store boundary (SQLModel underneath) are conscious MVP choices, not oversights. Make the
  smallest change that satisfies the requirement; don't add layers (services,
  repositories, DI) until a concrete need appears. When you trade purity for simplicity,
  leave a one-line comment or note it in the design spec.

## Conventions

- **Commits:** conventional style — `feat:`, `fix:`, short imperative subject.
- **Config changes:** adding/renaming an env var means updating `.env.example` *and* the
  README Configuration section in the same change.
- **API changes:** README documents the full HTTP surface table — add/update rows when
  endpoints change.
- **Frontend assets:** run `npm run build` after source changes. Vite content hashes
  replace manual CSS/JS cache tokens. Never edit/commit `dist/`; keep public URLs stable.
- **Observability:** every HTTP response carries `X-Request-ID`; correlate browser
  errors with the rotating JSONL file under `PI_LOG_DIR`. Never log prompts, model
  output, credentials, or other sensitive payloads.
- **Icons:** use bundled npm Lucide (`OmaIcon` / `@lucide/vue` in templates and `data-lucide` in dynamic HTML) for all
  UI icons, including markup rendered from Vue templates or `v-html`; do not
  add hand-written SVG icons, text glyph icons, or CSS mask icon assets. Keep the
  single scoped dynamic render helper in the application module and preserve its dynamic re-render
  coverage.
- **Errors:** raise `HTTPException` with clear messages; map `PiRpcError` to 503.
- **Style:** modern stdlib typing (`str | None`), dataclasses for settings, and
  formatting consistent with the surrounding code. Ruff is configured in
  `pyproject.toml` (Python); Prettier is configured in `.prettierrc` for
  frontend HTML/TS/Vue and build/browser-test config — run `npm run format` before
  publishing frontend changes.
- **Never commit:** `data/`, `logs/`, `.env`, `.run/`, `research/`, `.superpowers/`,
  `.playwright-cli/`, `dist/`, `test-results/`, `playwright-report/`, `node_modules/`, `.venv/` (all gitignored runtime/scratch).

## Multi-agent Issue loop

Issues are the source of truth for work. Do not invent work from chat context or
silently broaden an issue. At startup, a worker is given a priority, for example
`start processing P0 tasks` or `start processing P1 tasks`.

Priority meanings for this repository:

- `priority:p0` — a substantial product/module task or a blocking architectural capability.
- `priority:p1` — a focused bug fix, UI adjustment, small feature, documentation change, or cleanup.

Use these labels consistently. A worker must query GitHub before choosing work:

```bash
gh issue list --state open --label priority:p0 --limit 50 \
  --json number,title,labels,assignees,updatedAt,url
```

Choose the highest-priority unclaimed issue, then claim it before editing code:

1. Confirm `gh auth status` and identify the current user with `gh api user --jq .login`.
2. Assign the issue to that user when possible.
3. Add `status:in-progress` and comment with the intended scope, dependencies, and branch name.
4. If the issue is already assigned or marked in progress, skip it. Never have two workers implement the same issue.

The P0 and P1 workers may develop independently, but worktree isolation is mandatory.
Each issue gets one branch and one worktree, preferably including the issue number:

```bash
git fetch origin
git worktree add /private/tmp/pi-rpc-pydemo-issue-42 -b feat/issue-42-short-name origin/develop
```

Parallel work is allowed only when the issues are independent. Do not modify the
same high-conflict files as an active P0 task without an explicit Issue comment
coordinating the ownership. Subtasks may be parallelized inside a P0, but they
must still produce separately reviewable commits and cannot share a worktree.

Before publishing, the worker must run formatting first, then validation:

```bash
uv run ruff format app tests
uv run ruff check
npm run typecheck
npm run test:typecheck:policy
npm run test:modules
npm run test:contracts
npm run api:check
npm run format:check
npm run lint
npm run test:compatibility:policy
npm run build
uvx pyright app tests
uv run pytest -q
git diff --check
git status --short
```

For UI changes, also run the relevant local browser smoke check at desktop and
mobile widths. The worker must inspect the final diff and confirm that generated
files, `.env`, runtime data, and unrelated concurrent changes are not included.

After validation, comment the commit SHA, test results, and any known limitation
on the Issue, then move it to `status:ready-to-merge`. The worker may merge and
push its branch as requested by this project, but the merge gate is serialized:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git merge --no-ff <issue-branch> -m "merge: <issue summary>"
uv run ruff format --check app tests
uv run ruff check
npm run typecheck
npm run test:typecheck:policy
npm run test:modules
npm run test:contracts
npm run api:check
npm run format:check
npm run lint
npm run test:compatibility:policy
npm run build
uvx pyright app tests
uv run pytest -q
npm run test:frontend
git push origin develop
```

Only one worker may perform this merge/push sequence at a time. On macOS/Linux,
use an atomic directory under the shared Git directory as a short-lived merge
lock, for example `mkdir "$GIT_COMMON_DIR/oma-merge.lock"`; if it already exists,
wait or skip the merge. Never force-push. If push is rejected, release the lock,
rebase or merge the new `origin/develop` into the feature branch, rerun validation,
and retry.

A develop push triggers CI only. A release merge from develop to main and its push require explicit owner authorization and the same serialized validation gate; only main pushes run production deploy.
The worker must inspect the workflow result with `gh run view` and comment it on
the Issue. A successful deploy is not user acceptance: keep the Issue in
`status:awaiting-user` until the product owner verifies the production behavior.
If the owner finds a problem, open a new Issue (linked to the original) rather
than silently changing scope or closing the old one. A worker may close an Issue
only after the acceptance criteria and production smoke check are satisfied.

## Development workflow

The repository uses `develop` for integration and `main` for releases; `origin` is the deployment remote. Start feature branches from `develop`; never commit directly on either integration or release branches. Use the
Multi-agent Issue loop above for claimed Issue work, including its worktree,
validation, merge-lock, and publication rules. For user-directed work outside an
Issue, use the same branch-first and full-validation discipline, and only merge or
push when the user explicitly requests it. Keep `main` deployable and never
force-push it.

## Testing

- `uv run pytest -q` must pass before you declare work done.
- `test_store.py`, `test_files.py`, `test_resources.py` are hermetic (use `tmp_path`) —
  keep them that way.
- `test_api.py` boots the real app; because `app.main` configures storage and logging at
  import time, API tests currently run against the real `data/` and `logs/` directories.
  Clean up anything you create
  (see the `temporary_agent` fixture pattern).
- Bug fixes get a regression test in the file mirroring the changed module.
- The design specs (`docs/superpowers/specs/2026-08-26-pi-agent-platform-mvp-design.md`
  and `docs/superpowers/specs/2026-09-01-request-tracing-logs-design.md`) document the
  RPC event contract, JSONL framing, and trace/logging rules — read them before touching
  `pi_rpc.py` or observability code.

## Gotchas

- Importing `app.main` has side effects: loads settings, creates `data/` dirs, opens
  SQLite, ensures the default agent. Don't add more import-time work, and don't import
  `app.main` from scripts casually.
- `@app.on_event("shutdown")` is a deprecated FastAPI API. Don't build on it; if you must
  touch app lifecycle, prefer a lifespan handler — but don't refactor it speculatively.
- Pi RPC processes are short-lived: `send`, `stream`, and `messages` each start one Pi
  process and close it. Don't assume a persistent process; per-chat `asyncio.Lock`s
  serialize prompts and a second concurrent prompt fails with "Chat is busy".
- When `pi-mcp-adapter` is enabled, `pi_rpc.py` writes a temporary MCP config that
  disables all non-selected servers and passes `--mcp-config`; it is deleted via
  `cleanup_paths` on process close.
- Dynamic HTML returned through Vue `v-html` must not embed raw JSON in attributes; HTML entity decoding can make it invalid for `JSON.parse`. Store structured data in feature state and pass only a short key through the rendered markup.
- Browser targets live in `.browserslistrc`; npm dependencies are locked. Do not
  reintroduce CDN scripts or the Tailwind browser compiler. Keep DaisyUI/Vue/Lucide
  and existing OMA UI/UX; see `docs/frontend-architecture.md` for the compatibility boundary.

## Vue module and API contract rules

- Feature factories own reactive state and closure actions. No Workspace type, flattened state/action spreads, bound this, dynamic scope adapter or window application object.
- Cross-feature state ports are readonly; change another feature through named commands or an explicit workflow callback. Shared capabilities must not import feature/app implementations.
- Views inject their individual features; reusable child components use typed props/emits.
- Keep strict templates, strict TypeScript and noUncheckedIndexedAccess. Build runs contract artifact checks, vue-tsc and Vite in that order.
- Endpoint calls use generated schema paths and request/response types, not caller-selected generic return types. Runtime guards and wire-to-view adapters handle external JSON/SSE.
- Update response models with endpoint changes, then run `npm run api:generate`; commit the schema snapshot and generated contract artifacts. Never hand-edit generated types/validators.
- The isolated exporter must not import app.main, touch production storage, start Pi, or resolve credentials. Keep CI live-schema verification and Node-only build fingerprint checks.
- Response-validation logs must not include invalid input/output payloads or exception tracebacks containing them.
- Template icons use Vue Lucide components; imperative replacement stays inside dynamic HTML containers. Keep existing FastAPI/static deployment, CSS and browser baseline.
- New feature work is based on develop. Do not merge/push the current feature branch or release main unless explicitly authorized in the session.
