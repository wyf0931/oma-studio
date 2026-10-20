<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { persistLocale, type Locale } from "./i18n";
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Check,
  FileText,
  Search,
  Clock3,
  FolderOpen,
  SlidersHorizontal,
  Blocks,
  GitBranch,
  Share2,
  PanelsTopLeft,
  WandSparkles,
  Users,
  ChartNoAxesCombined,
  Plus,
  MessageSquare,
  CheckCheck,
  Languages,
  ChevronDown,
} from "@lucide/vue";
const about = location.pathname.endsWith("/about.html");
const { t, locale } = useI18n({ useScope: "global" });
const menu = ref(false),
  localeMenu = ref<HTMLDetailsElement | null>(null),
  selected = ref(0);
watch(
  locale,
  (value) => {
    document.documentElement.lang = value;
    document.title = about ? t("page.aboutTitle") : t("pageTitle");
  },
  { immediate: true },
);
function selectLocale(value: Locale): void {
  locale.value = value;
  persistLocale(value);
  menu.value = false;
  if (localeMenu.value) localeMenu.value.open = false;
}
const cases = [
  {
    name: "市场研究",
    role: "研究助理",
    icon: Search,
    prompt: "整理本周值得关注的行业变化，核对来源，给我一份可以继续讨论的研究简报。",
    file: "本周行业观察.md",
    heading: "从信息，走向判断。",
    intro: "收集公开资料，保留来源，把值得关注的变化整理到一起。",
    items: ["行业动态与来源", "关键变化与影响", "值得继续追踪的问题"],
    tag: "研究 · 简报",
  },
  {
    name: "内容准备",
    role: "内容编辑",
    icon: FileText,
    prompt: "把这份研究资料整理成一篇文章提纲，沿用我们的表达风格，标出还需要补充的材料。",
    file: "文章策划与提纲.md",
    heading: "从资料，走向表达。",
    intro: "沿用你的写作方法，把零散的材料变成有结构的内容计划。",
    items: ["读者与文章角度", "正文结构与论据", "待核实的事实清单"],
    tag: "内容 · 策划",
  },
  {
    name: "周期性事务",
    role: "情报助理",
    icon: Clock3,
    prompt: "每周一整理一次竞品公开动态，按产品、内容和市场动作分类，留下本周的观察。",
    file: "竞品动态周报.md",
    heading: "从一次，走向每周。",
    intro: "把明确的指令交给 Autopilot，按计划运行，再回来看结果。",
    items: ["本周公开动态", "与上期相比的变化", "来源与后续关注"],
    tag: "定时 · 周报",
  },
];
const active = computed(() => cases[selected.value]!);
const features = [
  {
    icon: Share2,
    title: "对话分享，打开就能看。",
    summary: "无需登录查看 · 分享链接管理",
    detail: "把对话分享给同事或合作伙伴，对方无需登录即可查看。已创建的分享链接可以集中管理，并在不再需要时撤销。",
  },
  {
    icon: PanelsTopLeft,
    title: "材料与成果，先看再用。",
    summary: "CSV · HTML · Images · Markdown",
    detail:
      "在工作台预览输入材料和 Agent 生成的文件。表格、网页、图片与 Markdown 等常见格式，方便随时查看和核对，减少来回下载与切换。",
  },
  {
    icon: WandSparkles,
    title: "说清想做什么，就能起步。",
    summary: "Agent 定义自动扩写",
    detail:
      "写下简短的 instruction，选好需要的 Skills，系统就能据此推测并优化 Agent 定义。你可以审阅、调整后保存，不必从空白长指令开始。",
  },
  {
    icon: Users,
    title: "团队使用，有人管理。",
    summary: "管理员与普通用户 · 账号管理",
    detail:
      "管理员可以创建用户、启用或停用账号，管理团队成员的使用入口。普通用户在自己的工作区中管理 Agent、任务和成果。",
  },
  {
    icon: ChartNoAxesCombined,
    title: "用了多少，看得清楚。",
    summary: "个人 Token 用量 · 团队用量统计",
    detail:
      "个人可以查看自己各项任务的 Token 用量；管理员可以查看所有用户的用量，了解团队的使用分布，为模型选择和资源安排提供依据。",
  },
];
const shots = [
  {
    label: "AGENTS",
    title: "好方法，不必每次重讲。",
    text: "给 Agent 一个清楚的角色，写下工作方法，再选好模型、工具和 Skills。下一次任务，直接从熟悉的方法开始。",
    image: "agents",
    alt: "OMA Studio Agents 页面，展示可复用的 Agent 角色和配置",
    icon: SlidersHorizontal,
  },
  {
    label: "AUTOPILOTS",
    title: "重复的事，放进日程。",
    text: "把周期性指令设成 Autopilot。按计划执行，也能随时手动运行；每次运行都有记录，可以回到对应的对话。",
    image: "autopilots",
    alt: "OMA Studio Autopilots 页面，展示定时任务与运行管理",
    icon: Clock3,
  },
  {
    label: "LIBRARY",
    title: "工作结束，成果留下。",
    text: "你的所有 Agent 执行后生成的文件，都会汇集到你的 Library。报告、笔记和其他产物不再散落在各个对话里；随时搜索、按 Agent 筛选、预览或下载，也能回到来源对话继续工作。",
    image: "library",
    alt: "OMA Studio Library 页面，展示 Agent 生成的文件与搜索筛选",
    icon: FolderOpen,
  },
];
</script>
<template>
  <a class="skip" href="#main" :lang="locale">{{ t("skip") }}</a>
  <header class="site-header wrap" :lang="locale">
    <a href="/" class="brand" :aria-label="t('brand')"
      ><img src="/images/logo.png" alt="" width="36" height="36" /><span
        >OMA<span class="brand-light"> Studio</span></span
      ></a
    >
    <button
      class="btn btn-ghost mobile-toggle"
      :aria-expanded="menu"
      aria-controls="navigation"
      :aria-label="menu ? t('navigation.closeMenu') : t('navigation.openMenu')"
      @click="menu = !menu"
    >
      <X v-if="menu" /><Menu v-else />
    </button>
    <nav id="navigation" :class="{ open: menu }" :aria-label="t('navigation.label')">
      <a href="/#product" @click="menu = false">{{ t("navigation.product") }}</a>
      <a href="/#use-cases" @click="menu = false">{{ t("navigation.useCases") }}</a>
      <a href="/#features" @click="menu = false">{{ t("navigation.features") }}</a>
      <a href="/about.html" :aria-current="about ? 'page' : undefined">{{ t("navigation.about") }}</a>
      <a href="https://github.com/wyf0931/oma-studio" class="source-link">GitHub <ArrowUpRight /></a>
      <details ref="localeMenu" class="locale-menu">
        <summary class="locale-trigger" :aria-label="t('navigation.language')">
          <Languages aria-hidden="true" /><span>{{ locale === "en" ? "English" : "中文" }}</span
          ><ChevronDown class="locale-chevron" aria-hidden="true" />
        </summary>
        <div class="locale-options">
          <button type="button" class="locale-choice" :aria-pressed="locale === 'zh-CN'" @click="selectLocale('zh-CN')">
            <span>中文</span><Check v-if="locale === 'zh-CN'" aria-hidden="true" />
          </button>
          <button type="button" class="locale-choice" :aria-pressed="locale === 'en'" @click="selectLocale('en')">
            <span>English</span><Check v-if="locale === 'en'" aria-hidden="true" />
          </button>
        </div>
      </details>
    </nav>
    <a class="btn btn-primary header-cta" href="https://studio.ohmyagent.ai"
      >{{ t("navigation.studio") }} <ArrowUpRight
    /></a>
  </header>
  <main id="main" lang="zh-CN">
    <template v-if="!about">
      <section class="hero-section wrap">
        <div class="hero-copy">
          <p class="eyebrow"><span class="live-dot"></span> OH MY AGENT · 你的 Agent 工作台</p>
          <h1>让好方法，<br />持续<span class="accent">工作。</span></h1>
          <p class="hero-description">
            研究、写作、日常事务。<br />把你熟悉的工作方法交给 Agent，<br
              class="desktop-break"
            />在自己的工作台里，做出可以使用的成果。
          </p>
          <div class="hero-actions">
            <a href="https://studio.ohmyagent.ai" class="btn btn-primary">打开 OMA Studio <ArrowUpRight /></a
            ><a href="#product" class="text-link">看看如何工作 <ArrowRight /></a>
          </div>
          <p class="hero-note">开源 · Local-first · 模型由你选择</p>
        </div>
        <div class="desk">
          <div class="desk-top">
            <span><span class="live-dot"></span> A SMALL STUDIO. REAL WORK.</span><span>工作流示意</span>
          </div>
          <div id="use-cases" class="case-switcher">
            <span class="case-switcher-label"
              >选择一个场景
              <span aria-live="polite"
                >示例 {{ String(selected + 1).padStart(2, "0") }} / 0{{ cases.length }} · {{ active.name }}</span
              ></span
            >
            <div class="case-options" role="group" aria-label="切换工作流示例">
              <button
                v-for="(item, index) in cases"
                :key="item.name"
                class="case-button"
                :class="{ selected: selected === index }"
                :aria-label="`查看${item.name}示例`"
                :aria-pressed="selected === index"
                @click="selected = index"
              >
                <component :is="item.icon" /><span>{{ item.name }}</span>
              </button>
            </div>
          </div>
          <div class="brief">
            <div class="brief-label"><MessageSquare /> 给 {{ active.role }} 的任务</div>
            <p>{{ active.prompt }}</p>
            <div class="brief-bottom">
              <span>工作方法已就位</span><span class="capability"><Check /> Skills & tools</span>
            </div>
          </div>
          <div class="connection"><span></span><span>Agent 整理、执行、生成文件</span><ArrowRight /></div>
          <div class="document">
            <div class="document-top">
              <span class="file-square"><FileText /></span>
              <div>
                <strong>{{ active.file }}</strong
                ><small>LIBRARY / {{ active.tag }}</small>
              </div>
              <CheckCheck class="done" />
            </div>
            <h2>{{ active.heading }}</h2>
            <p>{{ active.intro }}</p>
            <ul>
              <li v-for="(item, index) in active.items" :key="item">
                <span>0{{ index + 1 }}</span
                >{{ item }}<Check />
              </li>
            </ul>
            <div class="document-bottom"><span>可以查看 · 可以下载 · 可以继续</span><FolderOpen /></div>
          </div>
          <div class="desk-footer"><span>从一句指令，到一份成果。</span><span>OMA STUDIO</span></div>
        </div>
      </section>
      <section class="principles">
        <div class="wrap principles-grid">
          <p>一个工作台，<br /><strong>连接工作的前后。</strong></p>
          <div>
            <span>有方法的 Agent</span>
            <p>角色、指令和能力可复用。</p>
          </div>
          <div>
            <span>看得见的过程</span>
            <p>在对话中查看工具活动与结果。</p>
          </div>
          <div>
            <span>带得走的成果</span>
            <p>留下文件，供你审阅和继续使用。</p>
          </div>
        </div>
      </section>
      <section id="product" class="product-section wrap">
        <div class="section-heading">
          <p class="eyebrow">A PLACE TO GET THINGS DONE</p>
          <h2>不止对话。<br />把工作往前推进。</h2>
          <p>从定义角色，到安排任务，再到收好成果。<br />让每一步都有一个合适的位置。</p>
        </div>
        <article v-for="(shot, index) in shots" :key="shot.label" class="feature-row" :class="{ reverse: index === 1 }">
          <div class="feature-copy">
            <component :is="shot.icon" class="feature-icon" />
            <p class="eyebrow">{{ shot.label }}</p>
            <h3>{{ shot.title }}</h3>
            <p>{{ shot.text }}</p>
            <a class="text-link" href="https://studio.ohmyagent.ai">在工作台中探索 <ArrowUpRight /></a>
          </div>
          <figure class="product-shot">
            <div class="shot-bar">
              <span></span><span></span><span></span><small>OMA Studio / {{ shot.label.toLowerCase() }}</small>
            </div>
            <img :src="`/images/${shot.image}.png`" :alt="shot.alt" loading="lazy" width="1600" height="1000" />
            <figcaption>产品界面 · {{ shot.label }}</figcaption>
          </figure>
        </article>
      </section>
      <section id="marketplace" class="marketplace-section wrap" aria-labelledby="marketplace-title">
        <div class="marketplace-heading">
          <div>
            <p class="eyebrow">MARKETPLACE / METHODS WORTH SHARING</p>
            <h2 id="marketplace-title">用现成的开始。<br />按自己的方式继续。</h2>
          </div>
          <p>把场景适配的经验，留给每个需要它的人。<br />第一次用 Agent，也能找到合适的起点。</p>
        </div>
        <div class="marketplace-body">
          <figure class="product-shot">
            <div class="shot-bar"><span></span><span></span><span></span><small>OMA Studio / marketplace</small></div>
            <img
              src="/images/marketplace.png"
              alt="OMA Studio Marketplace，浏览共享 Agent、Skills、Extensions 和 MCP 资源"
              loading="lazy"
              width="1600"
              height="1000"
            />
            <figcaption>产品界面 · MARKETPLACE</figcaption>
          </figure>
          <div class="marketplace-paths">
            <article>
              <span class="path-label"><Blocks /> 安装即用</span>
              <h3>找到适合的 Agent，直接开工。</h3>
              <p>
                从预装与已发布的 Agent 中选择，安装到自己的工作区即可使用。角色与方法已准备好，把注意力放在任务本身。
              </p>
            </article>
            <article>
              <span class="path-label"><SlidersHorizontal /> 按需 DIY</span>
              <h3>你的需求，可以有自己的组合。</h3>
              <p>
                安装的 Agent 是自己的副本，可以继续调整。也可以从简短指令开始，组合已提供的 Skills、Extensions 与
                MCP，搭出自己的 Agent。
              </p>
            </article>
          </div>
        </div>
        <div class="marketplace-foundation">
          <GitBranch />
          <div>
            <h3>适配一次，让团队反复使用。</h3>
            <p>
              管理员或驻场 FDE 围绕实际场景适配 Agent，发布到 Marketplace，并准备好 Skills、Extensions 和 MCP
              等共享资源。普通用户从这些资源中安装或组合；Agent
              需要明确选择启用的能力，让团队在统一维护的资源基础上保留使用自由。
            </p>
          </div>
        </div>
      </section>
      <section id="features" class="features-section wrap" aria-labelledby="features-title">
        <div class="features-heading">
          <p class="eyebrow">THE DETAILS THAT KEEP WORK MOVING</p>
          <h2 id="features-title">日常用得顺，<br />团队也管得清。</h2>
          <p>从创建 Agent 到查看成果，<br />把工作中容易卡住的小事，也照顾好。</p>
          <a href="https://studio.ohmyagent.ai" class="text-link">进入工作台探索 <ArrowUpRight /></a>
        </div>
        <div class="feature-details">
          <details v-for="feature in features" :key="feature.title">
            <summary>
              <component :is="feature.icon" /><span
                ><strong>{{ feature.title }}</strong
                ><small>{{ feature.summary }}</small></span
              ><Plus />
            </summary>
            <p>{{ feature.detail }}</p>
          </details>
        </div>
      </section>
      <section id="open-source" class="ownership wrap">
        <div>
          <p class="eyebrow">YOUR STUDIO, YOUR SETUP</p>
          <h2>在你掌控的环境里，<br />搭起自己的工作室。</h2>
          <p>
            OMA Studio 是一个开源、local-first 的项目。<br />选择模型连接，在本机或自己管理的基础设施上运行。<br />从一个人的工作方法开始，慢慢积累自己的
            Agent。
          </p>
          <a class="btn btn-primary" href="https://github.com/wyf0931/oma-studio#quick-start"
            >查看部署指南 <ArrowUpRight
          /></a>
        </div>
        <div class="setup-note">
          <span>THE STUDIO MANIFEST</span>
          <div><Check /> 你的方法 <small>Agent instructions & Skills</small></div>
          <div><Check /> 你的模型 <small>Choose your provider</small></div>
          <div><Check /> 你的环境 <small>Local-first & self-hosted</small></div>
          <p>
            Open source, built in the open.<br /><a href="https://github.com/wyf0931/oma-studio/blob/main/LICENSE"
              >AGPL-3.0 <ArrowUpRight
            /></a>
          </p>
        </div>
      </section>
      <section class="faq wrap">
        <div>
          <p class="eyebrow">A FEW THINGS TO KNOW</p>
          <h2>开始之前。</h2>
        </div>
        <div class="faq-list">
          <details>
            <summary>OMA Studio 适合什么工作？<Plus /></summary>
            <p>
              适合研究简报、内容准备、竞品观察、资料整理和周期性报告等知识工作。你定义工作方法、提供必要资料，并审阅
              Agent 的结果。它也具备代码和命令行能力，但并不以 IDE 为中心。
            </p>
          </details>
          <details>
            <summary>需要订阅套餐吗？<Plus /></summary>
            <p>
              项目开源，没有本页面提供的订阅套餐。自行部署需要准备运行环境、Pi
              和模型连接；模型提供商可能收取使用费用。在线工作台需要已有账号。
            </p>
          </details>
          <details>
            <summary>Agent、Skill 和 Autopilot 有什么区别？<Plus /></summary>
            <p>
              Agent 定义谁来做、按什么要求做；Skill 保存可重复使用的方法；Autopilot
              决定什么时候运行一条固定指令。结果可以在对话和 Library 中查看。
            </p>
          </details>
          <details>
            <summary>目前有哪些使用边界？<Plus /></summary>
            <p>
              项目仍在持续开发。应只启用可信的工具与扩展，并审阅结果。Local-first
              不代表模型请求一定留在本地；数据流向取决于你的模型与工具配置。当前执行环境不提供完整安全沙箱。
            </p>
          </details>
        </div>
      </section>
      <section class="closing wrap">
        <p class="eyebrow">LESS REPEATING. MORE MAKING.</p>
        <h2>下一件事，<br />让你的 Agent 一起做。</h2>
        <a class="btn btn-primary" href="https://studio.ohmyagent.ai">进入工作台 <ArrowUpRight /></a
        ><a class="text-link" href="https://github.com/wyf0931/oma-studio">或者，从自己部署开始 <ArrowRight /></a>
      </section>
    </template>
    <template v-else
      ><section class="about-hero wrap">
        <p class="eyebrow">ABOUT / OH MY AGENT</p>
        <h1>给好的工作方法，<br />一个<span class="accent">留下来的地方。</span></h1>
        <p>我们做 OMA Studio，是想把一次有用的对话，<br />变成下一次工作可以依靠的开始。</p>
      </section>
      <section class="about-content wrap">
        <div>
          <p class="eyebrow">WHY A STUDIO</p>
          <h2>一个小工作室，<br />也可以有自己的 Agent。</h2>
        </div>
        <div>
          <p>
            研究、写作、运营和规划，常常需要反复解释同一套背景、同一份标准和同一种做法。我们希望这些经验能被留下来，变成有角色、有方法、有合适工具的
            Agent。
          </p>
          <p>
            Studio 是工作的地方。你可以在这里发起对话，安排周期性任务，检查执行过程，把生成的文件收进
            Library。最终的判断和选择，始终交给使用它的人。
          </p>
          <h3>开放，也留有选择。</h3>
          <p>
            OMA Studio 建立在 Pi Agent runtime
            之上。项目开源，支持在自己管理的环境中部署，也让你选择模型连接与启用的能力。Local-first
            是一种关于掌控权的选择，并不是完整安全隔离或离线运行的承诺。
          </p>
          <h3>从具体的工作开始。</h3>
          <p>
            这是一个持续开发中的项目。我们重视可复用的方法、可查看的过程，以及可以带走的成果。先把日常工作做好，再决定下一步需要什么。
          </p>
          <a class="btn btn-primary" href="https://github.com/wyf0931/oma-studio"
            >查看项目与贡献指南 <ArrowUpRight
          /></a>
        </div>
      </section>
      <section class="closing wrap">
        <p class="eyebrow">OH MY AGENT</p>
        <h2>你的方法。你的工作室。</h2>
        <a href="/" class="text-link">认识 OMA Studio <ArrowRight /></a></section
    ></template>
  </main>
  <footer class="wrap site-footer" :lang="locale">
    <div class="footer-columns">
      <div class="footer-brand-column">
        <a href="/" class="brand"
          ><img src="/images/logo.png" alt="" width="30" height="30" /><span
            >OMA<span class="brand-light"> Studio</span></span
          ></a
        >
        <p>{{ t("footer.tagline") }}</p>
      </div>
      <nav class="footer-link-column" :aria-label="t('footer.siteLinks')">
        <h2>{{ t("footer.siteLinks") }}</h2>
        <a href="/about.html">{{ t("footer.about") }}</a>
        <a href="https://github.com/wyf0931/oma-studio">{{ t("footer.github") }} <ArrowUpRight /></a>
        <a href="https://github.com/wyf0931/oma-studio#quick-start">{{ t("footer.docs") }} <ArrowUpRight /></a>
      </nav>
      <section class="footer-friends" :aria-label="t('footer.friends')">
        <h2>{{ t("footer.friends") }}</h2>
        <div class="footer-friend-list">
          <a href="https://data.ohmyagent.ai/" target="_blank" rel="noopener noreferrer">
            <span
              ><strong>OmniData</strong><small>{{ t("footer.omniDataDescription") }}</small></span
            ><ArrowUpRight />
          </a>
          <a href="https://wyf0931.cn/" target="_blank" rel="noopener noreferrer">
            <span
              ><strong>ScottWang Blog</strong><small>{{ t("footer.blogDescription") }}</small></span
            ><ArrowUpRight />
          </a>
        </div>
      </section>
    </div>
    <small>{{ t("footer.copyright") }}</small>
  </footer>
</template>
