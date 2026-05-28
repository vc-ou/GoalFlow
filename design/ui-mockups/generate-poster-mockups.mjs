import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("design/ui-mockups/posters");
const size = { width: 1536, height: 2048 };

const palette = {
  ink: "#162225",
  white: "#ffffff",
  mist: "#f5f7fb",
  green: "#44d3a2",
  greenDeep: "#1da57a",
  teal: "#53d7cf",
  blue: "#6e89ff",
  purple: "#7b6cff",
  glass: "rgba(79, 217, 201, 0.18)",
  glassBlue: "rgba(92, 110, 255, 0.16)",
  line: "rgba(255, 255, 255, 0.42)",
  darkOverlay: "rgba(8, 14, 24, 0.44)"
};

function escapeText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function tspanLines(lines, x, y, lineHeight, className) {
  return `<text x="${x}" y="${y}" class="${className}">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeText(line)}</tspan>`)
    .join("")}</text>`;
}

function card(x, y, width, height, fill, stroke = "rgba(255,255,255,0.28)", radius = 36, extra = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
}

function phoneShell(x, y, width, height, innerMarkup) {
  const screenX = x + 28;
  const screenY = y + 76;
  const screenW = width - 56;
  const screenH = height - 128;
  return `
    <g filter="url(#phoneShadow)">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="76" fill="#ffffff"/>
      <rect x="${x + width / 2 - 86}" y="${y + 22}" width="172" height="16" rx="8" fill="#EFF1F6"/>
      <text x="${x + 54}" y="${y + 64}" class="status">●●●●●</text>
      <text x="${x + width / 2 - 34}" y="${y + 64}" class="statusCenter">上午 10:30</text>
      <text x="${x + width - 124}" y="${y + 64}" class="status">100%</text>
      <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="44" fill="#F5F7FB"/>
      ${innerMarkup(screenX, screenY, screenW, screenH)}
      <rect x="${x + width / 2 - 120}" y="${y + height - 38}" width="240" height="8" rx="4" fill="#EDF1F5" opacity="0.8"/>
    </g>`;
}

function heroBackdrop(title, subtitle) {
  return `
    <rect width="${size.width}" height="${size.height}" fill="url(#factoryGradient)"/>
    <rect width="${size.width}" height="${size.height}" fill="url(#steelBeams)" opacity="0.48"/>
    <rect width="${size.width}" height="${size.height}" fill="${palette.darkOverlay}"/>
    <circle cx="178" cy="812" r="34" fill="${palette.green}" opacity="0.65"/>
    <circle cx="1480" cy="468" r="12" fill="${palette.teal}" opacity="0.72"/>
    <circle cx="1368" cy="1828" r="18" fill="${palette.purple}" opacity="0.66"/>
    <path d="M56 1214 C 224 1148, 352 1324, 536 1242 S 872 1054, 1030 1174 S 1328 1392, 1494 1290" stroke="rgba(79,217,201,0.38)" stroke-width="4" fill="none"/>
    <path d="M1216 206 C 1294 152, 1390 162, 1470 230 S 1532 420, 1476 494" stroke="rgba(123,108,255,0.42)" stroke-width="3" fill="none"/>

    ${card(178, 286, 346, 200, palette.glass, "rgba(79,217,201,0.22)", 24)}
    <text x="220" y="354" class="glassTitle">待推进数据</text>
    <text x="220" y="438" class="glassMetric">68%</text>
    <text x="420" y="438" class="glassMetric">17/29</text>
    <text x="220" y="470" class="glassLabel">当前总进度</text>
    <text x="420" y="470" class="glassLabel">已完成任务</text>

    ${card(1164, 72, 292, 326, palette.glassBlue, "rgba(167,177,255,0.22)", 26)}
    <path d="M1196 316 C 1242 240, 1290 214, 1348 258 S 1450 398, 1518 286" stroke="rgba(255,255,255,0.52)" stroke-width="5" fill="none"/>
    <path d="M1196 350 L 1518 350" stroke="rgba(255,255,255,0.16)" stroke-width="2"/>
    <path d="M1386 106 L 1386 392" stroke="rgba(255,255,255,0.16)" stroke-width="2" stroke-dasharray="12 14"/>
    <text x="1458" y="112" class="gridLabel">100%</text>
    <text x="1460" y="204" class="gridLabel">80%</text>
    <text x="1460" y="294" class="gridLabel">60%</text>

    <text x="120" y="1692" class="posterBrand">GOALFLOW / GROWTH POSTER</text>
    ${tspanLines([title], 120, 1762, 52, "posterTitle")}
    ${tspanLines(subtitle, 120, 1838, 34, "posterSubtitle")}
  `;
}

function leftPhoneInner(page) {
  return (x, y, w, h) => `
    <text x="${x + 42}" y="${y + 70}" class="screenKicker">${escapeText(page.left.kicker)}</text>
    ${tspanLines(page.left.title, x + 42, y + 126, 48, "screenTitle")}
    <rect x="${x + 42}" y="${y + 176}" width="${w - 84}" height="${h - 286}" rx="28" fill="#ffffff"/>
    ${page.left.content(x + 42, y + 176, w - 84, h - 286)}
    <g opacity="0.86">
      <circle cx="${x + 74}" cy="${y + h - 74}" r="22" fill="#EEF3F7"/>
      <circle cx="${x + w / 2}" cy="${y + h - 74}" r="22" fill="#EEF3F7"/>
      <circle cx="${x + w - 74}" cy="${y + h - 74}" r="22" fill="#EEF3F7"/>
      <text x="${x + 62}" y="${y + h - 68}" class="navIcon">⌂</text>
      <text x="${x + w / 2 - 8}" y="${y + h - 68}" class="navIcon">◫</text>
      <text x="${x + w - 84}" y="${y + h - 68}" class="navIcon">♥</text>
    </g>
  `;
}

function centerPhoneInner(page) {
  return (x, y, w, h) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.6}" fill="url(#blurPhoto)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.6}" fill="rgba(255,255,255,0.1)"/>
    <rect x="${x + 28}" y="${y + h * 0.44}" width="${w - 56}" height="${h * 0.34}" rx="28" fill="rgba(255,255,255,0.94)"/>
    <text x="${x + 42}" y="${y + 76}" class="screenKicker">${escapeText(page.center.kicker)}</text>
    ${tspanLines(page.center.quote, x + 42, y + 156, 62, "centerQuote")}
    ${tspanLines(page.center.sub, x + 42, y + 306, 28, "centerSub")}
    ${page.center.content(x + 28, y + h * 0.44, w - 56, h * 0.34)}
    <g opacity="0.88">
      <circle cx="${x + 78}" cy="${y + h - 70}" r="22" fill="#EEF3F7"/>
      <circle cx="${x + w / 2}" cy="${y + h - 70}" r="22" fill="#6E89FF"/>
      <circle cx="${x + w - 78}" cy="${y + h - 70}" r="22" fill="#EEF3F7"/>
      <text x="${x + 67}" y="${y + h - 64}" class="navIcon">⌂</text>
      <text x="${x + w / 2 - 8}" y="${y + h - 64}" class="navIconActive">◆</text>
      <text x="${x + w - 88}" y="${y + h - 64}" class="navIcon">☁</text>
    </g>
  `;
}

function rightPhoneInner(page) {
  return (x, y, w, h) => `
    <text x="${x + 40}" y="${y + 66}" class="monthLabel">${escapeText(page.right.month)}</text>
    <text x="${x + w - 60}" y="${y + 66}" class="monthIcon">◔</text>
    ${page.right.calendar(x + 40, y + 94, w - 80)}
    ${page.right.cards(x + 32, y + 220, w - 64)}
  `;
}

const mobilePages = [
  {
    slug: "home-poster",
    title: "首页海报版",
    posterTitle: "把最重要的目标，\n放到眼前中央。",
    posterSubtitle: ["当前目标、下一步行动、明日代办", "从焦虑式待办切回低压但高推进感。"],
    left: {
      kicker: "HOME / 当前目标",
      title: ["68%", "成长推进"],
      content: (x, y, w, h) => `
        <path d="M ${x + 24} ${y + 184} C ${x + 98} ${y + 66}, ${x + 188} ${y + 124}, ${x + 262} ${y + 42} S ${x + 418} ${y + 164}, ${x + 474} ${y + 88}" stroke="#57DEB0" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M ${x + 24} ${y + 184} C ${x + 98} ${y + 66}, ${x + 188} ${y + 124}, ${x + 262} ${y + 42} S ${x + 418} ${y + 164}, ${x + 474} ${y + 88} L ${x + 474} ${y + 250} L ${x + 24} ${y + 250} Z" fill="url(#chartFade)"/>
        <path d="M ${x + 254} ${y + 18} L ${x + 254} ${y + 248}" stroke="#77D8CB" stroke-width="3" stroke-dasharray="12 10"/>
        <rect x="${x + 214}" y="${y + 2}" width="112" height="42" rx="20" fill="#5BE0AF"/>
        <text x="${x + 240}" y="${y + 30}" class="miniTag">阶段 2 / 68%</text>
        <text x="${x + 18}" y="${y + 318}" class="miniMetric">平均推进率</text>
        <text x="${x + 18}" y="${y + 362}" class="bigInline">65%</text>
        <rect x="${x + 18}" y="${y + 406}" width="${w - 36}" height="26" rx="13" fill="#EEF3F7"/>
        <rect x="${x + 18}" y="${y + 406}" width="${(w - 36) * 0.65}" height="26" rx="13" fill="#4AD3A3"/>
      `
    },
    center: {
      kicker: "现在推进",
      quote: ["“今天不用做很多，", "但要做对下一步。”"],
      sub: ["系统只回答三件事：", "我最重要的目标、当前阶段、下一步行动。"],
      content: (x, y, w, h) => `
        <g transform="translate(${x + 40} ${y + 48})">
          <circle cx="28" cy="28" r="24" fill="#ECFBF4" stroke="#7BDFC4"/>
          <text x="16" y="38" class="iconGlyph">✓</text>
          <text x="114" y="28" class="iconTitle">实时任务</text>
          <text x="90" y="56" class="iconSub">去 Reddit 找 20 条真实表达</text>
        </g>
        <g transform="translate(${x + 40} ${y + 128})">
          <rect width="128" height="128" rx="22" fill="#52D9B0"/>
          <text x="42" y="78" class="tileGlyph">✓</text>
          <text x="26" y="102" class="tileLabel">下一步行动</text>
        </g>
        <g transform="translate(${x + 202} ${y + 128})">
          <rect width="128" height="128" rx="22" fill="#F4A64E"/>
          <text x="44" y="78" class="tileGlyph">◔</text>
          <text x="34" y="102" class="tileLabel">正在推进中</text>
        </g>
        <g transform="translate(${x + 364} ${y + 128})">
          <rect width="128" height="128" rx="22" fill="#6C63FF"/>
          <text x="46" y="78" class="tileGlyph">?</text>
          <text x="38" y="102" class="tileLabel">卡点待处理</text>
        </g>
      `
    },
    right: {
      month: "五月",
      calendar: (x, y, w) => `
        <text x="${x}" y="${y}" class="calendarDays">一</text>
        <text x="${x + 78}" y="${y}" class="calendarDays">二</text>
        <text x="${x + 156}" y="${y}" class="calendarDays">三</text>
        <text x="${x + 234}" y="${y}" class="calendarDays">四</text>
        <text x="${x + 312}" y="${y}" class="calendarDays">五</text>
        <text x="${x + 390}" y="${y}" class="calendarDays">六</text>
        <circle cx="${x + 236}" cy="${y + 66}" r="22" fill="#6E89FF"/>
        <text x="${x + 226}" y="${y + 74}" class="calendarToday">20</text>
      `,
      cards: (x, y, w) => `
        <text x="${x}" y="${y - 24}" class="panelLabel">昨天已完成任务 · 统计</text>
        <rect x="${x}" y="${y}" width="${w}" height="190" rx="18" fill="#40D49A"/>
        <text x="${x + 30}" y="${y + 56}" class="rightCardTitle">AI 创作陪跑营</text>
        <text x="${x + 30}" y="${y + 118}" class="rightCardMetric">20</text>
        <text x="${x + 234}" y="${y + 118}" class="rightCardMetric">200,000</text>
        <text x="${x + w - 112}" y="${y + 118}" class="rightCardMetric">98%</text>
        <rect x="${x}" y="${y + 214}" width="${w}" height="190" rx="18" fill="#6386F7"/>
        <text x="${x + 30}" y="${y + 270}" class="rightCardTitle">明日代办灵感池</text>
        <text x="${x + 30}" y="${y + 332}" class="rightCardMetric">10</text>
        <text x="${x + 234}" y="${y + 332}" class="rightCardMetric">100,000</text>
        <text x="${x + w - 112}" y="${y + 332}" class="rightCardMetric">100</text>
      `
    }
  },
  {
    slug: "plans-poster",
    title: "计划列表海报版",
    posterTitle: "不是堆待办，\n而是建立路线。",
    posterSubtitle: ["计划由目标、阶段、任务构成。", "每次推进都要能看见离结果还差多远。"],
    left: {
      kicker: "PLANS / 路线库",
      title: ["2 个", "进行中计划"],
      content: (x, y, w, h) => `
        <rect x="${x + 22}" y="${y + 24}" width="${w - 44}" height="98" rx="24" fill="#F4F6FA"/>
        <text x="${x + 46}" y="${y + 68}" class="listCardTitle">AI 创作者陪跑营</text>
        <text x="${x + 46}" y="${y + 102}" class="listCardSub">当前计划 · 阶段 2 / 总进度 68%</text>
        <rect x="${x + 22}" y="${y + 146}" width="${w - 44}" height="98" rx="24" fill="#EEF5FF"/>
        <text x="${x + 46}" y="${y + 190}" class="listCardTitle">独立开发复盘系统</text>
        <text x="${x + 46}" y="${y + 224}" class="listCardSub">候选计划 · 阶段 1 / 总进度 24%</text>
        <rect x="${x + 22}" y="${y + 284}" width="${w - 44}" height="26" rx="13" fill="#EEF3F7"/>
        <rect x="${x + 22}" y="${y + 284}" width="${(w - 44) * 0.68}" height="26" rx="13" fill="#4AD3A3"/>
        <text x="${x + 24}" y="${y + 364}" class="miniMetric">当前计划命中率</text>
        <text x="${x + 24}" y="${y + 408}" class="bigInline">92%</text>
      `
    },
    center: {
      kicker: "行动路线",
      quote: ["“建立一个计划，", "就是给未来的自己铺路。”"],
      sub: ["先建计划，再把路线", "沉淀成阶段和任务。"],
      content: (x, y, w, h) => `
        <rect x="${x + 36}" y="${y + 44}" width="${w - 72}" height="62" rx="20" fill="#F5F7FB"/>
        <text x="${x + 64}" y="${y + 84}" class="formLabel">计划名称：做出 AI 创作者陪跑营</text>
        <rect x="${x + 36}" y="${y + 124}" width="${w - 72}" height="94" rx="20" fill="#F5F7FB"/>
        <text x="${x + 64}" y="${y + 174}" class="formLabel">最终目标：30 天内验证需求，完成第一批 10 位付费用户。</text>
        <rect x="${x + 36}" y="${y + 240}" width="${w - 72}" height="74" rx="22" fill="#4AD3A3"/>
        <text x="${x + w / 2 - 74}" y="${y + 286}" class="formButton">创建计划</text>
      `
    },
    right: {
      month: "阶段",
      calendar: (x, y) => `
        <text x="${x}" y="${y}" class="calendarDays">1. 定位</text>
        <text x="${x + 116}" y="${y}" class="calendarDays">2. 验证</text>
        <text x="${x + 232}" y="${y}" class="calendarDays">3. 转化</text>
        <text x="${x + 348}" y="${y}" class="calendarDays">4. 交付</text>
        <rect x="${x + 108}" y="${y + 26}" width="94" height="34" rx="17" fill="#6E89FF"/>
        <text x="${x + 132}" y="${y + 49}" class="calendarToday">当前推进</text>
      `,
      cards: (x, y, w) => `
        <text x="${x}" y="${y - 24}" class="panelLabel">计划卡片</text>
        <rect x="${x}" y="${y}" width="${w}" height="190" rx="18" fill="#40D49A"/>
        <text x="${x + 30}" y="${y + 56}" class="rightCardTitle">计划 A</text>
        <text x="${x + 30}" y="${y + 118}" class="rightCardMetric">4</text>
        <text x="${x + 234}" y="${y + 118}" class="rightCardMetric">24</text>
        <text x="${x + w - 112}" y="${y + 118}" class="rightCardMetric">68%</text>
        <rect x="${x}" y="${y + 214}" width="${w}" height="190" rx="18" fill="#6E89FF"/>
        <text x="${x + 30}" y="${y + 270}" class="rightCardTitle">计划 B</text>
        <text x="${x + 30}" y="${y + 332}" class="rightCardMetric">3</text>
        <text x="${x + 234}" y="${y + 332}" class="rightCardMetric">11</text>
        <text x="${x + w - 112}" y="${y + 332}" class="rightCardMetric">24%</text>
      `
    }
  },
  {
    slug: "plan-detail-poster",
    title: "计划详情海报版",
    posterTitle: "阶段不是装饰，\n是推进结构。",
    posterSubtitle: ["当前阶段 = 第一个仍有未完成任务的阶段。", "总进度只由任务权重变化驱动。"],
    left: {
      kicker: "DETAIL / 进度",
      title: ["阶段 2", "59%"],
      content: (x, y, w, h) => `
        <rect x="${x + 18}" y="${y + 30}" width="${w - 36}" height="22" rx="11" fill="#EEF3F7"/>
        <rect x="${x + 18}" y="${y + 30}" width="${(w - 36) * 0.59}" height="22" rx="11" fill="#57DEB0"/>
        <text x="${x + 18}" y="${y + 108}" class="miniMetric">阶段内任务权重</text>
        <text x="${x + 18}" y="${y + 152}" class="bigInline">95 / 160</text>
        <path d="M ${x + 18} ${y + 258} C ${x + 106} ${y + 190}, ${x + 174} ${y + 286}, ${x + 260} ${y + 202} S ${x + 384} ${y + 168}, ${x + 468} ${y + 128}" stroke="#57DEB0" stroke-width="10" fill="none"/>
      `
    },
    center: {
      kicker: "计划详情",
      quote: ["“先看当前阶段，", "再决定今天做什么。”"],
      sub: ["阶段只负责结构组织和顺序，", "不单独参与总进度加权。"],
      content: (x, y, w, h) => `
        <rect x="${x + 28}" y="${y + 34}" width="${w - 56}" height="54" rx="18" fill="#F5F7FB"/>
        <text x="${x + 54}" y="${y + 68}" class="formLabel">阶段 1 已完成 · 阶段 2 当前推进 · 阶段 3 待开始</text>
        <rect x="${x + 28}" y="${y + 114}" width="${w - 56}" height="84" rx="20" fill="#ECFBF4"/>
        <text x="${x + 52}" y="${y + 164}" class="formLabel">doing · 私信模版 A/B 测试</text>
        <rect x="${x + 28}" y="${y + 216}" width="${w - 56}" height="84" rx="20" fill="#FFF6EA"/>
        <text x="${x + 52}" y="${y + 266}" class="formLabel">todo · 复盘 10 条咨询截图</text>
      `
    },
    right: {
      month: "任务",
      calendar: (x, y) => `
        <text x="${x}" y="${y}" class="calendarDays">todo</text>
        <text x="${x + 126}" y="${y}" class="calendarDays">doing</text>
        <text x="${x + 252}" y="${y}" class="calendarDays">done</text>
        <rect x="${x + 120}" y="${y + 24}" width="88" height="34" rx="17" fill="#40D49A"/>
        <text x="${x + 146}" y="${y + 48}" class="calendarToday">优先</text>
      `,
      cards: (x, y, w) => `
        <text x="${x}" y="${y - 24}" class="panelLabel">快速状态变更</text>
        <rect x="${x}" y="${y}" width="${w}" height="160" rx="18" fill="#40D49A"/>
        <text x="${x + 30}" y="${y + 58}" class="rightCardTitle">todo → doing</text>
        <text x="${x + 30}" y="${y + 112}" class="rightCardMetric">1</text>
        <rect x="${x}" y="${y + 186}" width="${w}" height="160" rx="18" fill="#6386F7"/>
        <text x="${x + 30}" y="${y + 244}" class="rightCardTitle">doing → done</text>
        <text x="${x + 30}" y="${y + 298}" class="rightCardMetric">2</text>
      `
    }
  },
  {
    slug: "task-detail-poster",
    title: "任务详情海报版",
    posterTitle: "一条任务，\n要能直接开做。",
    posterSubtitle: ["平台、关键词、完成标准都要明确。", "首页只展示主语义，备注留在详情里。"],
    left: {
      kicker: "TASK / 操作手册",
      title: ["high", "权重 20"],
      content: (x, y, w) => `
        <rect x="${x + 22}" y="${y + 34}" width="${w - 44}" height="52" rx="18" fill="#EEF3F7"/>
        <text x="${x + 44}" y="${y + 68}" class="formLabel">平台：Reddit / X</text>
        <rect x="${x + 22}" y="${y + 108}" width="${w - 44}" height="74" rx="18" fill="#EEF3F7"/>
        <text x="${x + 44}" y="${y + 152}" class="formLabel">关键词：ai workflow, prompt pain point</text>
        <rect x="${x + 22}" y="${y + 206}" width="${w - 44}" height="124" rx="18" fill="#ECFBF4"/>
        <text x="${x + 44}" y="${y + 256}" class="formLabel">完成标准：整理 10 个高频表达，可直接用于转化文案。</text>
      `
    },
    center: {
      kicker: "任务详情",
      quote: ["“怎么做、去哪里做、", "做到什么才算完成。”"],
      sub: ["任务不是提醒句，而是可执行动作。"],
      content: (x, y, w, h) => `
        <rect x="${x + 36}" y="${y + 42}" width="${w - 72}" height="86" rx="20" fill="#F5F7FB"/>
        <text x="${x + 62}" y="${y + 94}" class="formLabel">去 Reddit 找 20 条真实提问并整理钩子</text>
        <rect x="${x + 36}" y="${y + 154}" width="126" height="54" rx="20" fill="#EEF1E9"/>
        <rect x="${x + 182}" y="${y + 154}" width="126" height="54" rx="20" fill="#ECFBF4"/>
        <rect x="${x + 328}" y="${y + 154}" width="126" height="54" rx="20" fill="#203229"/>
        <text x="${x + 84}" y="${y + 188}" class="stateText">todo</text>
        <text x="${x + 224}" y="${y + 188}" class="stateText">doing</text>
        <text x="${x + 372}" y="${y + 188}" class="stateTextActive">done</text>
      `
    },
    right: {
      month: "备注",
      calendar: (x, y) => `
        <text x="${x}" y="${y}" class="calendarDays">用户原话优先</text>
      `,
      cards: (x, y, w) => `
        <rect x="${x}" y="${y}" width="${w}" height="180" rx="18" fill="#40D49A"/>
        <text x="${x + 30}" y="${y + 58}" class="rightCardTitle">状态回退允许</text>
        <text x="${x + 30}" y="${y + 112}" class="rightCardMetric">6</text>
        <rect x="${x}" y="${y + 206}" width="${w}" height="180" rx="18" fill="#6386F7"/>
        <text x="${x + 30}" y="${y + 264}" class="rightCardTitle">详情承载补充说明</text>
        <text x="${x + 30}" y="${y + 318}" class="rightCardMetric">OK</text>
      `
    }
  },
  {
    slug: "review-poster",
    title: "复盘海报版",
    posterTitle: "做完一轮之后，\n要把成长写下来。",
    posterSubtitle: ["复盘帮助用户从执行走向成长。", "它不参与进度，却影响下一步质量。"],
    left: {
      kicker: "REVIEW / 成长记录",
      title: ["31 条", "历史复盘"],
      content: (x, y, w) => `
        <rect x="${x + 22}" y="${y + 22}" width="${w - 44}" height="98" rx="24" fill="#F5F7FB"/>
        <text x="${x + 42}" y="${y + 60}" class="listCardTitle">05/27 · AI 创作者陪跑营</text>
        <text x="${x + 42}" y="${y + 94}" class="listCardSub">用户真正会为“被陪跑”付费。</text>
        <rect x="${x + 22}" y="${y + 140}" width="${w - 44}" height="98" rx="24" fill="#F5F7FB"/>
        <text x="${x + 42}" y="${y + 178}" class="listCardTitle">05/26 · 未关联计划</text>
        <text x="${x + 42}" y="${y + 212}" class="listCardSub">首页需要更一眼看懂的主文案。</text>
      `
    },
    center: {
      kicker: "写复盘",
      quote: ["“今天学到了什么，", "明天准备怎么继续。”"],
      sub: ["支持一天多条，可选关联当前计划。"],
      content: (x, y, w, h) => `
        <rect x="${x + 32}" y="${y + 36}" width="${w - 64}" height="76" rx="20" fill="#F5F7FB"/>
        <rect x="${x + 32}" y="${y + 130}" width="${w - 64}" height="76" rx="20" fill="#F5F7FB"/>
        <rect x="${x + 32}" y="${y + 224}" width="${w - 64}" height="76" rx="20" fill="#F5F7FB"/>
        <rect x="${x + 32}" y="${y + 318}" width="${w - 64}" height="76" rx="20" fill="#F5F7FB"/>
        <rect x="${x + 32}" y="${y + 418}" width="${w - 64}" height="68" rx="24" fill="#4AD3A3"/>
        <text x="${x + w / 2 - 58}" y="${y + 462}" class="formButton">保存复盘</text>
      `
    },
    right: {
      month: "收获",
      calendar: (x, y) => `
        <text x="${x}" y="${y}" class="calendarDays">今天收获</text>
      `,
      cards: (x, y, w) => `
        <rect x="${x}" y="${y}" width="${w}" height="180" rx="18" fill="#40D49A"/>
        <text x="${x + 30}" y="${y + 58}" class="rightCardTitle">今日收获</text>
        <text x="${x + 30}" y="${y + 112}" class="rightCardMetric">1</text>
        <rect x="${x}" y="${y + 206}" width="${w}" height="180" rx="18" fill="#6386F7"/>
        <text x="${x + 30}" y="${y + 264}" class="rightCardTitle">下一步行动</text>
        <text x="${x + 30}" y="${y + 318}" class="rightCardMetric">1</text>
      `
    }
  },
  {
    slug: "profile-poster",
    title: "我的海报版",
    posterTitle: "回头看时，\n也能看见自己在成长。",
    posterSubtitle: ["统计口径只算未删除内容。", "我的页更像轻量仪表板，不是设置堆砌页。"],
    left: {
      kicker: "PROFILE / 统计",
      title: ["2", "当前目标"],
      content: (x, y, w) => `
        <circle cx="${x + 86}" cy="${y + 96}" r="46" fill="#E9F5EF"/>
        <text x="${x + 70}" y="${y + 108}" class="avatarLetter">VC</text>
        <text x="${x + 22}" y="${y + 206}" class="miniMetric">已完成任务</text>
        <text x="${x + 22}" y="${y + 252}" class="bigInline">47</text>
        <text x="${x + 22}" y="${y + 324}" class="miniMetric">累计复盘</text>
        <text x="${x + 22}" y="${y + 370}" class="bigInline">31</text>
      `
    },
    center: {
      kicker: "我的",
      quote: ["“不是靠打卡坚持，", "而是靠结果感继续前进。”"],
      sub: ["这里回看成长密度，也完成基础设置。"],
      content: (x, y, w, h) => `
        <rect x="${x + 34}" y="${y + 48}" width="${w - 68}" height="76" rx="22" fill="#F5F7FB"/>
        <text x="${x + 62}" y="${y + 96}" class="formLabel">设置</text>
        <rect x="${x + 34}" y="${y + 140}" width="${w - 68}" height="76" rx="22" fill="#F5F7FB"/>
        <text x="${x + 62}" y="${y + 188}" class="formLabel">清理缓存</text>
        <rect x="${x + 34}" y="${y + 232}" width="${w - 68}" height="76" rx="22" fill="#F5F7FB"/>
        <text x="${x + 62}" y="${y + 280}" class="formLabel">关于成长薄</text>
        <rect x="${x + 34}" y="${y + 344}" width="${w - 68}" height="72" rx="26" fill="#203229"/>
        <text x="${x + w / 2 - 56}" y="${y + 390}" class="stateTextActive">退出登录</text>
      `
    },
    right: {
      month: "概览",
      calendar: (x, y) => `
        <text x="${x}" y="${y}" class="calendarDays">目标 · 任务 · 复盘</text>
      `,
      cards: (x, y, w) => `
        <rect x="${x}" y="${y}" width="${w}" height="180" rx="18" fill="#40D49A"/>
        <text x="${x + 30}" y="${y + 58}" class="rightCardTitle">AI 创作者陪跑营</text>
        <text x="${x + 30}" y="${y + 112}" class="rightCardMetric">68%</text>
        <rect x="${x}" y="${y + 206}" width="${w}" height="180" rx="18" fill="#6386F7"/>
        <text x="${x + 30}" y="${y + 264}" class="rightCardTitle">明日重点</text>
        <text x="${x + 30}" y="${y + 318}" class="rightCardMetric">1</text>
      `
    }
  }
];

function posterSvg(page) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="factoryGradient" x1="0" y1="0" x2="1536" y2="2048" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#555B65"/>
      <stop offset="0.32" stop-color="#C9CED3"/>
      <stop offset="0.7" stop-color="#737C84"/>
      <stop offset="1" stop-color="#424A52"/>
    </linearGradient>
    <pattern id="steelBeams" width="224" height="224" patternUnits="userSpaceOnUse">
      <rect width="224" height="224" fill="transparent"/>
      <path d="M0 18 L224 18 M0 74 L224 74 M0 130 L224 130 M0 186 L224 186" stroke="rgba(255,255,255,0.22)" stroke-width="9"/>
      <path d="M18 0 L18 224 M118 0 L118 224 M206 0 L206 224" stroke="rgba(25,35,48,0.55)" stroke-width="8"/>
      <path d="M0 40 L224 160" stroke="rgba(255,255,255,0.09)" stroke-width="6"/>
    </pattern>
    <linearGradient id="blurPhoto" x1="590" y1="360" x2="1024" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ECEEF5"/>
      <stop offset="0.38" stop-color="#B8B9C6"/>
      <stop offset="0.72" stop-color="#D4AFA4"/>
      <stop offset="1" stop-color="#C6CEDB"/>
    </linearGradient>
    <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(87,222,176,0.34)"/>
      <stop offset="1" stop-color="rgba(87,222,176,0.02)"/>
    </linearGradient>
    <filter id="phoneShadow" x="-20%" y="-20%" width="160%" height="170%">
      <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="rgba(0,0,0,0.32)"/>
    </filter>
  </defs>

  ${heroBackdrop(page.posterTitle, page.posterSubtitle)}

  ${phoneShell(44, 620, 450, 1220, leftPhoneInner(page))}
  ${phoneShell(494, 180, 548, 1660, centerPhoneInner(page))}
  ${phoneShell(1040, 430, 452, 1410, rightPhoneInner(page))}

  <style>
    .status { font: 700 22px "Helvetica Neue", "PingFang SC", sans-serif; fill: #111; }
    .statusCenter { font: 700 18px "Helvetica Neue", "PingFang SC", sans-serif; fill: #111; }
    .glassTitle { font: 700 22px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.76); }
    .glassMetric { font: 700 64px "DIN Alternate", "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.68); }
    .glassLabel { font: 500 20px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.62); }
    .gridLabel { font: 500 18px "Helvetica Neue", "PingFang SC", sans-serif; fill: rgba(255,255,255,0.46); }
    .posterBrand { font: 700 22px "Helvetica Neue", "PingFang SC", sans-serif; letter-spacing: 4px; fill: rgba(255,255,255,0.52); }
    .posterTitle { font: 700 76px "PingFang SC", "Helvetica Neue", sans-serif; fill: #fff; }
    .posterSubtitle { font: 500 34px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.82); }
    .screenKicker { font: 700 20px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(22,34,37,0.78); }
    .screenTitle { font: 700 58px "PingFang SC", "Helvetica Neue", sans-serif; fill: #111; }
    .centerQuote { font: 700 74px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(0,0,0,0.88); }
    .centerSub { font: 500 34px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(0,0,0,0.62); }
    .miniTag { font: 700 20px "PingFang SC", "Helvetica Neue", sans-serif; fill: #fff; }
    .miniMetric { font: 600 22px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(22,34,37,0.64); }
    .bigInline { font: 700 62px "DIN Alternate", "Helvetica Neue", sans-serif; fill: #0f1e22; }
    .iconGlyph { font: 700 34px "Helvetica Neue", sans-serif; fill: #52D9B0; }
    .iconTitle { font: 700 26px "PingFang SC", "Helvetica Neue", sans-serif; fill: #111; }
    .iconSub { font: 500 22px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(17,17,17,0.58); }
    .tileGlyph { font: 700 44px "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.9); }
    .tileLabel { font: 600 22px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.92); }
    .monthLabel { font: 500 22px "PingFang SC", "Helvetica Neue", sans-serif; fill: #6E89FF; }
    .monthIcon { font: 700 30px "Helvetica Neue", sans-serif; fill: #6E89FF; }
    .calendarDays { font: 500 20px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(17,17,17,0.6); }
    .calendarToday { font: 700 20px "PingFang SC", "Helvetica Neue", sans-serif; fill: #fff; }
    .panelLabel { font: 500 18px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(17,17,17,0.42); }
    .rightCardTitle { font: 500 24px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.92); }
    .rightCardMetric { font: 700 56px "DIN Alternate", "Helvetica Neue", sans-serif; fill: rgba(255,255,255,0.96); }
    .navIcon { font: 700 24px "Helvetica Neue", sans-serif; fill: rgba(17,17,17,0.38); }
    .navIconActive { font: 700 22px "Helvetica Neue", sans-serif; fill: #fff; }
    .listCardTitle { font: 700 28px "PingFang SC", "Helvetica Neue", sans-serif; fill: #111; }
    .listCardSub { font: 500 22px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(17,17,17,0.58); }
    .formLabel { font: 600 24px "PingFang SC", "Helvetica Neue", sans-serif; fill: rgba(17,17,17,0.76); }
    .formButton { font: 700 28px "PingFang SC", "Helvetica Neue", sans-serif; fill: #fff; }
    .stateText { font: 700 24px "Helvetica Neue", "PingFang SC", sans-serif; fill: rgba(17,17,17,0.62); }
    .stateTextActive { font: 700 24px "Helvetica Neue", "PingFang SC", sans-serif; fill: #fff; }
    .avatarLetter { font: 700 32px "Helvetica Neue", "PingFang SC", sans-serif; fill: #1da57a; }
  </style>
</svg>`;
}

function renderIndex(items) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GoalFlow Poster Mockups</title>
    <style>
      :root {
        --bg: #0e1620;
        --card: rgba(255,255,255,0.08);
        --line: rgba(255,255,255,0.14);
        --text: #f3f6fb;
        --muted: rgba(243,246,251,0.7);
        --accent: #4fd9c9;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(79,217,201,0.18), transparent 24%),
          radial-gradient(circle at bottom right, rgba(110,137,255,0.2), transparent 24%),
          linear-gradient(180deg, #111827 0%, #151c26 42%, #0f151d 100%);
        color: var(--text);
        font-family: "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif;
      }
      main {
        max-width: 1420px;
        margin: 0 auto;
        padding: 52px 24px 80px;
      }
      .tag {
        display: inline-block;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(79,217,201,0.12);
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
      }
      h1 {
        margin: 18px 0 10px;
        font-size: clamp(34px, 5vw, 58px);
        line-height: 1.08;
      }
      .intro {
        max-width: 780px;
        margin: 0 0 32px;
        color: var(--muted);
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
      }
      .thumb {
        overflow: hidden;
        border-radius: 22px;
        background: rgba(255,255,255,0.06);
      }
      img {
        display: block;
        width: 100%;
        height: auto;
      }
      h2 {
        margin: 16px 0 8px;
        font-size: 24px;
      }
      p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.7;
      }
      a {
        display: inline-block;
        margin-top: 14px;
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <span class="tag">GoalFlow / 3:4 Poster Mockups</span>
      <h1>展示海报风格 UI 图</h1>
      <p class="intro">这套版本参考你给的视觉方向，采用 3:4 竖版比例、大场景背景、三台悬浮手机、半透明数据浮层与偏品牌海报的展示方式，更适合汇报、路演或产品视觉定调。</p>
      <section class="grid">
        ${items
          .map(
            (item) => `
            <article class="card">
              <div class="thumb">
                <img src="./${item.filename}" alt="${item.title}" />
              </div>
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

  for (const page of mobilePages) {
    const filename = `${page.slug}.svg`;
    await fs.writeFile(path.join(outputDir, filename), posterSvg(page), "utf8");
    items.push({
      filename,
      title: page.title,
      description: "3:4 竖版展示海报，结合产品卖点与页面 UI，适合演示和视觉提案。"
    });
  }

  await fs.writeFile(path.join(outputDir, "index.html"), renderIndex(items), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
