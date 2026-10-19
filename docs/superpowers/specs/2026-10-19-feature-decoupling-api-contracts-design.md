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
