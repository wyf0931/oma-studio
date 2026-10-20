import { marked } from "marked";
import DOMPurify from "dompurify";

import hljs from "highlight.js/lib/common";
let mermaidModule: Promise<typeof import("mermaid")> | null = null;
function loadMermaid() {
  return (mermaidModule ??= import("mermaid").catch((error) => {
    mermaidModule = null;
    throw error;
  }));
}

import type { Actions as FormatActions } from "./format";
import type { Actions as I18nActions } from "./i18n";
export interface Actions {
  renderMermaidDiagrams(root?: ParentNode): void;
  highlightCode(source: string, language: string): string;
  normalizeCodeLanguage(language: string): string;
  renderMarkdown(source: string): string;
  parseCsv(source: string): string[][];
  fileExtension(path: string): string;
  isCsvFile(path: string): boolean;
  isCodeFile(path: string): boolean;
  renderCsv(source: string): string;
  renderCodeFile(source: string, extension: string): string;
}
export type Feature = Actions;
export interface Dependencies {
  getTheme(): string;
  onRenderError(): void;
  format: Pick<FormatActions, "escape">;
  i18n: Pick<I18nActions, "t">;
}
export function createContent(deps: Dependencies): Feature {
  let diagramQueue = Promise.resolve();
  function renderMermaidDiagrams(root: ParentNode = document): void {
    const nodes = [...root.querySelectorAll<HTMLElement>(".file-markdown .mermaid:not([data-processed])")];
    if (!nodes.length) return;
    diagramQueue = diagramQueue
      .then(async () => {
        const { default: mermaid } = await loadMermaid();
        const live = nodes.filter((node) => node.isConnected && !node.dataset.processed);
        if (!live.length) return;
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: deps.getTheme() === "dark" ? "dark" : "default",
        });
        await mermaid.run({ nodes: live });
      })
      .catch(() => {
        deps.onRenderError();
      });
  }
  function highlightCode(source: string, language: string): string {
    try {
      const normalized = normalizeCodeLanguage(language);
      if (hljs?.getLanguage(normalized))
        return DOMPurify.sanitize(hljs.highlight(source, { language: normalized }).value);
    } catch {}
    return deps.format.escape(source);
  }
  function normalizeCodeLanguage(language: string): string {
    const aliases: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      yml: "yaml",
      sh: "bash",
      shell: "bash",
      zsh: "bash",
      html: "xml",
      svg: "xml",
      md: "markdown",
      jsonc: "json",
    };
    const value = String(language || "")
      .trim()
      .toLowerCase();
    return aliases[value] || value;
  }
  function renderMarkdown(source: string): string {
    try {
      const doc = new DOMParser().parseFromString(
        DOMPurify.sanitize(marked.parse(source, { async: false })),
        "text/html",
      );
      const root = doc.body;
      root.querySelectorAll("table").forEach((el) => {
        el.className = "table table-zebra";
        const wrapper = doc.createElement("div");
        wrapper.className = "markdown-table-wrap";
        el.replaceWith(wrapper);
        wrapper.appendChild(el);
      });
      root.querySelectorAll("ul").forEach((el) => (el.className = "list-disc pl-6 space-y-1"));
      root.querySelectorAll("ol").forEach((el) => (el.className = "list-decimal pl-6 space-y-1"));
      root.querySelectorAll("blockquote").forEach((el) => (el.className = "border-l-4 border-primary pl-4 opacity-80"));
      root.querySelectorAll("pre").forEach((el) => {
        const code = el.querySelector("code");
        const languageClass = [...(code?.classList || [])].find((name) => name.startsWith("language-"));
        const language = languageClass?.slice("language-".length) || "";
        if (normalizeCodeLanguage(language) === "mermaid") {
          const diagram = doc.createElement("div");
          diagram.className = "mermaid";
          diagram.textContent = code?.textContent || "";
          el.replaceWith(diagram);
        } else {
          el.className = "bg-base-200 text-base-content rounded-box p-4 w-full overflow-x-auto my-3";
          if (code) {
            const source = code.textContent || "";
            let highlighted = highlightCode(source, language);
            if (!language && hljs?.highlightAuto) {
              const detected = hljs.highlightAuto(source, [
                "bash",
                "javascript",
                "json",
                "python",
                "typescript",
                "yaml",
              ]);
              if (detected.language && detected.relevance >= 2) highlighted = DOMPurify.sanitize(detected.value);
            }
            // pi-lens-ignore: no-inner-html-js
            code.innerHTML = highlighted;
            code.classList.add("hljs");
          }
        }
      });
      return root.innerHTML;
    } catch {
      return deps.format.escape(source).replace(/\n/g, "<br>");
    }
  }
  function parseCsv(source: string): string[][] {
    const text = String(source || "").replace(/^\uFEFF/, "");
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    const finishRow = () => {
      if (!row.length && !field) return;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    };

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (character === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          field += character;
        }
      } else if (character === '"' && !field) {
        quoted = true;
      } else if (character === ",") {
        row.push(field);
        field = "";
      } else if (character === "\n") {
        finishRow();
      } else if (character !== "\r") {
        field += character;
      }
    }
    finishRow();
    return rows;
  }
  function fileExtension(path: string): string {
    return (
      String(path || "")
        .split("?")[0]
        ?.split(".")
        .pop()
        ?.toLowerCase() || ""
    );
  }
  function isCsvFile(path: string): boolean {
    return fileExtension(path) === "csv";
  }
  function isCodeFile(path: string): boolean {
    return [
      "bash",
      "css",
      "html",
      "js",
      "json",
      "jsonl",
      "jsx",
      "py",
      "sh",
      "ts",
      "tsx",
      "txt",
      "xml",
      "yaml",
      "yml",
    ].includes(fileExtension(path));
  }
  function renderCsv(source: string): string {
    const rows = parseCsv(source);
    if (!rows.length) return '<p class="opacity-60">Empty CSV file</p>';
    const columnCount = Math.max(...rows.map((row) => row.length));
    const cells = (row: string[], tag: "th" | "td") =>
      Array.from(
        { length: columnCount },
        (_, index) => `<${tag}>${deps.format.escape(row[index] ?? "")}</${tag}>`,
      ).join("");
    const header = `<thead><tr>${cells(rows[0]!, "th")}</tr></thead>`;
    const body = rows
      .slice(1)
      .map((row) => `<tr>${cells(row, "td")}</tr>`)
      .join("");
    return `<div class="overflow-x-auto w-full"><table class="table table-zebra csv-table">${header}<tbody>${body}</tbody></table></div>`;
  }
  function renderCodeFile(source: string, extension: string): string {
    const language = normalizeCodeLanguage(extension);
    const highlighted = highlightCode(String(source || ""), language);
    const label = deps.format.escape(deps.i18n.t("files.copyCode"));
    return `<div class="code-block"><button type="button" class="code-copy-btn" data-copy-code="" aria-label="${label}" title="${label}"><span class="code-copy-glyph code-copy-glyph-copy"><i data-lucide="copy" aria-hidden="true"></i></span><span class="code-copy-glyph code-copy-glyph-done"><i data-lucide="check" aria-hidden="true"></i></span></button><div class="mockup-code overflow-x-auto w-full"><pre><code class="hljs language-${deps.format.escape(language)}">${highlighted}</code></pre></div></div>`;
  }
  return {
    renderMermaidDiagrams,
    highlightCode,
    normalizeCodeLanguage,
    renderMarkdown,
    parseCsv,
    fileExtension,
    isCsvFile,
    isCodeFile,
    renderCsv,
    renderCodeFile,
  };
}
