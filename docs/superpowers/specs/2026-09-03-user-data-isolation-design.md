# User-owned data isolation

## Decision

The platform remains single-database and single-process, but every user-owned
domain record carries an explicit `user_id`. Agents, chats, autopilots,
autopilot runs, library files, and share records are **private property**:
normal users and admins alike only ever see their own. Admin role does not grant
cross-user visibility into private assets. Marketplace Skills, Extensions, MCP
servers, and published Agents are **shared assets** and remain globally visible.

## Ownership model

`agents`, `chats`, `autopilots`, `autopilot_runs`, `shares`, and
`artifact_shares` carry a `user_id` field. Child records retain their existing
parent references and must also pass same-user validation when created or
changed. Sessions remain authentication records and are owned by `users`.
Uploads and library listings are derived from chats, so they inherit chat
ownership instead of storing a second owner.

## Shared assets

Marketplace content is intentionally not user-scoped: published Agents and the
installed Skill/Extension/MCP catalog are global. Admin-only guards apply to
Skill/Extension/MCP install and uninstall, so normal users cannot mutate the
shared global catalog. Installing a published Agent creates a private copy owned
by the installing user.

## Legacy data

Historical rows created before ownership existed carry a NULL `user_id` and
would otherwise be invisible to everyone (the access check is an equality test).
They are adopted by admin with an idempotent backfill: `Store.backfill_ownership`
walks `agents`, `chats`, `autopilots`, `autopilot_runs`, `shares`, and
`artifact_shares`, assigning the admin user id to every record that still has no
owner. It runs once at startup from `create_context`, never overwrites an
existing owner, and is a no-op on a second pass. Pi session ids, transcripts,
message bodies, and files are not rewritten.

This replaced the earlier TinyDB-only `scripts/backfill_user_ownership.py`,
which was removed with the other one-time TinyDB paths; ownership is now a
schema concern of the SQLite store, so a startup pass is both safer and
idempotent.

## Authorization

Route handlers use a shared user scope: every list, detail, mutation, run,
share, and file route filters on `user_id == current_user.id`. Admin role does
not widen that scope for private assets — an admin requesting another user's
Agent, Chat, or Autopilot receives 404, never the record. Usage statistics are
the one role-aware read: admins see all users' aggregates, while normal users
see only their own sessions and receive empty per-user/per-agent breakdowns.

## Testing

Cover backfill idempotence, normal-user list/detail denial, admin scoping to its
own private records, same-user parent validation, usage payload shape per role,
and admin-only Marketplace mutations. Run the full Python validation suite and
browser smoke checks for admin and normal-user navigation.
