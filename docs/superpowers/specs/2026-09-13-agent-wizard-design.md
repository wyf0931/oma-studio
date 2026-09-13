# Agent Wizard Design

## Goal

Replace the single long Agent editor with a compact, in-memory three-step
wizard. The existing Agent storage/API model remains unchanged; the wizard only
changes how users assemble the same payload.

## Steps

1. **Basics** keeps the existing identity layout: avatar, name, tags,
   description, shortcuts, and instruction. Description, shortcuts, and
   instruction begin at the same one-row height and retain the existing
   auto-resize behavior.
2. **Permissions** contains the full-width Provider/Model/Thinking control,
   three-column built-in capability groups, Extensions, and MCP servers.
3. **Capabilities** contains Skills only. A local search filters the discovered
   catalog by name and description; selection state is never filtered away.

The daisyUI horizontal `steps` component is interactive. Clicking a completed,
current, or upcoming step switches pages without validation, because users may
configure an Agent in any order.

## Draft lifecycle

All fields and the current step live in the existing Alpine component. Moving
between steps and clicking the modal backdrop preserve the draft. Explicit
Cancel or the close button discards the unsaved wizard state. Opening a new or
existing Agent initializes a fresh draft and starts at Basics.

## Footer and optimizer

Every step has a common footer. Cancel discards; Back/Next navigate; the final
step exposes Create/Save. The existing optimizer moves from the instruction
textarea into that footer.

The optimizer endpoint changes from a Markdown-only result to a validated JSON
profile result containing `instruction`, `description`, `tags`, and
`quickstarts`. The frontend fills every returned nonempty field. Existing
selection/configuration fields remain user-owned and are never changed by the
optimizer.

## Safety and validation

The existing agent create/update validation remains authoritative. Skill search
is purely presentation filtering over discovered resources, so it cannot enable
unknown paths. The optimizer uses the same validated selected capabilities and
model configuration as before.

## Verification

- API tests cover structured profile output, malformed generator output, and
  unchanged validation behavior.
- UI contract tests cover all steps, click navigation, draft preservation,
  skill search, footer optimizer, and three-column tool groups.
- Browser smoke check covers new/edit flows at desktop and mobile widths.
