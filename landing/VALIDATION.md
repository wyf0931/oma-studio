# Validation

Checked locally on 2026-10-20.

## Landing

- `npm ci`, `npm run format:check`, `npm run build`: pass (strict vue-tsc + Vite).
- Chromium browser: inspected desktop 1440×1000 and mobile 390×844 screenshots, full page and mobile product section.
- No horizontal overflow at 320, 390, 768, 1440 pixels.
- Scenario buttons update the task, output title and output contents.
- Mobile menu opens; About navigates to a real static page with its own title and description.
- FAQ disclosure opens, screenshots load with alt text, no observed page errors.
- First keyboard focus reaches skip link; reduced motion sets scroll behavior to auto.
- No deployment performed. No backend or application frontend files changed.

## Repository gate

Passed: Ruff format/check, TypeScript, typecheck policy, module policy, contract unit checks, Prettier, ESLint, compatibility policy, production build, Pyright (0 errors), git diff --check.

Existing baseline issue: `npm run api:check` reports contract drift in `schemas/openapi.json`. `uv run pytest -q` reports **267 passed, 1 failed**; the sole failure is `tests/integration/test_contracts.py::test_isolated_schema_matches_the_live_api_and_uses_no_production_state`, comparing the existing snapshot against the API. Only `landing/` is new in the working tree; API/schema files were not modified. The standalone landing build does not depend on these artifacts.

## Marketplace / supporting features update

- Standalone strict typecheck, build and formatting checks pass.
- Chromium checks at 320, 390, 768, 1024 and 1440px: no horizontal overflow.
- Inspected Marketplace desktop and expanded feature-list mobile screenshots.
- All five feature disclosures open; mobile Features navigation reaches `#features`; Marketplace screenshot loads.
- Re-ran repository pytest: 267 passed; same single pre-existing schema snapshot drift failure. No API changes.

## Typography update

- Landing CSS now uses one system-native CJK sans stack for body, headings, and navigation; only short metadata uses platform monospace.
- Verified standalone build and formatting. Browser computed styles confirm the same sans stack on body, h1 and navigation; screenshots remain available in `/private/tmp/oma-landing-system-font.png`.

## Hero alignment and first-screen fit

- Removed the hero card/document rotation and setup-note rotation so key panels share the page grid.
- Moved scenario controls to the top of the workflow panel and reduced hero/card spacing, including wide desktop spacing.
- Visually reviewed 1638×845 and 390×844 previews. At 1638×845 the selector, task, generated output, headline and main CTA all fit in the first viewport; on mobile the selector appears near the top of the example panel.
- `npm run build` and `npm run format:check` pass.

## Product section spacing

- Tightened the product section's intro into a compact two-column title/support row and reduced the gap before the first screenshot.
- Visually reviewed at 1638×845: the intro and complete first product screenshot now fit together in the viewport, with the next screenshot peeking below to signal continuation.
- `npm run build`, `npm run format:check` and `git diff --check` pass.

## Chinese / English shell i18n

- Added Vue I18n Composition API with separate `en` and `zh-CN` messages.
- Header navigation, Studio CTA, footer, skip link, and About document title switch locale; the Chinese marketing body carries an explicit `lang="zh-CN"` until translated.
- Locale choice persists across reloads. New visits follow browser language, defaulting to Chinese for Chinese browsers.
- Replaced segmented language buttons with an icon-led native disclosure dropdown; tested opening, selecting each locale, closing on selection, persisted English after reload, and mobile menu/dropdown visibility.
- `npm run build`, `npm run format:check`, and `git diff --check` pass.

## Cloudflare Pages production deployment

- Created Pages project `oma-studio-landing` with production branch `main` and deployed the built `dist/` with Wrangler Direct Upload.
- Production deployment: `https://c4311f15.oma-studio-landing.pages.dev`.
- Added both `ohmyagent.ai` and `www.ohmyagent.ai` as Pages custom domains in the same active Cloudflare zone.
- Updated apex CNAME to `oma-studio-landing.pages.dev`; added proxied `www` CNAME to the same target. Kept all mail and other service DNS records unchanged.
- Live checks returned HTTP 200 and the expected OMA title for `/` and `/about.html` on both hostnames. Cloudflare Pages API reports both domains `active` for domain verification and validation. HTTPS and page content are live on both hostnames.

## SEO / GEO discovery scaffold

- Homepage and About have distinct static titles, descriptions, canonical URLs, Open Graph fields, and JSON-LD (`WebSite`, `AboutPage`).
- The built output contains root `robots.txt`, `sitemap.xml`, and `llms.txt`; sitemap URLs use the same apex and extensionless canonical About path.
- Kept crawl access open for all crawlers. `llms.txt` follows the public proposal's H1, summary blockquote, grouped section/link format. No ranking or answer-engine citation guarantee is implied.
- Google Search Central says it ignores meta-keywords; the skeleton uses page descriptions, titles, canonical, visible content, structured data and a sitemap instead.

- Published the SEO/GEO metadata update to Cloudflare Pages production (`e6e4ad5d-27e3-4f06-8e22-5bbf2c0fdedb`, branch `main`).
- Confirmed on both production hostnames: `/`, `/about`, `/robots.txt`, `/sitemap.xml`, and `/llms.txt` each return HTTP 200; HTML pages expose their expected canonical URL/title/description and parseable JSON-LD; sitemap contains the two canonical URLs.

## Footer external links refinement

- Added bilingual footer links for OmniData and ScottWang Blog with concise descriptions based on each site's own `llms.txt`.
- Refined the footer into brand, site-link and friend-link columns; the two friend links now stack in their own column, without cards or borders. Mobile collapses to two columns beneath the brand.
- Strict Vue/Vite production build and Prettier check pass.

## Footer links visual refinement

- Kept the two requested external links, but replaced card-like tiles with a low-contrast text-link group beneath the main footer navigation.
- Descriptions appear below each link name in smaller muted text. Links have no border or background.
- Production updated after review; homepage still returns HTTP 200 from both canonical and `www` hostnames.

## Footer column layout

- Reorganized the footer into same-row desktop columns for brand/tagline, site links, and friends. OmniData and ScottWang Blog now appear vertically under the Friends heading.
- Mobile collapses to a brand row followed by site-links and friends columns; verified at 390px with no horizontal overflow.
- Deployed to Pages production (`https://26617967.oma-studio-landing.pages.dev`); both `ohmyagent.ai` and `www.ohmyagent.ai` return HTTP 200.
- `npm run build`, `npm run format:check`, and `git diff --check` pass.
