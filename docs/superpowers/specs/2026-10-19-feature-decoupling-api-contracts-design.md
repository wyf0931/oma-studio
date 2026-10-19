# Feature decoupling and API contracts

## Scope approved by the owner

Keep Vue, TypeScript, FastAPI, DaisyUI and the existing runtime/deployment. First remove the flattened Workspace/this model, then make HTTP and streaming contracts inspectable and checked. No new UI framework or state library. The previous migration is preserved on develop; this phase starts on a fresh feature branch and does not push or deploy.

## Feature ownership and composition

Each feature is a factory returning its own reactive state and closure-based actions. Dependencies are explicit typed ports to the state or actions actually consumed. Modules do not receive the application, import its composite type or look up arbitrary named fields. The application composition root wires ports, resolves callbacks needed for existing cross-feature workflows, and provides individual feature instances to views using typed Vue injection keys.

Views select refs from each owning feature and call its methods directly. No flattened scope adapter, intersection of all feature state, root action spreads, bind(this) or hidden window state remains. Reusable components can use typed props/emits; this phase preserves existing markup while replacing ownership plumbing.

Shared transport, localization, formatting and DOM adapters consume structural capabilities rather than feature implementations. Chat-specific presentation belongs to the chat feature. Chat reads/cancellation belong to chat, not generic transport. The app remains responsible for boot, routing and teardown; subscriptions and timers register cleanup at their actual ownership boundary.

## Contract stage

Declare precise Pydantic HTTP response models for existing JSON endpoints, preserving response payloads and statuses. Export OpenAPI from an isolated application context rather than importing the production app. Generate frontend contract types using a maintained schema tool and verify generated output in CI. Endpoint adapters own request/response types; components cannot choose an arbitrary type parameter for an untyped URL.

Represent incoming stream events as a tagged union and validate unknown JSON at the boundary, preserving unknown-event compatibility, request IDs, cancellation and existing SSE framing. Do not persist message content or modify Pi ownership. Avoid generic repositories, event buses or a new state framework.

## Validation

Before the contract stage, run strict TS/template checks and browser workflows against the decoupled code. Then validate response-model compatibility and generated-type drift, invalid template/endpoint/event probes, authentication/file/share boundaries, and malformed stream payload handling. Run repository formatting, lint, build, Python type/tests, and Chromium/Firefox/desktop+mobile WebKit regressions. Inspect screenshots and the final diff; keep generated dist and runtime data untracked.


## Implementation decisions

The Vue migration was committed as b4fe28d and merged into local develop by f8e9784.
The next feature branch is feat/frontend-decoupling-api-contracts. Its independently
validated decoupling checkpoint is f74fbcd. Main and the remote remain untouched.

Feature factories now use local state/closure functions and readonly capability
ports. Shell workflows coordinate boot/auth/routing, while individual commands
own mutations. Views inject individual services. Module tests instantiate factories
without an application container and prove instance isolation.

Contracts use Pydantic response models, openapi-typescript types, the small typed
openapi-fetch client, and build-time Ajv standalone validators. These add contract
tooling, not a framework or state library. TypeScript is pinned to 5.9.3 to satisfy
the stable generator's 5.x peer range. Unknown Pi fields remain extensible; UI
message normalization is separate from wire validation.

CI performs an isolated live-schema export and artifact comparison. Node-only
publishing builds verify the snapshot, generated output and source/uv.lock digest;
Docker copies those inputs and tsconfig into its frontend stage. Response validation
errors return generic JSON and log only a count/request ID, preserving the logging
privacy invariant.

## Final verification

268 Python tests and 44 Playwright cases pass. The browser matrix covers Chromium,
Firefox, desktop WebKit and mobile WebKit, including invalid-response privacy/request
IDs and malformed-stream snapshot recovery. Desktop/mobile settings screenshots
were inspected. Ruff formatting/lint, Pyright, Prettier, ESLint, strict Vue/TS,
negative type/dependency probes, independent-module tests, runtime contract tests,
live-schema drift verification and the production build pass.

A staged frontend build also succeeded with only Node/npm/sh on PATH (no Python or
uv), exercising the Docker frontend inputs. The Docker daemon was unavailable, so
an actual image build was not run. Live Pi/model calls and real historical iOS
devices were not exercised. No remote push, main release, or deployment occurred.
