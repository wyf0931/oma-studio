import "../input.css";
import Alpine from "alpinejs";
import i18next from "i18next";
import { createIcons, icons } from "lucide";
import hljs from "highlight.js/lib/common";
import mermaid from "mermaid";
import platform from "./platform.js";
import { installCodeThemes } from "./ui/code-themes.js";

// Compatibility chunks are injected before this entry by Vite's legacy plugin.
// Install dependencies before Alpine evaluates any x-data / x-html expressions.
window.Alpine = Alpine;
window.i18next = i18next;
window.hljs = hljs;
window.mermaid = mermaid;
window.lucide = { createIcons: () => createIcons({ icons }) };
window.platform = platform;
installCodeThemes();
Alpine.data("platform", platform);
Alpine.start();
