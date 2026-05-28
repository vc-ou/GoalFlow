import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("design/ui-mockups/apple-xhs");
const size = { width: 1536, height: 2048 };

const palette = {
  bg0: "#f5f5f7",
  bg1: "#e9edf3",
  ink: "#111111",
  sub: "rgba(17,17,17,0.62)",
  soft: "rgba(17,17,17,0.38)",
  white: "#ffffff",
  line: "rgba(255,255,255,0.58)",
  cardLine: "rgba(17,17,17,0.08)",
  red: "#ff2442",
  pink: "#ff5f7f",
  coral: "#ff8b6b",
  blue: "#7c97ff",
  indigo: "#5a6fff",
  mint: "#73f0cb",
  green: "#34c89a",
  gold: "#f5c76b",
  steel: "#bfc8d6",
  glass: "rgba(255,255,255,0.42)",
  glassStrong: "rgba(255,255,255,0.68)",
  shadow: "rgba(15, 23, 42, 0.16)"
};

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lines(textLines, x, y, lineHeight, className) {
  return `<text x="${x}" y="${y}" class="${className}">${textLines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`)
    .join("")}</text>`;
}

function rect(x, y, w, h, fill, rx = 26, stroke = "", extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${
    stroke ? ` stroke="${stroke}"` : ""
  } ${extra}/>`;
}

function phone(x, y, w, h, inner) {
  const sx = x + 24;
  const sy = y + 74;
  const sw = w - 48;
  const sh = h - 118;
  return `
    <g filter="url(#phoneShadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="78" fill="url(#phoneShell)"/>
      <rect x="${x + 108}" y="${y + 20}" width="${w - 216}" height="18" rx="9" fill="rgba(255,255,255,0.84)"/>
      <text x="${x + 48}" y="${y + 62}" class="statusDots">●●●●●</text>
      <text x="${x + w / 2 - 34}" y="${y + 62}" class="statusTime">10:30</text>
      <text x="${x + w - 120}" y="${y + 62}" class="statusBattery">100%</text>
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="48" fill="url(#screenGlow)"/>
      ${inner(sx, sy, sw, sh)}
      <rect x="${x + w / 2 - 126}" y="${y + h - 30}" width="252" height="8" rx="4" fill="rgba(255,255,255,0.56)"/>
    </g>
  `;
}

function glassCard(x, y, w, h, content, tint = "url(#glassPanel)") {
  return `
    <g filter="url(#glassShadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${tint}" stroke="${palette.line}"/>
      ${content}
    </g>
  `;
}

function posterBackdrop(title, subtitle, badge) {
  return `
    <rect width="${size.width}" height="${size.height}" fill="url(#bgGradient)"/>
    <circle cx="196" cy="328" r="188" fill="url(#orbPink)" opacity="0.9"/>
    <circle cx="1330" cy="280" r="240" fill="url(#orbBlue)" opacity="0.84"/>
    <circle cx="1188" cy="1738" r="278" fill="url(#orbMint)" opacity="0.7"/>
    <circle cx="280" cy="1702" r="176" fill="url(#orbGold)" opacity="0.62"/>
    <path d="M92 1420 C 234 1260, 430 1212, 598 1284 S 934 1532, 1110 1474 S 1336 1298, 1466 1364" stroke="rgba(255,255,255,0.42)" stroke-width="3" fill="none"/>
    <path d="M1004 118 C 1092 80, 1228 74, 1324 146 S 1450 320, 1420 428" stroke="rgba(90,111,255,0.2)" stroke-width="6" fill="none"/>
    <path d="M170 520 C 280 464, 372 470, 466 534" stroke="rgba(255,36,66,0.18)" stroke-width="8" fill="none"/>

    ${glassCard(
      104,
      120,
      312,
      144,
      `
        <text x="142" y="176" class="topBadge">${esc(badge)}</text>
        <text x="142" y="230" class="topMetric">Apple × RED</text>
      `
    )}

    ${glassCard(
      1180,
      92,
      236,
      292,
      `
        <text x="1216" y="154" class="floatStatLabel">灵感热度</text>
        <text x="1216" y="242" class="floatStatBig">9.8</text>
        <path d="M1216 304 C 1254 248, 1308 220, 1360 246 S 1450 364, 1496 298" stroke="rgba(255,255,255,0.72)" stroke-width="6" fill="none"/>
      `,
      "url(#glassBlue)"
    )}

    <text x="104" y="1712" class="posterMark">GOALFLOW MINI PROGRAM</text>
    ${lines(title, 104, 1798, 84, "posterTitle")}
    ${lines(subtitle, 104, 1940, 38, "posterSub")}
  `;
}

function navBar(active) {
  const items = [
    { key: "home", label: "首页", x: 84, icon: "⌂" },
    { key: "plans", label: "计划", x: 194, icon: "◫" },
    { key: "review", label: "复盘", x: 304, icon: "✎" },
    { key: "me", label: "我的", x: 414, icon: "◌" }
  ];
  return items
    .map((item) => {
      const isActive = item.key === active;
      return `
        <circle cx="${item.x}" cy="0" r="24" fill="${isActive ? "url(#activeBubble)" : "rgba(255,255,255,0.72)"}"/>
        <text x="${item.x - 9}" y="8" class="${isActive ? "navActiveIcon" : "navIcon"}">${item.icon}</text>
        <text x="${item.x - 18}" y="42" class="${isActive ? "navActiveLabel" : "navLabel"}">${item.label}</text>
      `;
    })
    .join("");
}

function leftScreen(page) {
  return (x, y, w, h) => `
    <text x="${x + 34}" y="${y + 72}" class="screenTag">${esc(page.left.tag)}</text>
    ${lines(page.left.title, x + 34, y + 140, 54, "screenTitle")}
    <rect x="${x + 24}" y="${y + 200}" width="${w - 48}" height="${h - 330}" rx="30" fill="rgba(255,255,255,0.94)" stroke="${palette.cardLine}"/>
    ${page.left.body(x + 24, y + 200, w - 48, h - 330)}
    <g transform="translate(${x + 42} ${y + h - 86})">
      ${navBar(page.left.nav)}
    </g>
  `;
}

function centerScreen(page) {
  return (x, y, w, h) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.56}" fill="url(#heroMesh)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.56}" fill="rgba(255,255,255,0.08)"/>
    <text x="${x + 44}" y="${y + 82}" class="centerTag">${esc(page.center.tag)}</text>
    ${lines(page.center.heroTitle, x + 44, y + 168, 78, "centerHeroTitle")}
    ${lines(page.center.heroSub, x + 44, y + 332, 32, "centerHeroSub")}
    <rect x="${x + 30}" y="${y + h * 0.46}" width="${w - 60}" height="${h * 0.34}" rx="30" fill="rgba(255,255,255,0.92)"/>
    ${page.center.body(x + 30, y + h * 0.46, w - 60, h * 0.34)}
    <g transform="translate(${x + 54} ${y + h - 88})">
      ${navBar(page.center.nav)}
    </g>
  `;
}

function rightScreen(page) {
  return (x, y, w, h) => `
    <text x="${x + 34}" y="${y + 70}" class="rightMonth">${esc(page.right.tag)}</text>
    ${page.right.top(x + 34, y + 100, w - 68)}
    ${page.right.cards(x + 28, y + 246, w - 56)}
  `;
}

const pages = [
  {
    slug: "01-login",
    title: "登录页",
    badge: "高科技感内容启动页",
    posterTitle: ["进入之前，", "先被愿景吸引。"],
    posterSubtitle: ["像 Apple 展示新产品那样干净克制，", "再加一点小红书式内容社区的灵感诱因。"],
    left: {
      tag: "Trending notes",
      title: ["灵感热榜", "今日上新"],
      nav: "home",
      body: (x, y, w) => `
        ${rect(x + 24, y + 24, w - 48, 120, "url(#pinkCard)", 28)}
        <text x="${x + 52}" y="${y + 78}" class="noteTitle">AI 陪跑营从 0 到 10 个付费用户</text>
        <text x="${x + 52}" y="${y + 116}" class="noteSub">3.2 万浏览 · 1.1k 收藏</text>
        ${rect(x + 24, y + 164, w - 48, 120, "rgba(17,17,17,0.04)", 28)}
        <text x="${x + 52}" y="${y + 220}" class="noteTitle">创作者如何用目标系统摆脱焦虑</text>
      `
    },
    center: {
      tag: "成长薄",
      heroTitle: ["把目标", "做成可被看见的成长。"],
      heroSub: ["一键登录，进入你的创作路线图。", "不是打卡，而是从灵感到结果的真实推进。"],
      nav: "home",
      body: (x, y, w, h) => `
        <text x="${x + 36}" y="${y + 72}" class="bodyTitle">微信一键授权</text>
        <text x="${x + 36}" y="${y + 112}" class="bodySub">登录后自动同步你的当前目标、计划卡片与明日灵感。</text>
        ${rect(x + 36, y + 150, w - 72, 76, "url(#darkButton)", 26)}
        <text x="${x + w / 2 - 92}" y="${y + 198}" class="buttonText">微信一键登录</text>
        ${rect(x + 36, y + 246, w - 72, 68, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + w / 2 - 78}" y="${y + 290}" class="ghostText">先看看产品亮点</text>
      `
    },
    right: {
      tag: "Why join",
      top: (x, y, w) => `
        ${rect(x, y, w, 106, "rgba(255,255,255,0.82)", 26)}
        <text x="${x + 28}" y="${y + 56}" class="smallKicker">登录后你会立刻看到</text>
        <text x="${x + 28}" y="${y + 92}" class="smallBody">当前目标 · 下一步行动 · 明日灵感</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 188, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 66}" class="statLabel">当前目标</text>
        <text x="${x + 26}" y="${y + 130}" class="statBig">1</text>
        ${rect(x, y + 212, w, 188, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 278}" class="statLabel">灵感待办</text>
        <text x="${x + 26}" y="${y + 342}" class="statBig">6</text>
      `
    }
  },
  {
    slug: "02-home",
    title: "首页",
    badge: "Apple 感首页 Hero",
    posterTitle: ["今天最重要的，", "只保留一件。"],
    posterSubtitle: ["用 Apple 式聚焦叙事展示核心任务，", "再借小红书的卡片内容感承接行动线索。"],
    left: {
      tag: "Progress",
      title: ["68%", "目标推进"],
      nav: "home",
      body: (x, y, w, h) => `
        <path d="M ${x + 24} ${y + 220} C ${x + 110} ${y + 100}, ${x + 200} ${y + 148}, ${x + 288} ${y + 82} S ${x + 430} ${y + 192}, ${x + 500} ${y + 136}" stroke="#62E5C0" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M ${x + 24} ${y + 220} C ${x + 110} ${y + 100}, ${x + 200} ${y + 148}, ${x + 288} ${y + 82} S ${x + 430} ${y + 192}, ${x + 500} ${y + 136} L ${x + 500} ${y + 290} L ${x + 24} ${y + 290} Z" fill="url(#chartFade)"/>
        ${rect(x + 200, y + 32, 130, 46, "url(#mintButton)", 22)}
        <text x="${x + 228}" y="${y + 62}" class="tinyPill">阶段 2 / 当前</text>
        <text x="${x + 22}" y="${y + 376}" class="smallKicker">已完成任务权重</text>
        <text x="${x + 22}" y="${y + 442}" class="graphBig">170 / 250</text>
      `
    },
    center: {
      tag: "现在推进",
      heroTitle: ["把下一步行动", "放在首页中央。"],
      heroSub: ["当前计划：AI 创作者陪跑营", "下一步：整理 20 条真实提问，提炼高频表达。"],
      nav: "home",
      body: (x, y, w) => `
        ${rect(x + 28, y + 30, w - 56, 84, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 58}" y="${y + 82}" class="bodyTitle">去 Reddit 找 20 条真实提问并整理钩子</text>
        <text x="${x + 58}" y="${y + 118}" class="bodySub">平台：Reddit / X · 关键词：ai workflow</text>
        ${rect(x + 28, y + 138, 158, 70, "url(#mintButton)", 24)}
        ${rect(x + 206, y + 138, 158, 70, "url(#darkButton)", 24)}
        <text x="${x + 72}" y="${y + 182}" class="smallButtonText">设为 doing</text>
        <text x="${x + 254}" y="${y + 182}" class="buttonText">直接完成</text>
        ${rect(x + 384, y + 138, 118, 70, "rgba(17,17,17,0.06)", 24)}
        <text x="${x + 418}" y="${y + 182}" class="ghostText">详情</text>
      `
    },
    right: {
      tag: "明日灵感",
      top: (x, y, w) => `
        <text x="${x}" y="${y}" class="calendarRow">灵感池</text>
        ${rect(x, y + 24, w, 120, "rgba(255,255,255,0.9)", 26)}
        <text x="${x + 24}" y="${y + 74}" class="bodyTitle">明天特别想做什么？</text>
        <text x="${x + 24}" y="${y + 114}" class="bodySub">把 demo 录完，再发一条小红书预热。</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 176, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 62}" class="statLabel">推荐任务</text>
        <text x="${x + 26}" y="${y + 126}" class="statBig">3</text>
        ${rect(x, y + 196, w, 176, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 258}" class="statLabel">最近完成</text>
        <text x="${x + 26}" y="${y + 322}" class="statBig">5</text>
      `
    }
  },
  {
    slug: "03-plans",
    title: "计划列表",
    badge: "内容社区式路线库",
    posterTitle: ["每个计划都像一张", "值得收藏的内容卡。"],
    posterSubtitle: ["小红书感的标签、主题与封面卡片，", "承载 Apple 风格的留白和秩序感。"],
    left: {
      tag: "Explore",
      title: ["路线", "收藏夹"],
      nav: "plans",
      body: (x, y, w) => `
        ${rect(x + 20, y + 20, w - 40, 130, "url(#pinkCard)", 28)}
        <text x="${x + 46}" y="${y + 76}" class="noteTitle">AI 创作者陪跑营</text>
        <text x="${x + 46}" y="${y + 116}" class="noteSub">#AI创作 #增长验证 #MVP</text>
        ${rect(x + 20, y + 170, w - 40, 130, "rgba(17,17,17,0.05)", 28)}
        <text x="${x + 46}" y="${y + 226}" class="noteTitle">独立开发复盘系统</text>
      `
    },
    center: {
      tag: "计划",
      heroTitle: ["计划不是清单，", "而是愿景陈列。"],
      heroSub: ["创建一个计划，就像发布一篇长期主题内容。"],
      nav: "plans",
      body: (x, y, w) => `
        ${rect(x + 30, y + 30, w - 60, 72, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 54}" y="${y + 76}" class="bodyTitle">计划名称：做出 AI 创作者陪跑营</text>
        ${rect(x + 30, y + 122, w - 60, 98, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 54}" y="${y + 178}" class="bodySub">最终目标：30 天内完成第一批 10 位付费用户验证。</text>
        ${rect(x + 30, y + 244, w - 60, 76, "url(#darkButton)", 26)}
        <text x="${x + w / 2 - 54}" y="${y + 292}" class="buttonText">创建计划</text>
      `
    },
    right: {
      tag: "Current",
      top: (x, y, w) => `
        ${rect(x, y, w, 118, "rgba(255,255,255,0.9)", 24)}
        <text x="${x + 24}" y="${y + 52}" class="bodyTitle">当前计划</text>
        <text x="${x + 24}" y="${y + 92}" class="bodySub">AI 创作者陪跑营 · 阶段 2</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 176, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 62}" class="statLabel">进行中</text>
        <text x="${x + 26}" y="${y + 126}" class="statBig">2</text>
        ${rect(x, y + 196, w, 176, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 258}" class="statLabel">已归档</text>
        <text x="${x + 26}" y="${y + 322}" class="statBig">1</text>
      `
    }
  },
  {
    slug: "04-plan-detail",
    title: "计划详情",
    badge: "阶段驱动的叙事页",
    posterTitle: ["阶段，是这张路线图的", "章节目录。"],
    posterSubtitle: ["当前阶段只负责说明你走到哪里，", "进度本身仍然由任务权重决定。"],
    left: {
      tag: "Milestones",
      title: ["阶段 2", "验证话术"],
      nav: "plans",
      body: (x, y, w) => `
        ${rect(x + 20, y + 24, w - 40, 54, "rgba(17,17,17,0.05)", 22)}
        <text x="${x + 44}" y="${y + 58}" class="bodySub">阶段 1 已完成 · 阶段 2 当前推进 · 阶段 3 待开始</text>
        ${rect(x + 20, y + 112, w - 40, 24, "rgba(17,17,17,0.06)", 12)}
        ${rect(x + 20, y + 112, (w - 40) * 0.59, 24, "url(#mintButton)", 12)}
        <text x="${x + 20}" y="${y + 186}" class="smallKicker">阶段进度</text>
        <text x="${x + 20}" y="${y + 248}" class="graphBig">59%</text>
      `
    },
    center: {
      tag: "计划详情",
      heroTitle: ["当前阶段内，", "任务才是推进器。"],
      heroSub: ["doing 优先，high 其次，排序值再次之。"],
      nav: "plans",
      body: (x, y, w) => `
        ${rect(x + 24, y + 30, w - 48, 90, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 48}" y="${y + 84}" class="bodyTitle">doing · 私信模版 A/B 测试</text>
        ${rect(x + 24, y + 138, w - 48, 90, "rgba(115,240,203,0.28)", 24)}
        <text x="${x + 48}" y="${y + 192}" class="bodyTitle">todo · 复盘 10 条咨询截图</text>
        ${rect(x + 24, y + 248, w - 48, 72, "url(#darkButton)", 26)}
        <text x="${x + w / 2 - 42}" y="${y + 294}" class="buttonText">新建任务</text>
      `
    },
    right: {
      tag: "Weights",
      top: (x, y, w) => `
        ${rect(x, y, w, 120, "rgba(255,255,255,0.9)", 24)}
        <text x="${x + 24}" y="${y + 52}" class="bodyTitle">总进度</text>
        <text x="${x + 24}" y="${y + 94}" class="bodySub">sum(done weight) / sum(all weight)</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 176, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 60}" class="statLabel">已完成权重</text>
        <text x="${x + 26}" y="${y + 126}" class="statBig">170</text>
        ${rect(x, y + 196, w, 176, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 258}" class="statLabel">总权重</text>
        <text x="${x + 26}" y="${y + 324}" class="statBig">250</text>
      `
    }
  },
  {
    slug: "05-task-detail",
    title: "任务详情",
    badge: "可直接执行的任务卡",
    posterTitle: ["一条任务，", "要像一篇实操笔记。"],
    posterSubtitle: ["小红书用户习惯看清平台、关键词、操作步骤。", "这页就把它做成可立刻开干的说明卡。"],
    left: {
      tag: "Action spec",
      title: ["Reddit", "X"],
      nav: "plans",
      body: (x, y, w) => `
        ${rect(x + 20, y + 22, w - 40, 70, "rgba(17,17,17,0.05)", 22)}
        <text x="${x + 42}" y="${y + 66}" class="bodyTitle">关键词：ai workflow, prompt pain point</text>
        ${rect(x + 20, y + 112, w - 40, 130, "rgba(115,240,203,0.22)", 24)}
        <text x="${x + 42}" y="${y + 174}" class="bodySub">完成标准：整理 10 个高频表达，可直接用于转化文案。</text>
      `
    },
    center: {
      tag: "任务详情",
      heroTitle: ["怎么做，", "就写在这里。"],
      heroSub: ["平台、关键词、完成标准、备注都要够具体。"],
      nav: "plans",
      body: (x, y, w) => `
        ${rect(x + 24, y + 28, w - 48, 96, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 48}" y="${y + 84}" class="bodyTitle">去 Reddit 找 20 条真实提问并整理钩子</text>
        ${rect(x + 24, y + 144, 150, 70, "rgba(17,17,17,0.06)", 24)}
        ${rect(x + 194, y + 144, 150, 70, "url(#mintButton)", 24)}
        ${rect(x + 364, y + 144, 120, 70, "url(#darkButton)", 24)}
        <text x="${x + 76}" y="${y + 188}" class="ghostText">todo</text>
        <text x="${x + 236}" y="${y + 188}" class="smallButtonText">doing</text>
        <text x="${x + 394}" y="${y + 188}" class="buttonText">done</text>
      `
    },
    right: {
      tag: "Remark",
      top: (x, y, w) => `
        ${rect(x, y, w, 120, "rgba(255,255,255,0.9)", 24)}
        <text x="${x + 24}" y="${y + 56}" class="bodyTitle">备注</text>
        <text x="${x + 24}" y="${y + 96}" class="bodySub">只存补充说明，不承载首页主语义。</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 176, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 60}" class="statLabel">优先级</text>
        <text x="${x + 26}" y="${y + 126}" class="statBig">high</text>
        ${rect(x, y + 196, w, 176, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 258}" class="statLabel">权重</text>
        <text x="${x + 26}" y="${y + 324}" class="statBig">20</text>
      `
    }
  },
  {
    slug: "06-review-list",
    title: "复盘列表",
    badge: "像内容流一样的成长记录",
    posterTitle: ["复盘不是附属页，", "而是经验流。"],
    posterSubtitle: ["用接近小红书瀑布流内容卡的感觉承载复盘，", "让成长记录更像值得回看的内容。"],
    left: {
      tag: "Review feed",
      title: ["31 条", "成长记录"],
      nav: "review",
      body: (x, y, w) => `
        ${rect(x + 20, y + 20, w - 40, 140, "url(#pinkCard)", 28)}
        <text x="${x + 46}" y="${y + 72}" class="noteTitle">05/27 · AI 创作者陪跑营</text>
        <text x="${x + 46}" y="${y + 114}" class="noteSub">用户真正会为“被陪跑”付费，不是为更多模板付费。</text>
        ${rect(x + 20, y + 180, w - 40, 140, "rgba(17,17,17,0.05)", 28)}
        <text x="${x + 46}" y="${y + 232}" class="noteTitle">05/26 · 未关联计划</text>
      `
    },
    center: {
      tag: "复盘",
      heroTitle: ["把每天的收获，", "写成自己的方法论。"],
      heroSub: ["支持一天多条，可选关联当前计划。"],
      nav: "review",
      body: (x, y, w) => `
        ${rect(x + 24, y + 34, w - 48, 86, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 48}" y="${y + 86}" class="bodyTitle">今天收获：用户真正会为“陪跑”付费</text>
        ${rect(x + 24, y + 140, w - 48, 86, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 48}" y="${y + 192}" class="bodySub">下一步：把话术从“教你做”改成“陪你出结果”</text>
        ${rect(x + 24, y + 246, w - 48, 72, "url(#darkButton)", 26)}
        <text x="${x + w / 2 - 40}" y="${y + 292}" class="buttonText">新建复盘</text>
      `
    },
    right: {
      tag: "History",
      top: (x, y, w) => `
        ${rect(x, y, w, 120, "rgba(255,255,255,0.9)", 24)}
        <text x="${x + 24}" y="${y + 52}" class="bodyTitle">历史排序</text>
        <text x="${x + 24}" y="${y + 92}" class="bodySub">按 created_at 倒序展示</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 176, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 60}" class="statLabel">今日新增</text>
        <text x="${x + 26}" y="${y + 126}" class="statBig">2</text>
        ${rect(x, y + 196, w, 176, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 258}" class="statLabel">累计复盘</text>
        <text x="${x + 26}" y="${y + 324}" class="statBig">31</text>
      `
    }
  },
  {
    slug: "07-review-editor",
    title: "复盘编辑",
    badge: "写作感更强的编辑页",
    posterTitle: ["写复盘时，", "像在编辑一篇高质量笔记。"],
    posterSubtitle: ["把 Apple 的克制输入体验，", "和小红书式内容表达欲结合起来。"],
    left: {
      tag: "Prompts",
      title: ["收获", "问题"],
      nav: "review",
      body: (x, y, w) => `
        ${rect(x + 20, y + 20, w - 40, 88, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 42}" y="${y + 72}" class="bodySub">今日收获</text>
        ${rect(x + 20, y + 128, w - 40, 88, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 42}" y="${y + 180}" class="bodySub">遇到的问题</text>
        ${rect(x + 20, y + 236, w - 40, 88, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 42}" y="${y + 288}" class="bodySub">新想法</text>
      `
    },
    center: {
      tag: "写复盘",
      heroTitle: ["今天学到了什么，", "明天准备怎么继续。"],
      heroSub: ["同一天可以创建多条。复盘不参与进度计算。"],
      nav: "review",
      body: (x, y, w) => `
        ${rect(x + 24, y + 26, w - 48, 82, "rgba(17,17,17,0.05)", 24)}
        ${rect(x + 24, y + 122, w - 48, 82, "rgba(17,17,17,0.05)", 24)}
        ${rect(x + 24, y + 218, w - 48, 82, "rgba(17,17,17,0.05)", 24)}
        ${rect(x + 24, y + 314, w - 48, 82, "rgba(17,17,17,0.05)", 24)}
        ${rect(x + 24, y + 428, w - 48, 76, "url(#darkButton)", 26)}
        <text x="${x + w / 2 - 40}" y="${y + 476}" class="buttonText">保存复盘</text>
      `
    },
    right: {
      tag: "关联计划",
      top: (x, y, w) => `
        ${rect(x, y, w, 120, "rgba(255,255,255,0.9)", 24)}
        <text x="${x + 24}" y="${y + 52}" class="bodyTitle">当前计划</text>
        <text x="${x + 24}" y="${y + 92}" class="bodySub">AI 创作者陪跑营</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 176, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 60}" class="statLabel">写作完成度</text>
        <text x="${x + 26}" y="${y + 126}" class="statBig">80%</text>
        ${rect(x, y + 196, w, 176, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 258}" class="statLabel">下一步清晰度</text>
        <text x="${x + 26}" y="${y + 324}" class="statBig">High</text>
      `
    }
  },
  {
    slug: "08-profile",
    title: "我的",
    badge: "个人成长仪表板",
    posterTitle: ["回头看时，", "也要有产品级的仪式感。"],
    posterSubtitle: ["我的页像 Apple 的个人概览页，", "但数据呈现更像小红书作者主页。"],
    left: {
      tag: "Profile stats",
      title: ["47", "已完成任务"],
      nav: "me",
      body: (x, y, w) => `
        <circle cx="${x + 92}" cy="${y + 100}" r="52" fill="url(#avatarGlow)"/>
        <text x="${x + 72}" y="${y + 114}" class="avatarText">VC</text>
        <text x="${x + 26}" y="${y + 212}" class="smallKicker">当前目标数</text>
        <text x="${x + 26}" y="${y + 276}" class="graphBig">2</text>
        <text x="${x + 26}" y="${y + 356}" class="smallKicker">累计复盘数</text>
        <text x="${x + 26}" y="${y + 420}" class="graphBig">31</text>
      `
    },
    center: {
      tag: "我的",
      heroTitle: ["你的成长密度，", "值得被好好展示。"],
      heroSub: ["统计口径只算未删除内容。", "设置、缓存清理、退出登录都收在这页。"],
      nav: "me",
      body: (x, y, w) => `
        ${rect(x + 24, y + 28, w - 48, 76, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 48}" y="${y + 76}" class="bodyTitle">设置</text>
        ${rect(x + 24, y + 120, w - 48, 76, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 48}" y="${y + 168}" class="bodyTitle">清理缓存</text>
        ${rect(x + 24, y + 212, w - 48, 76, "rgba(17,17,17,0.05)", 24)}
        <text x="${x + 48}" y="${y + 260}" class="bodyTitle">关于成长薄</text>
        ${rect(x + 24, y + 326, w - 48, 76, "url(#darkButton)", 26)}
        <text x="${x + w / 2 - 40}" y="${y + 374}" class="buttonText">退出登录</text>
      `
    },
    right: {
      tag: "Overview",
      top: (x, y, w) => `
        ${rect(x, y, w, 120, "rgba(255,255,255,0.9)", 24)}
        <text x="${x + 24}" y="${y + 52}" class="bodyTitle">当前目标概览</text>
        <text x="${x + 24}" y="${y + 92}" class="bodySub">AI 创作者陪跑营 · 总进度 68%</text>
      `,
      cards: (x, y, w) => `
        ${rect(x, y, w, 176, "url(#mintCard)", 24)}
        <text x="${x + 26}" y="${y + 60}" class="statLabel">当前目标</text>
        <text x="${x + 26}" y="${y + 126}" class="statBig">2</text>
        ${rect(x, y + 196, w, 176, "url(#blueCard)", 24)}
        <text x="${x + 26}" y="${y + 258}" class="statLabel">累计复盘</text>
        <text x="${x + 26}" y="${y + 324}" class="statBig">31</text>
      `
    }
  }
];

function poster(page) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="1536" y2="2048" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F5F5F7"/>
      <stop offset="0.5" stop-color="#EAEFF5"/>
      <stop offset="1" stop-color="#F7F7FA"/>
    </linearGradient>
    <linearGradient id="phoneShell" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#eef1f7"/>
    </linearGradient>
    <linearGradient id="screenGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.52" stop-color="#F7F9FD"/>
      <stop offset="1" stop-color="#EEF3FA"/>
    </linearGradient>
    <linearGradient id="heroMesh" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.28" stop-color="#FFD4DC"/>
      <stop offset="0.56" stop-color="#E2E9FF"/>
      <stop offset="0.82" stop-color="#D0FFF0"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="pinkCard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF3B5F"/>
      <stop offset="1" stop-color="#FF8E74"/>
    </linearGradient>
    <linearGradient id="mintCard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6AF0D0"/>
      <stop offset="1" stop-color="#33C49E"/>
    </linearGradient>
    <linearGradient id="blueCard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7E98FF"/>
      <stop offset="1" stop-color="#5B6FFF"/>
    </linearGradient>
    <linearGradient id="mintButton" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7BF2D3"/>
      <stop offset="1" stop-color="#34C89A"/>
    </linearGradient>
    <linearGradient id="darkButton" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1B1B1D"/>
      <stop offset="1" stop-color="#3D4350"/>
    </linearGradient>
    <linearGradient id="orbPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFD8E2"/>
      <stop offset="1" stop-color="#FF8CA1"/>
    </linearGradient>
    <linearGradient id="orbBlue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#DCE5FF"/>
      <stop offset="1" stop-color="#93A8FF"/>
    </linearGradient>
    <linearGradient id="orbMint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#D8FFF2"/>
      <stop offset="1" stop-color="#84F1D0"/>
    </linearGradient>
    <linearGradient id="orbGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF4C8"/>
      <stop offset="1" stop-color="#F4CD74"/>
    </linearGradient>
    <linearGradient id="activeBubble" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF3B5F"/>
      <stop offset="1" stop-color="#7E98FF"/>
    </linearGradient>
    <linearGradient id="avatarGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.5" stop-color="#d6fff2"/>
      <stop offset="1" stop-color="#dbe3ff"/>
    </linearGradient>
    <linearGradient id="glassPanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.78)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0.34)"/>
    </linearGradient>
    <linearGradient id="glassBlue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(124,151,255,0.3)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0.18)"/>
    </linearGradient>
    <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(98,229,192,0.36)"/>
      <stop offset="1" stop-color="rgba(98,229,192,0.02)"/>
    </linearGradient>
    <filter id="phoneShadow" x="-20%" y="-20%" width="150%" height="160%">
      <feDropShadow dx="0" dy="30" stdDeviation="34" flood-color="${palette.shadow}"/>
    </filter>
    <filter id="glassShadow" x="-20%" y="-20%" width="150%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="rgba(255,255,255,0.12)"/>
    </filter>
  </defs>

  ${posterBackdrop(page.posterTitle, page.posterSubtitle, page.badge)}

  ${phone(44, 618, 454, 1236, leftScreen(page))}
  ${phone(494, 174, 548, 1680, centerScreen(page))}
  ${phone(1048, 432, 444, 1422, rightScreen(page))}

  <style>
    .topBadge { font: 700 20px "SF Pro Display","PingFang SC",sans-serif; fill: rgba(17,17,17,0.5); }
    .topMetric { font: 700 36px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
    .floatStatLabel { font: 600 18px "SF Pro Display","PingFang SC",sans-serif; fill: rgba(255,255,255,0.76); }
    .floatStatBig { font: 700 74px "SF Pro Display","PingFang SC",sans-serif; fill: #fff; }
    .posterMark { font: 700 20px "SF Pro Text","PingFang SC",sans-serif; letter-spacing: 4px; fill: rgba(17,17,17,0.34); }
    .posterTitle { font: 700 86px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
    .posterSub { font: 500 34px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.64); }
    .statusDots { font: 700 22px "Helvetica Neue","PingFang SC",sans-serif; fill: rgba(17,17,17,0.9); }
    .statusTime { font: 700 18px "Helvetica Neue","PingFang SC",sans-serif; fill: rgba(17,17,17,0.9); }
    .statusBattery { font: 700 18px "Helvetica Neue","PingFang SC",sans-serif; fill: rgba(17,17,17,0.9); }
    .screenTag { font: 600 20px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.46); }
    .screenTitle { font: 700 58px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
    .centerTag { font: 700 22px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.52); }
    .centerHeroTitle { font: 700 78px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
    .centerHeroSub { font: 500 30px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.62); }
    .rightMonth { font: 600 22px "SF Pro Text","PingFang SC",sans-serif; fill: #5B6FFF; }
    .noteTitle { font: 700 28px "SF Pro Display","PingFang SC",sans-serif; fill: #fff; }
    .noteSub { font: 500 22px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(255,255,255,0.9); }
    .bodyTitle { font: 700 26px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
    .bodySub { font: 500 22px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.58); }
    .buttonText { font: 700 26px "SF Pro Display","PingFang SC",sans-serif; fill: #fff; }
    .smallButtonText { font: 700 24px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
    .ghostText { font: 600 24px "SF Pro Display","PingFang SC",sans-serif; fill: rgba(17,17,17,0.62); }
    .smallKicker { font: 600 20px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.48); }
    .graphBig { font: 700 62px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
    .tinyPill { font: 700 20px "SF Pro Text","PingFang SC",sans-serif; fill: #111; }
    .calendarRow { font: 600 20px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.48); }
    .statLabel { font: 600 22px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(255,255,255,0.88); }
    .statBig { font: 700 64px "SF Pro Display","PingFang SC",sans-serif; fill: #fff; }
    .navIcon { font: 700 24px "Helvetica Neue","PingFang SC",sans-serif; fill: rgba(17,17,17,0.36); }
    .navActiveIcon { font: 700 24px "Helvetica Neue","PingFang SC",sans-serif; fill: #fff; }
    .navLabel { font: 600 16px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.4); }
    .navActiveLabel { font: 700 16px "SF Pro Text","PingFang SC",sans-serif; fill: rgba(17,17,17,0.88); }
    .avatarText { font: 700 34px "SF Pro Display","PingFang SC",sans-serif; fill: #111; }
  </style>
</svg>`;
}

function indexHtml(items) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GoalFlow Apple × 小红书 UI</title>
    <style>
      :root {
        --bg: #f5f5f7;
        --text: #111;
        --sub: rgba(17,17,17,0.62);
        --line: rgba(17,17,17,0.08);
        --card: rgba(255,255,255,0.82);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SF Pro Display","PingFang SC","Noto Sans SC",sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(255,120,150,0.18), transparent 24%),
          radial-gradient(circle at top right, rgba(124,151,255,0.16), transparent 26%),
          linear-gradient(180deg, #f8f8fa 0%, #eef2f7 46%, #f7f8fb 100%);
      }
      main {
        max-width: 1440px;
        margin: 0 auto;
        padding: 56px 24px 88px;
      }
      .tag {
        display: inline-block;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.78);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
      }
      h1 {
        margin: 16px 0 10px;
        font-size: clamp(34px, 5vw, 60px);
        line-height: 1.04;
      }
      .intro {
        max-width: 820px;
        margin: 0 0 34px;
        color: var(--sub);
        font-size: 16px;
        line-height: 1.8;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 22px;
      }
      .card {
        padding: 18px;
        border-radius: 30px;
        border: 1px solid var(--line);
        background: var(--card);
        backdrop-filter: blur(16px);
        box-shadow: 0 20px 40px rgba(15,23,42,0.08);
      }
      .thumb {
        overflow: hidden;
        border-radius: 24px;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
      }
      h2 {
        margin: 16px 0 8px;
        font-size: 26px;
      }
      p {
        margin: 0;
        color: var(--sub);
        font-size: 14px;
        line-height: 1.7;
      }
      a {
        display: inline-block;
        margin-top: 14px;
        color: #111;
        text-decoration: none;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <span class="tag">Apple-style Tech × 小红书内容感</span>
      <h1>GoalFlow 小程序 3:4 全页 UI 设计</h1>
      <p class="intro">这套设计把 Apple 官网常见的产品陈列感、玻璃拟态、留白和高密度秩序，融合到更适合小红书语境的内容卡片、标签、灵感流和“值得收藏的笔记感”里，覆盖小程序用户端全部核心页面。</p>
      <section class="grid">
        ${items
          .map(
            (item) => `
              <article class="card">
                <div class="thumb"><img src="./${item.filename}" alt="${item.title}" /></div>
                <h2>${item.title}</h2>
                <p>${item.description}</p>
                <a href="./${item.filename}" target="_blank" rel="noreferrer">查看原图</a>
              </article>`
          )
          .join("")}
      </section>
    </main>
  </body>
</html>`;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const items = [];

  for (const page of pages) {
    const filename = `${page.slug}.svg`;
    await fs.writeFile(path.join(outputDir, filename), poster(page), "utf8");
    items.push({
      filename,
      title: page.title,
      description: "3:4 竖版高保真页面海报，适合产品提案、视觉定调与小程序界面评审。"
    });
  }

  await fs.writeFile(path.join(outputDir, "index.html"), indexHtml(items), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
