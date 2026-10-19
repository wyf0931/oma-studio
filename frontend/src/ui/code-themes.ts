import lightTheme from "highlight.js/styles/github.css?inline";
import darkTheme from "highlight.js/styles/github-dark.css?inline";

export function installCodeThemes() {
  const before = document.head.querySelector("style, link[rel=stylesheet]");
  for (const [id, css, disabled] of [
    ["highlightjs-light-theme", lightTheme, false],
    ["highlightjs-dark-theme", darkTheme, true],
  ] as const) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.insertBefore(style, before);
    style.sheet!.disabled = disabled;
  }
}
