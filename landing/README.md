# OMA Studio landing

独立的产品宣传站，包含首页、About，以及可切换的工作流示例。无需 FastAPI 或 OMA API，所有资源随构建发布，无运行时 CDN 或字体请求。

```bash
cd landing
npm ci
npm run dev
npm run format:check
npm run build
npm run preview
```

Node >=22.12。发布 `dist/` 到任意静态托管服务；首页 `/`，About `/about.html`，无需 SPA fallback。此目录可以独立复制或拆成仓库。修改工作台地址时搜索 `https://studio.ohmyagent.ai`；文档与源码链接指向 GitHub 项目。

`DESIGN.md` 记录功能审查、受众、视觉规范和研究来源。`public/images` 中的产品截图复制自仓库 docs/images，hero 是明确标注的演示，不调用后端或模型。在线工作台需要已有账号；自行部署指南是另一入口。没有注册、收费、分析追踪或虚构评价。

Language switching uses Vue I18n. The first pass localizes navigation, Studio CTA, footer and page title; it remembers the selected locale in localStorage and otherwise follows browser language (Chinese or English). Main editorial copy remains Chinese at this stage.

## Cloudflare Pages

The production Pages project is `oma-studio-landing` (`oma-studio-landing.pages.dev`), with `main` configured as the production branch. It uses Direct Upload from `dist/`:

```bash
cd landing
npm ci
npm run build
npx wrangler pages deploy dist --project-name=oma-studio-landing --branch=main
```

Wrangler must be authenticated to the Cloudflare account with Pages deployment access. Production domains are `https://ohmyagent.ai` and `https://www.ohmyagent.ai`; both are attached to this Pages project. Their proxied CNAME targets are `oma-studio-landing.pages.dev`.

## Search and AI discovery files

The production bundle includes unique title/description and canonical/share metadata on both pages, lightweight JSON-LD, plus root `robots.txt`, `sitemap.xml`, and `llms.txt`. The sitemap lists only the canonical homepage and About page. Add future public pages to the sitemap and llms index as they ship. Google does not use a `meta keywords` tag, so none is emitted.
