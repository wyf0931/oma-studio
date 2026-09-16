# Marketplace Agent Installation and Update State

## Goal

Make the relationship between an installed Agent and its Marketplace publication
visible and actionable, without creating duplicate installation paths or obscuring
the risk of replacing local changes.

## State model

An installed Marketplace Agent already records `source_publication_id`,
`source_version`, and `source_hash`. The Marketplace response will derive one of
three states for the requesting user:

| State | Condition | Marketplace card |
| --- | --- | --- |
| Uninstalled | No active Agent refers to the publication | No state icon |
| Current | At least one active copy has the publication latest hash | Green `CircleCheck` |
| Update available | An active copy refers to the publication but its source hash differs from the latest hash | `CircleFadingArrowUp` |

Update availability takes precedence over the current state. A user with multiple
installed copies sees update available when any active copy is outdated, because a
Marketplace update action must not imply that all local copies are current.

The Agents collection receives the same derived fields for Marketplace-sourced
copies. Built-in and locally created Agents have no Marketplace status.

## UI and interaction

Cards use their existing top-right icon-action position. The status icon is a
semantic button only when an update is available; the current-installation icon is
a non-interactive status indicator with an accessible label.

Both Marketplace and Agents route update requests into one confirmation dialog.
The dialog identifies the source and target versions, explains that updating
replaces the installed Agent configuration and can overwrite local modifications,
and exposes Cancel and Update Agent actions. Confirmation updates the existing
Agent in place, then refreshes Agents and Marketplace data. It never creates a
second copy.

## Server contract

The existing install endpoint remains create-only for a publication. A separate,
agent-addressed update endpoint verifies that the Agent belongs to the caller and
has a valid Marketplace source. It replaces only the marketplace-managed Agent
configuration from the publication latest version, preserves the local Agent id
and avatar, and resets source version/hash to the installed latest version.

Server-side derivation is authoritative: the client does not compare version
strings or infer source relationships. The update endpoint rejects deleted,
non-Marketplace, or unavailable publication Agents with a clear 404 response.

## Error handling and refresh

The dialog stays open when an update fails and uses the existing error surface.
Cancel and backdrop dismissal make no mutation. On success, the client refreshes
the Agents list and Marketplace Agents list so all card states update together.

## Verification

Unit and API tests cover the three derived states, update authorization, in-place
replacement, avatar preservation, and stale-to-current transition. UI-source
tests cover the prescribed Lucide icons, icon precedence, accessible labels, the
overwrite copy, and the shared update action.
