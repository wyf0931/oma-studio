# UI polish for task navigation, Marketplace search, and Agent profiles

## Scope

This change is frontend-only. It preserves all existing navigation, chat creation,
Marketplace filtering, agent data, and API behavior.

## Design

### Navigation labels

Replace the visible `New chat` label with `New Task` everywhere it appears in the
workspace navigation and chat-history action. Update matching tooltip and ARIA labels
so assistive technology describes the same action. Keep the existing `newChat()` handler.

### Marketplace search alignment

Keep one shared search toolbar for Skills, Extensions, MCP Servers, Agents, and Agent
Teams. Make the toolbar and the three-column catalog use the same available content width:
the search field grows to the catalog width, while install/add actions remain at the
toolbar's right edge. Responsive breakpoints continue to follow the existing one-, two-,
and three-column catalog behavior.

### Reusable Alpine rendering helpers

Add small Alpine view helpers for repeated profile presentation:

- `agentAvatarMarkup(agent, size)` returns either a circular image with a stable
  square box or a circular initials fallback. The image uses `object-fit: cover`,
  `aspect-ratio: 1`, and `flex: 0 0 auto`; this crops non-square uploads without
  stretching them.
- `agentTagsMarkup(tags, limit = 4)` renders at most four tags in one non-wrapping row.
  Hidden overflow is intentional and does not change the stored tag list.

Use these helpers in Agent cards, Marketplace Agent cards, and the Agent detail dialog.
Remove duplicate template/fallback avatar nodes so one agent produces exactly one avatar.

### Agent card and detail dialog layout

Agent cards render no more than four tags, keep them on one line, and hide any overflow.
The detail dialog uses a two-column identity layout: the circular avatar occupies the
first column, while name, description, and tags occupy the second column. This aligns
the tags with the description text instead of with the avatar. The layout collapses
cleanly at narrow widths without changing the content order.

## Validation

- Add/update static HTML assertions for the `New Task` labels and reusable avatar/tag
  helper usage.
- Run Prettier format and `npm run format:check`.
- Run `uv run pytest -q`, `uv run ruff check`, `uvx pyright app tests`, and `git diff --check`.
- Use Chrome to smoke-check Marketplace at desktop and mobile widths, including all five
  tabs, and inspect Agent cards/detail dialogs with image and initials avatars.

## Non-goals

- No API, persistence, tag validation, avatar upload, or chat behavior changes.
- No new component framework or frontend build system.
