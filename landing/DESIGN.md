# OMA Studio / Landing design

## Brief and product truth

Independent static marketing site, Chinese first, for personal studios and small knowledge-work teams. Primary action: open Studio; secondary: inspect open-source setup. No pricing, fabricated social proof, enterprise compliance claims, or unimplemented agent-team functionality.

Source audit: README and frontend features agents, chat, autopilots, artifacts, marketplace, shares, settings, identity, usage. Core journey: configure a reusable role → work in Chat → schedule recurring instructions → review generated files in Library. Supporting capabilities: explicit Skills/tools/MCP selection, organization Agent sharing, upload, revocable shares, model selection. Usage/settings/identity support the workspace, rather than lead the marketing narrative.

## Direction

Considered a screenshot-heavy product tour, an enterprise services site, and a working-studio editorial site. Selected the working studio: clear Chinese value proposition, a compact interactive task-to-deliverable illustration, then authentic product screenshots. Services promises lack evidence; a screenshot-only page explains controls before value.

Palette: paper blue #f4f6fa, ink #17243c, secondary #56647b, cobalt #315be8, line #dce2ec, white #ffffff. Typography: one system-native UI stack for Chinese and Latin text, used consistently for body, headings, navigation, and controls; platform monospace stack only for short technical metadata. Order Apple system UI, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, generic sans-serif. No Arial-only display face, web fonts, or runtime font requests. OS font availability determines fallback while the CSS stack remains identical. Spacious 1200px frame, strong asymmetric hero, quiet rules, restrained corner radii. Signature: a working brief paired with an output document, switched by use case. All examples explicitly illustrative.

## Information architecture

Home: navigation → value proposition and interactive example → product principles → three real product views → capability strip → deployment/open-source → FAQ → final action. About: product intention, working philosophy, current boundary, open source. Native details for FAQs; real anchors and links; mobile navigation; visible focus; reduced motion; no autoplay.

## Research, 2026-10-20

- https://www.nngroup.com/articles/homepage-design-principles/ — make purpose and value immediately understandable; organize around visitor needs.
- https://linear.app/ — show product evidence adjacent to specific benefit statements. Reference for hierarchy, not visual imitation.
- https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html — respect reduced-motion preferences.
- https://web.dev/articles/prefers-reduced-motion — avoid unnecessary ambient motion.

## Delivery

Vue 3 + TypeScript + Vite, Tailwind 4 + DaisyUI 5, bundled Lucide. Own package/lock/config/assets/build, zero app API imports, no backend dependency. Multi-page static output, including about.html, deployable to any static host without SPA fallback. Source screenshots are existing repository captures; illustrative hero is clearly labeled and does not execute an Agent. No external analytics or runtime assets. Validate build/types, interactions, keyboard/reduced motion, desktop/mobile layout and repository checks.

## Marketplace and feature expansion

Owner direction: administrators/FDE prepare scenario-adapted Agents and shared capabilities; users either install a ready Agent or DIY using provided resources. Marketplace gets a dedicated section with authentic screenshot, two user paths, and an implementation/adaptation foundation. Shared capability installation and publication are described separately: Agents are published as snapshots; Skills/Extensions/MCP are prepared and maintained resources, not falsely described as using the same publication API. No assertion of compliance certification, mandatory approvals, or a complete sandbox.

Library copy explicitly means the current user's generated artifacts across all their Agents, not a public or organization-wide file pool. Supporting features live in five native disclosure rows: login-free conversation sharing and revocation; input/output previews; instruction expansion from brief instructions and selected Skills; user administration; personal/team token usage. A new Features nav anchor helps direct visitors to them. No new screenshots for these supporting details.

Research: https://www.nngroup.com/articles/progressive-disclosure/ supports keeping secondary detail available on request; https://slack.com/features and https://slack.com/integrations distinguish capability overview from install/build paths; https://www.notion.com/help/shared-responsibilities-model supports describing concrete role/permission boundaries rather than generic security promises. Preserve existing tokens, typography and responsive behavior.

## Typography update

Use one Chinese-capable system font stack for the entire landing UI. This gives fast first render and natural platform rendering without shipping a large CJK webfont; visual glyph details vary slightly by OS. Stack order targets native Apple/Windows UI fonts, then CJK fallbacks for other installations, with generic sans-serif at the end. Technical metadata alone uses a platform monospace stack. Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-family and https://www.nngroup.com/articles/website-reading/ .

## Hero scenario switcher

Moved the three work examples from a disconnected section below the hero to a manual carousel-like selector inside the workflow card. The selector sits next to the brief/output it changes, shows a compact active position and selected state, and announces the selected example name. No autoplay. This fixes the original visibility and cause/effect gap; at the desktop reference viewport the controls now remain within the hero card and first screen.

## Hero composition refinement

Use square, aligned geometry across work surfaces and remove decorative rotations from the hero work card, its output document, and the setup note. Move the scenario choices to the top of the hero card so the controls are visible before a visitor reads the sample. Compress surrounding vertical padding and internal card spacing, including wide-screen hero padding, to make the task and output more likely to fit common first-view heights. The primary CTA and value proposition remain prominent on the left.

## Product section hierarchy

The product section introduction is a compact, left-aligned title and supporting copy row at desktop widths. Its first authentic product screenshot follows with a short gap, reducing the empty vertical stack and bringing a complete product view into a typical second viewport. On mobile, the same content stacks in a single column.

## Partial bilingual shell

Vue I18n Composition API with separate `src/locales/zh-CN.json` and `en.json` messages. The first translation scope is the global shell only: skip link, brand label, primary navigation, language menu, Studio CTA, footer links/copy, and About document title. Main marketing content retains explicit `lang="zh-CN"` until a full translation pass is approved. Locale priority is saved preference, then browser language, with Chinese fallback. The selector is a native disclosure dropdown with a Languages icon, current locale, keyboard-accessible summary and named language options.

## Search and answer-engine discovery scaffold

- Unique Chinese title and description for the homepage and About page; canonical URLs use the apex host and extensionless `/about` route, matching Cloudflare Pages' served URL.
- Open Graph title/description/URL and a basic Twitter summary card for share previews.
- JSON-LD uses `WebSite` on home and `AboutPage` on About; it only describes visible site information and makes no unsupported product/organization claims.
- Root `robots.txt` allows public crawling and points to an absolute root `sitemap.xml`; sitemap lists only the two canonical public pages.
- Root `llms.txt` follows the llmstxt.org proposal (H1, short blockquote, grouped links) and gives a compact product/capability summary with authoritative first-party links. This is a discovery aid, not a search ranking guarantee.
- No `meta keywords` tag: Google Search documents that it ignores it; page titles, descriptions, visible text, canonicalization, crawl access and links are included instead.

Research sources:

- https://developers.google.com/search/docs/crawling-indexing/special-tags
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- https://llmstxt.org/

## Footer external links

The footer uses three desktop columns: brand/tagline, primary site links, and friend links. OmniData and ScottWang Blog are listed vertically beneath the friend-links heading. Their descriptions stay muted, with no card background or border, so they remain secondary to the primary site navigation. On mobile, the columns collapse into a compact two-column layout under the brand.
