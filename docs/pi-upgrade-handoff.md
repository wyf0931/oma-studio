# Pi upgrade and native MCP handoff

Updated: 2026-11-13

## Current state

The `feat/pi-native-mcp` worktree contains a proposed Docker pin change from Pi
0.84.4 to 1.5.2 and a matching Dockerfile assertion. The upgrade is **not
validated against a running Pi 1.5.2 container**. Native MCP migration is not
implemented; existing agents still use `pi-mcp-adapter` and the current
`--mcp-config` override. No adapter has been uninstalled.

The standalone frontend build succeeded and `uv run pytest -q` passed (314 tests)
in the worktree. These checks do not demonstrate Pi 1.5.2 compatibility or MCP
isolation. A Pi 1.5.2 npm installation exists only in temporary scratch space. A local
RPC `get_state` smoke test started successfully with all three first-party
extensions loaded; it did not exercise model calls, tools, or the container.

## Remaining work

1. Validate the Pi 1.5.2 CLI, RPC lifecycle, session resume, event handling and
   the three first-party extensions in a built container.
2. Replace the adapter with Pi's native MCP while preserving each agent's
   explicitly selected servers, including previously saved agent configurations.
   Pi's `--no-extensions` also disables built-in extensions; loading native MCP
   requires deliberate configuration. Verify that unselected servers cannot
   connect or be reached through direct calls, codemode, tool search or resources.
3. Update Agent create/edit and default configuration so server selection does not
   require selecting an MCP extension. Update documentation and regression tests.
4. Validate existing MCP configuration locations and transport compatibility;
   native Pi supports stdio and streamable HTTP, but not legacy SSE.
5. Run the repository's full validation and desktop/mobile browser smoke checks.

The existing image tools retain SenseNova support, durable file output and
chat-specific source authorization; native image generation has not been shown
to replace these behaviors.

## References

- [Pi 1.5.2 release](https://github.com/earendil-works/pi/releases/tag/v1.5.2)
- [Pi 1.5.2 MCP documentation](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/docs/mcp.md)
- [Pi 1.5.2 CLI documentation](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/docs/cli.md)
