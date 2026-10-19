# Account settings (#166)

The product owner approved this design and implementation on 2026-10-19.

## Experience

Add Account beside General in the existing settings modal. Retain existing spacing, typography, Lucide icons, themes and mobile layout. Account shows read-only username, role and joined date; editable optional nickname and contact email; and a collapsed Change password form. Profile and password have separate save actions and inline success/error feedback. Nickname appears in the profile menu and user management list, with username fallback. Login username remains unchanged.

Email is optional, unverified contact information, never used for login or recovery. No email verification is involved in password changes. All existing accounts have a password, so there is no separate Set password flow. Username edits, recovery and administrator resets remain out of scope.

The password form asks for current and new passwords, with individual accessible visibility toggles and password-manager autocomplete. New passwords are 15–200 characters, with spaces and Unicode supported; there is no repeated confirmation field. Verify the current password server-side. Incorrect current passwords return a field-specific 403, preserving the authenticated session. Successful changes retain the current session and revoke all other sessions for that user atomically. Clear password values and visibility flags on success, cancel, tab exit, modal close and session expiry.

## Implementation

- PATCH /api/users/me: optional nickname (maximum 80 characters) and email (maximum 200, Pydantic EmailStr validation). Trim optional profile fields; blank/null clears them; omitted fields stay unchanged. Reject unknown fields. Resolve identity from the authenticated request, never from input.
- POST /api/users/me/password: current_password and new_password. Store only a salted scrypt hash using the existing implementation. Update the credential and revoke other sessions in one SQLite transaction.
- Nickname uses Store's existing extra_json metadata mechanism; this avoids a schema change and keeps old accounts compatible. Email remains in its existing column.
- Alpine owns form state, submit guards, success/errors and password cleanup. Reuse the single Lucide renderer and existing settings modal. All new copy is available in English and Chinese.

## Validation plan

Test profile ownership, partial updates, invalid emails/lengths, rejection of privileged fields and persistence. Test wrong/current/new passwords, Unicode/whitespace, normal/admin users, anonymous access and session revocation isolation. Run repository format/lint/type/test gates and browser smoke checks for desktop/mobile, light/dark, English/Chinese, profile saving and password changes against an isolated local database.
