// Single source of truth for the workspace keyboard shortcuts surfaced in the
// settings "Keyboard shortcuts" tab. Key matching and the readable binding labels
// both derive from these definitions so they cannot drift apart.
export interface ShortcutBinding {
  /** Lowercase event.key value matched against the keydown event. */
  key: string;
  /** Display label for the primary modifier (Cmd on macOS, Ctrl elsewhere). */
  modifier: () => string;
  /** Display label for the main key. */
  label: string;
}

const isApplePlatform = (): boolean => /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

/** The primary modifier label for the current platform. */
export function primaryModifierLabel(): string {
  return isApplePlatform() ? "Cmd" : "Ctrl";
}

/** True when the event carries the primary modifier (Cmd on macOS, Ctrl elsewhere). */
function hasPrimaryModifier(event: KeyboardEvent): boolean {
  return isApplePlatform() ? event.metaKey : event.ctrlKey;
}

export const SHORTCUTS = {
  quickSearch: {
    key: "k",
    modifier: primaryModifierLabel,
    label: "K",
  },
  toggleSidebar: {
    key: "b",
    modifier: primaryModifierLabel,
    label: "B",
  },
  skillTemplate: {
    key: "/",
    modifier: primaryModifierLabel,
    label: "/",
  },
} as const satisfies Record<string, ShortcutBinding>;

export type ShortcutId = keyof typeof SHORTCUTS;

/**
 * Composer bindings. Enter sends, Shift+Enter inserts a line break and the
 * primary modifier plus Enter also sends — the behaviour shared by the ChatGPT
 * desktop app, Codex and Slack. Kept apart from SHORTCUTS because the display is
 * a key sequence rather than modifier plus letter.
 */
export interface ComposerShortcut {
  id: string;
  keys: () => string[];
}

export const COMPOSER_SHORTCUTS: readonly ComposerShortcut[] = [
  { id: "sendMessage", keys: () => ["Enter"] },
  { id: "newline", keys: () => ["Shift", "Enter"] },
  { id: "sendWithModifier", keys: () => [primaryModifierLabel(), "Enter"] },
] as const;

/** True when the keydown event matches a shortcut binding. */
export function matchesShortcut(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  if (!hasPrimaryModifier(event)) return false;
  if (event.altKey) return false;
  return event.key.toLowerCase() === binding.key;
}
