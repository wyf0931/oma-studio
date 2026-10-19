# Password security audit follow-up

The product owner authorized this grouped branch after the 2026-10-19 audit, explicitly excluding shared-default-password changes. Account settings #166 was merged and deployed first. This branch addresses #73, #74 and #167–#170 in one worktree as requested.

## Decisions and implementation

- #73: pwdlib Argon2id with m=19456 KiB, t=2, p=1, random salt. Keep verification of the historical scrypt$16384$8$1 format; correct logins transactionally upgrade the hash and last-login timestamp. Incorrect logins do not modify it. New users and password changes use Argon2id immediately; existing users keep their passwords. Modern Argon2 hashes with obsolete settings can also be upgraded. Benchmark before delivery.
- #167: Reject inactive users every time a cookie resolves. Updating a user to disabled revokes all their sessions in the same transaction; reactivation requires a fresh login. Password mutation also checks active status under its transaction.
- #168: Handle RequestValidationError centrally, returning only error type, location and message, plus the existing request.invalid code. Never return raw input or validation context. Login passwords also use SecretStr to avoid accidental repr exposure. Preserve request IDs and frontend field validation.
- #74: Use the maintained limits package with expiring in-process fixed windows. Login allows five attempts per client/account per five minutes and twenty per account across clients. Current-password verification allows five per user per five minutes. Successful checks clear their corresponding account budgets. Both flows share a thirty-failure client budget per five minutes. Return localized HTTP 429 with Retry-After; expiry provides bounded recovery without permanent lockout. Use request.client supplied by ASGI, never parse arbitrary forwarding headers in application code. Uvicorn trusted proxy configuration determines whether that is the end client or a shared proxy. Counters reset on process restart, consistent with the single-process MVP; multi-worker deployment would require shared storage. Synchronous bounded verification follows the existing server execution model.
- #169: A shared subprocess environment helper removes OMA_ADMIN_PASSWORD and OMA_DEFAULT_USER_PASSWORD from Pi RPC, instruction generation and marketplace skills/Pi CLI processes. Retain provider credentials, proxies and PATH needed for existing tools. Configuration secrets remain protected by OS permissions; this does not isolate same-user processes or their files. Full runtime isolation is #123 and is not claimed by this change.
- #170: Pre-create SQLite metadata files with mode 0600. Tighten existing DB, SQLite WAL/SHM/journal and schema backup files before opening them. New storage directories and upgrade backup temporary files are private. Do not recursively chmod working directories, Pi sessions or unrelated files. Existing bind mounts keep ownership. Existing deployments receive these restrictions on startup; production verification should inspect file modes after deployment.

## Validation and delivery

Regression tests cover expiry/recovery of limits, spoofed forwarding headers, distributed-account and client budgets, preserved sessions on 429, scrypt migration, Argon2 rehash, disabled-session revocation/reactivation, password response redaction, provider-environment compatibility, new/existing files/sidecars/backups and unchanged workspace permissions. Run all repository format/lint/type/test checks and browser smoke at desktop/mobile widths for login, change-password errors and localized throttling. Do not rotate production passwords or expand the work into a new sandbox architecture.

## Validation evidence

All 259 tests pass, including the added audit regressions. Ruff format/check,
Pyright and Prettier checks pass. The original isolated audit probes now show
no password echo and HTTP 401 for disabled-session access/password changes.
Browser checks at 1440×1000 and 390×844 exercised English/Chinese, light/dark,
successful password change, both login/password 429 feedback with Retry-After,
and disabled-session rejection with password-field cleanup. Existing file-viewer
null errors remain tracked by #163; no new account page exceptions were observed.
Local eight-operation benchmark: hash median 15.37 ms, verify median 15.16 ms,
maximum 16.44 ms; this is not a production-host latency measurement.
