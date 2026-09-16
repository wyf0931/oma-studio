# Shared Chat Records

## Goal

Let a signed-in user review and revoke the public links they have created for
their own chats, without adding a second share store or changing public share
semantics.

## Existing model

The `shares` table already stores `token`, `user_id`, `chat_id`, and
`created_at`. `chat_id` is unique, so a chat has at most one active public
share. Creating a share already returns the existing record for that chat.

## Server contract

Add two authenticated, user-scoped chat-share endpoints:

- `GET /api/shares` returns the caller's active shares, newest first. Each item
  includes only presentation-safe metadata: token, chat id, title, and creation
  timestamp.
- `DELETE /api/shares/{token}` revokes a share only when it belongs to the
  caller. Unknown or another user's token returns 404.

Revocation removes the existing share row. The token immediately ceases to
resolve through all public share endpoints. Deleting a chat continues to remove
its share as it does today.

`POST /api/chats/{id}/share` stays idempotent. Its response includes whether
the record already existed, allowing the UI to show the link dialog immediately
instead of repeating the warning for an already-shared chat.

## UI

The profile menu gains a Share records entry using Lucide `Share2`. It opens a
dialog that follows the Users management dialog structure: eyebrow, title,
subtitle, close action, responsive table, empty state, and loading state.

The table is scoped to the signed-in user and shows:

- Chat title, visually truncated after 20 characters.
- Shortened public-link token for recognition, without relying on it as a
  secret-display surface.
- Localized share timestamp.
- A `Link2Off` button that opens a small destructive confirmation dialog.

Confirming calls the revoke endpoint, removes the row, and clears the current
chat's share link state if applicable. Cancel/dismiss makes no mutation.

When Share is selected on a chat that already has a share, the client calls the
existing idempotent endpoint first. For a reused record it immediately shows
the link/copy state. For a new record it retains the existing safety warning
before creating the link.

## Boundaries

- No share history, expiration, password protection, search, pagination, or
  administrator access to other users' records.
- No message content or transcript data is added to SQLite.
- No new frontend framework, state library, or component library is introduced.

## Verification

API tests verify ownership filtering, newest-first order, idempotent create,
revoke authorization, public-token invalidation, and chat-delete cleanup.
Frontend tests verify the profile entry, dialog table, truncation, `Link2Off`,
confirmation path, and reused-share link behavior. Browser verification covers
creating a share, listing it, re-opening its existing link, revoking it, and
getting 404 from the public URL afterward.
