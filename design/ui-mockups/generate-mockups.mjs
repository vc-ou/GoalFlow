import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("design/ui-mockups");

const colors = {
  bg: "#f6f3ea",
  paper: "#fffdf8",
  text: "#203229",
  subtext: "#6b786e",
  green: "#7fb685",
  greenDeep: "#2f6a52",
  greenSoft: "#dceedd",
  blue: "#87b8d8",
  blueSoft: "#dcebf5",
  purple: "#b39adf",
  purpleSoft: "#ece6fa",
  yellow: "#f1c86f",
  yellowSoft: "#fff2cc",
  border: "#d9e3d4",
  shadow: "rgba(48, 70, 54, 0.10)"
};

const mobileSize = { width: 390, height: 844 };
const desktopSize = { width: 1440, height: 1024 };

function svgText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function multilineText(lines, x, y, options = {}) {
  const { lineHeight = 18, className = "body" } = options;
  return `<text x="${x}" y="${y}" class="${className}">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${svgText(line)}</tspan>`)
    .join("")}</text>`;
}

function mobileFrame({ title, subtitle, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${mobileSize.width}" height="${mobileSize.height}" viewBox="0 0 ${mobileSize.width} ${mobileSize.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGlow" x1="30" y1="20" x2="330" y2="844" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F9F5E9"/>
      <stop offset="0.52" stop-color="#EEF7EE"/>
      <stop offset="1" stop-color="#E7F0F6"/>
    </linearGradient>
    <linearGradient id="heroGreen" x1="42" y1="96" x2="340" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#E7F6E7"/>
      <stop offset="1" stop-color="#D7E9F4"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="${colors.shadow}"/>
    </filter>
  </defs>
  <rect width="${mobileSize.width}" height="${mobileSize.height}" rx="38" fill="url(#bgGlow)"/>
  <circle cx="322" cy="84" r="72" fill="#E8F3E2"/>
  <circle cx="74" cy="742" r="92" fill="#F2E7D8" opacity="0.75"/>
  <rect x="18" y="16" width="354" height="812" rx="34" fill="${colors.paper}" opacity="0.72"/>
  <text x="34" y="48" class="status">9:41</text>
  <text x="312" y="48" class="status">5G 93%</text>
  <text x="34" y="84" class="navTitle">${svgText(title)}</text>
  <text x="34" y="108" class="navSub">${svgText(subtitle)}</text>
  ${body}
  <style>
    .status { font: 600 14px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.text}; }
    .navTitle { font: 700 24px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.text}; }
    .navSub { font: 500 13px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.subtext}; }
    .eyebrow { font: 700 11px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; letter-spacing: 1.3px; fill: ${colors.greenDeep}; }
    .headline { font: 700 22px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.text}; }
    .title { font: 700 17px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.text}; }
    .body { font: 500 13px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.subtext}; }
    .bodyStrong { font: 600 13px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.text}; }
    .metric { font: 700 30px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.text}; }
    .caption { font: 600 11px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.subtext}; }
    .chip { font: 600 11px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.greenDeep}; }
    .buttonText { font: 700 13px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; }
    .progressLabel { font: 700 12px "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif; fill: ${colors.blue}; }
  </style>
</svg>`;
}

function desktopFrame({ title, subtitle, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${desktopSize.width}" height="${desktopSize.height}" viewBox="0 0 ${desktopSize.width} ${desktopSize.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="deskBg" x1="20" y1="40" x2="1260" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F8F3E8"/>
      <stop offset="0.5" stop-color="#EEF7EE"/>
      <stop offset="1" stop-color="#E8EEF6"/>
    </linearGradient>
    <filter id="deskShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${colors.shadow}"/>
    </filter>
  </defs>
  <rect width="${desktopSize.width}" height="${desktopSize.height}" rx="40" fill="url(#deskBg)"/>
  <circle cx="160" cy="920" r="170" fill="#F3E6D4" opacity="0.85"/>
  <circle cx="1240" cy="110" r="120" fill="#E1F0E3" opacity="0.8"/>
  <rect x="24" y="24" width="1392" height="976" rx="36" fill="${colors.paper}" opacity="0.84"/>
  <rect x="48" y="48" width="280" height="928" rx="28" fill="#203229"/>
  <text x="84" y="104" fill="#F5F3EC" style="font:700 28px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">成长薄 Admin</text>
  <text x="84" y="132" fill="#9FB6AA" style="font:500 13px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">目标推进系统后台</text>
  ${body}
  <text x="364" y="88" fill="${colors.text}" style="font:700 34px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">${svgText(title)}</text>
  <text x="364" y="116" fill="${colors.subtext}" style="font:500 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">${svgText(subtitle)}</text>
</svg>`;
}

function rect(x, y, width, height, fill, rx = 24, extra = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}" ${extra}/>`;
}

function strokeRect(x, y, width, height, fill, stroke, rx = 24, extra = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
}

function text(x, y, value, className = "body") {
  return `<text x="${x}" y="${y}" class="${className}">${svgText(value)}</text>`;
}

const pages = [
  {
    id: "mobile-login",
    title: "登录页",
    kind: "mobile",
    filename: "01-mobile-login.svg",
    render() {
      return mobileFrame({
        title: "欢迎回来",
        subtitle: "微信授权后继续你的成长路线",
        body: `
          <rect x="34" y="138" width="322" height="216" rx="28" fill="url(#heroGreen)" filter="url(#softShadow)"/>
          <text x="58" y="174" class="eyebrow">GOAL-DRIVEN GROWTH</text>
          ${multilineText(["不是打卡，不是日历。", "而是把目标一步步推进成结果。"], 58, 210, {
            lineHeight: 30,
            className: "headline"
          })}
          ${multilineText(["目标 → 阶段 → 行动 → 结果", "专为 AI 创作者与独立开发者设计"], 58, 282, {
            lineHeight: 20
          })}
          ${rect(58, 382, 274, 56, colors.greenDeep, 28)}
          <text x="146" y="416" class="buttonText" fill="#fff">微信一键授权登录</text>
          ${strokeRect(58, 452, 274, 52, "#FFFFFFB8", colors.border, 26)}
          <text x="135" y="484" class="buttonText" fill="${colors.greenDeep}">先看看产品亮点</text>
          ${strokeRect(34, 542, 322, 120, "#FFFDF8", colors.border, 26)}
          <text x="58" y="576" class="title">你登录后会看到</text>
          ${multilineText(["1. 当前最重要的目标", "2. 现在应该推进的任务", "3. 明天特别想做的事"], 58, 604, {
            lineHeight: 22
          })}
          ${text(34, 738, "登录态 7 天有效 · token 失效后自动重新唤起微信登录", "caption")}
        `
      });
    }
  },
  {
    id: "mobile-home",
    title: "首页",
    kind: "mobile",
    filename: "02-mobile-home.svg",
    render() {
      return mobileFrame({
        title: "现在推进",
        subtitle: "一眼看到当前目标、阶段和下一步行动",
        body: `
          <rect x="34" y="138" width="322" height="182" rx="30" fill="url(#heroGreen)" filter="url(#softShadow)"/>
          <text x="58" y="170" class="eyebrow">当前目标</text>
          ${multilineText(["30 天做出 AI 创作陪跑营", "阶段 2：验证转化话术"], 58, 204, {
            lineHeight: 30,
            className: "headline"
          })}
          ${text(58, 264, "总进度 68% · 已完成 17 / 29 个关键任务", "bodyStrong")}
          ${rect(58, 278, 250, 10, "#FFFFFF", 999)}
          ${rect(58, 278, 170, 10, colors.greenDeep, 999)}
          ${text(58, 306, "你离目标更近一步。", "progressLabel")}

          ${strokeRect(34, 338, 322, 178, "#FFFDF8", colors.border, 28, `filter="url(#softShadow)"`)}
          <text x="58" y="370" class="eyebrow">下一步行动</text>
          ${text(58, 398, "去 Reddit 找 20 条真实提问并整理钩子", "title")}
          ${multilineText(["平台：Reddit / X", "关键词：ai workflow, prompt pain point", "完成标准：整理出 10 个高频表达"], 58, 426, {
            lineHeight: 20
          })}
          ${rect(58, 470, 124, 34, "#E1F0E4", 17)}
          <text x="92" y="492" class="chip">设为 doing</text>
          ${rect(194, 470, 124, 34, "#203229", 17)}
          <text x="228" y="492" class="chip" fill="#fff">直接完成</text>

          ${strokeRect(34, 534, 322, 148, "#FFFDF8", colors.border, 28)}
          <text x="58" y="566" class="eyebrow">推荐任务列表</text>
          ${rect(58, 586, 274, 36, "#EAF4EE", 18)}
          ${text(72, 609, "正在做  ·  修改首页钩子文案", "bodyStrong")}
          ${rect(58, 632, 274, 36, "#F6F3EA", 18)}
          ${text(72, 655, "高优先级 · 写 3 条转化私信模版", "bodyStrong")}

          ${strokeRect(34, 700, 322, 102, "#FFF8E7", "#F0D8A9", 28)}
          <text x="58" y="732" class="eyebrow">明日代办</text>
          ${text(58, 756, "明天特别想做什么？", "title")}
          ${text(58, 780, "想把 demo 录完，再补一条朋友圈预热。", "body")}
        `
      });
    }
  },
  {
    id: "mobile-plan-list",
    title: "计划列表",
    kind: "mobile",
    filename: "03-mobile-plan-list.svg",
    render() {
      return mobileFrame({
        title: "计划",
        subtitle: "创建目标，选择当前推进路线",
        body: `
          ${strokeRect(34, 138, 322, 232, "#FFFDF8", colors.border, 30, `filter="url(#softShadow)"`)}
          <text x="58" y="172" class="eyebrow">创建计划</text>
          ${text(58, 198, "计划名称", "caption")}
          ${rect(58, 208, 274, 44, "#F6F6F0", 18)}
          ${text(76, 236, "做出 AI 创作者陪跑营", "bodyStrong")}
          ${text(58, 276, "最终目标", "caption")}
          ${rect(58, 286, 274, 56, "#F6F6F0", 18)}
          ${multilineText(["30 天内验证需求，完成第一批 10 位付费用户。"], 76, 314, {
            lineHeight: 18
          })}
          ${rect(58, 356, 274, 46, colors.greenDeep, 23)}
          <text x="160" y="385" class="buttonText" fill="#fff">创建计划</text>

          ${text(34, 408, "我的计划", "title")}
          ${strokeRect(34, 430, 322, 116, "#E7F6E7", "#CFE5D1", 28)}
          ${text(58, 464, "AI 创作者陪跑营", "title")}
          ${text(58, 488, "当前计划 · 阶段 2 / 总进度 68%", "bodyStrong")}
          ${text(58, 512, "标签：AI 创作 / 增长 / MVP", "body")}

          ${strokeRect(34, 562, 322, 116, "#FFFDF8", colors.border, 28)}
          ${text(58, 596, "独立开发复盘系统", "title")}
          ${text(58, 620, "未设为当前 · 阶段 1 / 总进度 24%", "bodyStrong")}
          ${text(58, 644, "标签：产品 / 复盘 / 内容实验", "body")}

          ${strokeRect(34, 694, 322, 108, "#F1EFFA", "#E0D8F3", 28)}
          ${text(58, 728, "归档计划", "title")}
          ${text(58, 752, "已完成 1 个 · 方便回看曾经的成果路径", "bodyStrong")}
        `
      });
    }
  },
  {
    id: "mobile-plan-detail",
    title: "计划详情",
    kind: "mobile",
    filename: "04-mobile-plan-detail.svg",
    render() {
      return mobileFrame({
        title: "计划详情",
        subtitle: "按阶段看推进，用任务驱动总进度",
        body: `
          <rect x="34" y="138" width="322" height="152" rx="30" fill="url(#heroGreen)" filter="url(#softShadow)"/>
          <text x="58" y="170" class="eyebrow">AI 创作者陪跑营</text>
          ${text(58, 198, "当前阶段：验证转化话术", "headline")}
          ${text(58, 236, "总进度 68% · 已完成任务权重 170 / 250", "bodyStrong")}
          ${rect(58, 250, 250, 10, "#FFFFFF", 999)}
          ${rect(58, 250, 170, 10, colors.greenDeep, 999)}

          ${strokeRect(34, 308, 322, 78, "#FFFDF8", colors.border, 28)}
          ${text(58, 340, "阶段切换", "eyebrow")}
          ${rect(58, 352, 112, 22, "#203229", 11)}
          <text x="87" y="367" class="chip" fill="#fff">阶段 1 已完成</text>
          ${rect(180, 352, 92, 22, "#DCEEDD", 11)}
          ${rect(280, 352, 52, 22, "#EDE7F9", 11)}
          <text x="198" y="367" class="chip">当前推进</text>
          <text x="298" y="367" class="chip">阶段 3</text>

          ${strokeRect(34, 402, 322, 182, "#FFFDF8", colors.border, 28)}
          ${text(58, 434, "当前阶段任务", "title")}
          ${rect(58, 452, 274, 42, "#EAF4EE", 18)}
          ${text(72, 478, "doing · 私信模版 A/B 测试", "bodyStrong")}
          ${text(258, 478, "权重 20", "caption")}
          ${rect(58, 504, 274, 42, "#F6F3EA", 18)}
          ${text(72, 530, "todo · 复盘 10 条咨询截图", "bodyStrong")}
          ${text(258, 530, "权重 15", "caption")}
          ${rect(58, 556, 274, 16, "#EEF2F4", 8)}
          ${rect(58, 556, 162, 16, colors.blue, 8)}
          ${text(58, 578, "阶段进度 59%", "progressLabel")}

          ${strokeRect(34, 602, 322, 200, "#FFFDF8", colors.border, 28)}
          ${text(58, 634, "新建任务", "title")}
          ${rect(58, 648, 274, 38, "#F6F6F0", 18)}
          ${rect(58, 694, 132, 38, "#F6F6F0", 18)}
          ${rect(200, 694, 132, 38, "#F6F6F0", 18)}
          ${rect(58, 740, 274, 46, colors.greenDeep, 23)}
          <text x="164" y="769" class="buttonText" fill="#fff">添加任务</text>
        `
      });
    }
  },
  {
    id: "mobile-task-detail",
    title: "任务详情",
    kind: "mobile",
    filename: "05-mobile-task-detail.svg",
    render() {
      return mobileFrame({
        title: "任务详情",
        subtitle: "把平台、关键词和完成标准说清楚",
        body: `
          ${strokeRect(34, 138, 322, 112, "#FFFDF8", colors.border, 28, `filter="url(#softShadow)"`)}
          ${text(58, 170, "去 Reddit 找 20 条真实提问并整理钩子", "title")}
          ${text(58, 196, "状态 doing · 优先级 high · 权重 20", "bodyStrong")}
          ${text(58, 220, "所属阶段：验证转化话术", "body")}

          ${strokeRect(34, 268, 322, 326, "#FFFDF8", colors.border, 28)}
          ${text(58, 300, "编辑任务", "title")}
          ${text(58, 326, "怎么做", "caption")}
          ${rect(58, 336, 274, 60, "#F6F6F0", 18)}
          ${multilineText(["抓 20 条用户原话，提炼痛点句式，", "标出可直接用于转化文案的表达。"], 76, 362, {
            lineHeight: 18
          })}
          ${text(58, 424, "执行平台", "caption")}
          ${rect(58, 434, 274, 38, "#F6F6F0", 18)}
          ${text(76, 458, "Reddit, X", "bodyStrong")}
          ${text(58, 500, "搜索关键词", "caption")}
          ${rect(58, 510, 274, 38, "#F6F6F0", 18)}
          ${text(76, 534, "ai workflow, prompt pain point", "bodyStrong")}
          ${text(58, 572, "完成标准", "caption")}
          ${rect(58, 582, 274, 12, "#E3EEE6", 999)}

          ${strokeRect(34, 612, 322, 190, "#FFFDF8", colors.border, 28)}
          ${text(58, 644, "快速更新状态", "title")}
          ${rect(58, 664, 80, 36, "#F0F1E9", 18)}
          ${rect(154, 664, 80, 36, "#E1F0E4", 18)}
          ${rect(250, 664, 82, 36, "#203229", 18)}
          <text x="86" y="687" class="chip">todo</text>
          <text x="178" y="687" class="chip">doing</text>
          <text x="278" y="687" class="chip" fill="#fff">done</text>
          ${text(58, 732, "备注", "caption")}
          ${multilineText(["用户原话优先，不要只摘空泛观点。", "保留截图地址，方便后续写私信模版。"], 58, 756, {
            lineHeight: 18
          })}
        `
      });
    }
  },
  {
    id: "mobile-review-list",
    title: "复盘列表",
    kind: "mobile",
    filename: "06-mobile-review-list.svg",
    render() {
      return mobileFrame({
        title: "复盘",
        subtitle: "从执行走向成长，沉淀收获与下一步",
        body: `
          <rect x="34" y="138" width="322" height="98" rx="28" fill="url(#heroGreen)" filter="url(#softShadow)"/>
          ${text(58, 172, "今天最值得记录的是什么？", "headline")}
          ${text(58, 202, "支持一天多条复盘，可选关联当前计划。", "bodyStrong")}

          ${rect(34, 254, 322, 48, colors.greenDeep, 24)}
          <text x="152" y="284" class="buttonText" fill="#fff">新建复盘</text>

          ${strokeRect(34, 320, 322, 144, "#FFFDF8", colors.border, 28)}
          ${text(58, 352, "05/27 · AI 创作者陪跑营", "eyebrow")}
          ${multilineText(["今天收获：用户真正会为“被陪跑”付费，", "不是为“更多模板”付费。"], 58, 382, {
            lineHeight: 20,
            className: "bodyStrong"
          })}
          ${text(58, 430, "下一步：把话术从“教你做”改成“陪你出结果”。", "body")}

          ${strokeRect(34, 482, 322, 144, "#FFFDF8", colors.border, 28)}
          ${text(58, 514, "05/26 · 未关联计划", "eyebrow")}
          ${multilineText(["新想法：明日代办可以强调主观意愿，", "让低压状态下也能保留行动感。"], 58, 544, {
            lineHeight: 20,
            className: "bodyStrong"
          })}
          ${text(58, 592, "遇到的问题：首页内容还不够一眼看懂。", "body")}

          ${strokeRect(34, 644, 322, 158, "#F8F1FF", "#E1D8F4", 28)}
          ${text(58, 676, "历史筛选", "title")}
          ${text(58, 702, "全部 · 关联当前计划 · 仅最近 7 天", "bodyStrong")}
          ${text(58, 730, "按 created_at 倒序展示，支持编辑和删除。", "body")}
        `
      });
    }
  },
  {
    id: "mobile-review-editor",
    title: "复盘编辑",
    kind: "mobile",
    filename: "07-mobile-review-editor.svg",
    render() {
      return mobileFrame({
        title: "写复盘",
        subtitle: "让经验能沉淀，不只是把任务做完",
        body: `
          ${strokeRect(34, 138, 322, 664, "#FFFDF8", colors.border, 28, `filter="url(#softShadow)"`)}
          ${text(58, 172, "今日收获", "caption")}
          ${rect(58, 182, 274, 76, "#F6F6F0", 18)}
          ${text(58, 286, "遇到的问题", "caption")}
          ${rect(58, 296, 274, 76, "#F6F6F0", 18)}
          ${text(58, 400, "新想法", "caption")}
          ${rect(58, 410, 274, 76, "#F6F6F0", 18)}
          ${text(58, 514, "下一步行动", "caption")}
          ${rect(58, 524, 274, 76, "#F6F6F0", 18)}
          ${text(58, 628, "关联计划", "caption")}
          ${rect(58, 638, 274, 42, "#F3F6F8", 18)}
          ${text(76, 664, "AI 创作者陪跑营", "bodyStrong")}
          ${rect(58, 708, 274, 46, colors.greenDeep, 23)}
          <text x="164" y="737" class="buttonText" fill="#fff">保存复盘</text>
          ${text(58, 782, "同一天可创建多条。复盘不参与进度计算。", "caption")}
        `
      });
    }
  },
  {
    id: "mobile-profile",
    title: "我的",
    kind: "mobile",
    filename: "08-mobile-profile.svg",
    render() {
      return mobileFrame({
        title: "我的",
        subtitle: "回看你的成长密度与系统设置",
        body: `
          <rect x="34" y="138" width="322" height="164" rx="30" fill="url(#heroGreen)" filter="url(#softShadow)"/>
          <circle cx="88" cy="196" r="30" fill="#FFFFFF"/>
          <text x="130" y="188" class="title">VC</text>
          <text x="130" y="212" class="bodyStrong">连续在推进，不靠打卡也能前进</text>
          ${rect(58, 236, 80, 42, "#FFFFFF", 21)}
          ${rect(154, 236, 80, 42, "#FFFFFF", 21)}
          ${rect(250, 236, 80, 42, "#FFFFFF", 21)}
          <text x="79" y="257" class="caption">当前目标</text>
          <text x="180" y="257" class="caption">已完成任务</text>
          <text x="279" y="257" class="caption">累计复盘</text>
          <text x="92" y="276" class="bodyStrong">2</text>
          <text x="184" y="276" class="bodyStrong">47</text>
          <text x="288" y="276" class="bodyStrong">31</text>

          ${strokeRect(34, 320, 322, 148, "#FFFDF8", colors.border, 28)}
          ${text(58, 352, "设置", "title")}
          ${text(58, 380, "清理缓存", "bodyStrong")}
          ${text(58, 406, "通知偏好", "bodyStrong")}
          ${text(58, 432, "关于成长薄", "bodyStrong")}

          ${strokeRect(34, 486, 322, 120, "#FFF8E7", "#ECD59E", 28)}
          ${text(58, 518, "当前目标概览", "title")}
          ${text(58, 546, "AI 创作者陪跑营 · 总进度 68%", "bodyStrong")}
          ${text(58, 570, "明天重点：录一版 3 分钟介绍视频", "body")}

          ${rect(34, 722, 322, 52, "#203229", 26)}
          <text x="166" y="754" class="buttonText" fill="#fff">退出登录</text>
        `
      });
    }
  },
  {
    id: "admin-login",
    title: "后台登录",
    kind: "desktop",
    filename: "09-admin-login.svg",
    render() {
      return desktopFrame({
        title: "管理员登录",
        subtitle: "小程序用户与后台管理员采用两套独立登录体系",
        body: `
          <text x="84" y="220" fill="#F5F3EC" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">用户管理</text>
          <text x="84" y="262" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板管理</text>
          <text x="84" y="304" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">数据统计</text>
          <text x="84" y="346" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">系统配置</text>

          <rect x="734" y="184" width="468" height="520" rx="34" fill="url(#deskBg)" filter="url(#deskShadow)"/>
          <text x="780" y="252" fill="${colors.greenDeep}" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif; letter-spacing:1.5px;">ADMIN ACCESS</text>
          <text x="780" y="304" fill="${colors.text}" style="font:700 36px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">守住系统稳定，也守住用户成长数据</text>
          <rect x="780" y="382" width="376" height="64" rx="20" fill="#FFFDF8" stroke="${colors.border}"/>
          <rect x="780" y="466" width="376" height="64" rx="20" fill="#FFFDF8" stroke="${colors.border}"/>
          <rect x="780" y="562" width="376" height="60" rx="30" fill="${colors.greenDeep}"/>
          <text x="932" y="600" fill="#fff" style="font:700 18px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">登录后台</text>
          <text x="780" y="654" fill="${colors.subtext}" style="font:500 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">支持账号密码登录。被封禁的小程序用户会在业务接口收到 403。</text>
        `
      });
    }
  },
  {
    id: "admin-dashboard",
    title: "数据统计",
    kind: "desktop",
    filename: "10-admin-dashboard.svg",
    render() {
      return desktopFrame({
        title: "数据统计",
        subtitle: "看清活跃度、完成率与留存的健康度",
        body: `
          <rect x="72" y="190" width="232" height="56" rx="18" fill="#2F6A52"/>
          <text x="126" y="226" fill="#fff" style="font:700 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">数据统计</text>
          <text x="84" y="286" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">用户管理</text>
          <text x="84" y="328" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板管理</text>
          <text x="84" y="370" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">系统配置</text>

          <rect x="364" y="154" width="238" height="146" rx="28" fill="#E7F6E7" filter="url(#deskShadow)"/>
          <rect x="622" y="154" width="238" height="146" rx="28" fill="#EAF1F7" filter="url(#deskShadow)"/>
          <rect x="880" y="154" width="238" height="146" rx="28" fill="#F6EDDA" filter="url(#deskShadow)"/>
          <rect x="1138" y="154" width="238" height="146" rx="28" fill="#EFE7FA" filter="url(#deskShadow)"/>
          <text x="394" y="206" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">DAU</text>
          <text x="394" y="256" fill="${colors.text}" style="font:700 42px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">1,284</text>
          <text x="652" y="206" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">WAU</text>
          <text x="652" y="256" fill="${colors.text}" style="font:700 42px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">4,912</text>
          <text x="910" y="206" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">平均完成率</text>
          <text x="910" y="256" fill="${colors.text}" style="font:700 42px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">56%</text>
          <text x="1168" y="206" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">D7 留存</text>
          <text x="1168" y="256" fill="${colors.text}" style="font:700 42px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">31%</text>

          <rect x="364" y="334" width="660" height="292" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="398" y="382" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">近 7 日活跃趋势</text>
          <polyline points="412,548 492,516 572,498 652,446 732,472 812,420 892,394 972,362" fill="none" stroke="${colors.greenDeep}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="972" cy="362" r="9" fill="${colors.greenDeep}"/>
          <text x="904" y="348" fill="${colors.greenDeep}" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">+12%</text>

          <rect x="1048" y="334" width="328" height="292" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="1082" y="382" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">计划状态分布</text>
          <rect x="1082" y="422" width="220" height="16" rx="8" fill="#EDF2EE"/>
          <rect x="1082" y="422" width="142" height="16" rx="8" fill="${colors.greenDeep}"/>
          <text x="1082" y="462" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">active 61%</text>
          <text x="1082" y="510" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">completed 22%</text>
          <text x="1082" y="558" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">archived 17%</text>
        `
      });
    }
  },
  {
    id: "admin-users",
    title: "用户管理",
    kind: "desktop",
    filename: "11-admin-users.svg",
    render() {
      return desktopFrame({
        title: "用户管理",
        subtitle: "查看用户、活跃度与封禁状态",
        body: `
          <rect x="72" y="232" width="232" height="56" rx="18" fill="#2F6A52"/>
          <text x="126" y="268" fill="#fff" style="font:700 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">用户管理</text>
          <text x="84" y="190" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">数据统计</text>
          <text x="84" y="310" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板管理</text>
          <text x="84" y="352" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">系统配置</text>

          <rect x="364" y="154" width="1012" height="108" rx="28" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <rect x="398" y="186" width="344" height="44" rx="22" fill="#F4F6F1"/>
          <text x="430" y="214" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">搜索昵称 / openid / 当前计划</text>
          <rect x="1212" y="182" width="130" height="52" rx="26" fill="${colors.greenDeep}"/>
          <text x="1258" y="214" fill="#fff" style="font:700 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">筛选</text>

          <rect x="364" y="286" width="1012" height="604" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="398" y="334" fill="${colors.subtext}" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">昵称</text>
          <text x="620" y="334" fill="${colors.subtext}" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">当前计划</text>
          <text x="926" y="334" fill="${colors.subtext}" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">活跃度</text>
          <text x="1098" y="334" fill="${colors.subtext}" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">状态</text>
          <text x="1232" y="334" fill="${colors.subtext}" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">操作</text>

          <rect x="398" y="364" width="944" height="72" rx="18" fill="#F7F8F3"/>
          <text x="426" y="408" fill="${colors.text}" style="font:600 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">VC</text>
          <text x="620" y="408" fill="${colors.text}" style="font:600 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">AI 创作者陪跑营</text>
          <text x="926" y="408" fill="${colors.text}" style="font:600 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">近 7 天 6 次</text>
          <rect x="1098" y="382" width="78" height="34" rx="17" fill="#E7F6E7"/>
          <text x="1121" y="404" fill="${colors.greenDeep}" style="font:700 13px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">active</text>
          <rect x="1214" y="378" width="102" height="40" rx="20" fill="#203229"/>
          <text x="1243" y="403" fill="#fff" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">查看计划</text>

          <rect x="398" y="452" width="944" height="72" rx="18" fill="#FFF4F1"/>
          <text x="426" y="496" fill="${colors.text}" style="font:600 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">演示账号 A</text>
          <text x="620" y="496" fill="${colors.text}" style="font:600 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">独立开发复盘系统</text>
          <text x="926" y="496" fill="${colors.text}" style="font:600 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">近 7 天 0 次</text>
          <rect x="1098" y="470" width="82" height="34" rx="17" fill="#FCE0D8"/>
          <text x="1118" y="492" fill="#B65B42" style="font:700 13px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">banned</text>
          <rect x="1214" y="466" width="102" height="40" rx="20" fill="#F0D7CF"/>
          <text x="1249" y="491" fill="#8A4D3A" style="font:700 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">解封</text>
        `
      });
    }
  },
  {
    id: "admin-templates",
    title: "模板管理",
    kind: "desktop",
    filename: "12-admin-templates.svg",
    render() {
      return desktopFrame({
        title: "模板计划管理",
        subtitle: "第二阶段能力，沉淀官方模板供用户一键复制",
        body: `
          <rect x="72" y="274" width="232" height="56" rx="18" fill="#2F6A52"/>
          <text x="126" y="310" fill="#fff" style="font:700 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板管理</text>
          <text x="84" y="190" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">数据统计</text>
          <text x="84" y="232" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">用户管理</text>
          <text x="84" y="352" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">系统配置</text>

          <rect x="364" y="154" width="1012" height="118" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="398" y="206" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板策略</text>
          <text x="398" y="236" fill="${colors.subtext}" style="font:500 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板与用户计划一次性复制，不保持实时联动。</text>
          <rect x="1188" y="182" width="154" height="50" rx="25" fill="${colors.greenDeep}"/>
          <text x="1234" y="214" fill="#fff" style="font:700 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">创建官方模板</text>

          <rect x="364" y="300" width="486" height="274" rx="30" fill="#E7F6E7" filter="url(#deskShadow)"/>
          <text x="398" y="352" fill="${colors.greenDeep}" style="font:700 13px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">AI 创作者模板</text>
          <text x="398" y="398" fill="${colors.text}" style="font:700 28px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">从零验证 AI 内容产品</text>
          <text x="398" y="434" fill="${colors.subtext}" style="font:500 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">4 个阶段 · 24 个任务 · 默认权重 10</text>
          <rect x="398" y="478" width="94" height="36" rx="18" fill="#FFFDF8"/>
          <rect x="506" y="478" width="94" height="36" rx="18" fill="#FFFDF8"/>
          <rect x="614" y="478" width="94" height="36" rx="18" fill="#FFFDF8"/>
          <text x="426" y="501" fill="${colors.greenDeep}" style="font:700 13px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">内容</text>
          <text x="534" y="501" fill="${colors.greenDeep}" style="font:700 13px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">增长</text>
          <text x="636" y="501" fill="${colors.greenDeep}" style="font:700 13px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">MVP</text>

          <rect x="890" y="300" width="486" height="274" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="924" y="352" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板编辑器</text>
          <rect x="924" y="382" width="418" height="52" rx="18" fill="#F5F6F2"/>
          <rect x="924" y="448" width="418" height="112" rx="18" fill="#F5F6F2"/>

          <rect x="364" y="606" width="1012" height="284" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="398" y="654" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板列表</text>
          <text x="398" y="706" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">名称</text>
          <text x="786" y="706" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">阶段 / 任务</text>
          <text x="1082" y="706" fill="${colors.subtext}" style="font:600 14px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">状态</text>
        `
      });
    }
  },
  {
    id: "admin-settings",
    title: "系统配置",
    kind: "desktop",
    filename: "13-admin-settings.svg",
    render() {
      return desktopFrame({
        title: "系统配置",
        subtitle: "管理鉴权、封禁策略与基础运行参数",
        body: `
          <rect x="72" y="316" width="232" height="56" rx="18" fill="#2F6A52"/>
          <text x="126" y="352" fill="#fff" style="font:700 16px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">系统配置</text>
          <text x="84" y="190" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">数据统计</text>
          <text x="84" y="232" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">用户管理</text>
          <text x="84" y="274" fill="#748A80" style="font:600 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">模板管理</text>

          <rect x="364" y="154" width="486" height="352" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="398" y="206" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">鉴权与登录</text>
          <text x="398" y="246" fill="${colors.subtext}" style="font:500 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">JWT 有效期 7 天，失效后前端重新发起 wx.login</text>
          <rect x="398" y="286" width="410" height="56" rx="18" fill="#F5F6F2"/>
          <rect x="398" y="360" width="410" height="56" rx="18" fill="#F5F6F2"/>
          <rect x="398" y="434" width="160" height="50" rx="25" fill="${colors.greenDeep}"/>
          <text x="446" y="466" fill="#fff" style="font:700 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">保存配置</text>

          <rect x="890" y="154" width="486" height="352" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="924" y="206" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">封禁与风控</text>
          <text x="924" y="246" fill="${colors.subtext}" style="font:500 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">被封禁用户统一返回 403，首页与业务接口均不可访问。</text>
          <rect x="924" y="286" width="410" height="92" rx="18" fill="#FFF4F1"/>
          <rect x="924" y="396" width="410" height="92" rx="18" fill="#F5F6F2"/>

          <rect x="364" y="542" width="1012" height="348" rx="30" fill="#FFFDF8" stroke="${colors.border}" filter="url(#deskShadow)"/>
          <text x="398" y="590" fill="${colors.text}" style="font:700 22px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">运行说明</text>
          <text x="398" y="636" fill="${colors.subtext}" style="font:500 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">当前推荐技术：Vue3 + Element Plus 后台，Node.js + Express + MongoDB 服务端。</text>
          <text x="398" y="676" fill="${colors.subtext}" style="font:500 15px 'Avenir Next', 'PingFang SC', 'Noto Sans SC', sans-serif;">部署建议：腾讯云 COS、MongoDB Atlas、腾讯云轻量服务器。</text>
        `
      });
    }
  }
];

function renderIndex(items) {
  const cards = items
    .map((item) => {
      const width = item.kind === "mobile" ? 220 : 420;
      return `
        <article class="card">
          <div class="thumb thumb-${item.kind}">
            <img src="./${item.filename}" alt="${item.title}" width="${width}" />
          </div>
          <div class="meta">
            <p class="eyebrow">${item.kind === "mobile" ? "用户端" : "后台端"}</p>
            <h2>${item.title}</h2>
            <p>${item.caption}</p>
            <a href="./${item.filename}" target="_blank" rel="noreferrer">查看原图</a>
          </div>
        </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GoalFlow UI Mockups</title>
    <style>
      :root {
        --bg: #f6f3ea;
        --paper: rgba(255, 253, 248, 0.82);
        --text: #203229;
        --subtext: #66766b;
        --accent: #2f6a52;
        --line: #d9e3d4;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top right, #e0eee2 0, transparent 24%),
          radial-gradient(circle at bottom left, #f1e3d4 0, transparent 26%),
          linear-gradient(180deg, #f9f5ea 0%, #eef6ee 54%, #eef2f7 100%);
      }
      main {
        max-width: 1380px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      header {
        margin-bottom: 36px;
      }
      .tag {
        display: inline-block;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(47, 106, 82, 0.1);
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }
      h1 {
        margin: 18px 0 10px;
        font-size: clamp(34px, 5vw, 56px);
        line-height: 1.08;
      }
      header p {
        margin: 0;
        max-width: 760px;
        color: var(--subtext);
        font-size: 16px;
        line-height: 1.75;
      }
      .grid {
        display: grid;
        gap: 22px;
      }
      .card {
        display: grid;
        grid-template-columns: minmax(220px, 420px) 1fr;
        gap: 26px;
        align-items: center;
        padding: 24px;
        border: 1px solid rgba(217, 227, 212, 0.8);
        border-radius: 32px;
        background: var(--paper);
        backdrop-filter: blur(14px);
        box-shadow: 0 18px 50px rgba(48, 70, 54, 0.08);
      }
      .thumb {
        display: grid;
        place-items: center;
        padding: 18px;
        border-radius: 26px;
        background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(244,248,242,0.9));
      }
      .thumb-mobile { min-height: 430px; }
      .thumb-desktop { min-height: 320px; }
      img {
        width: 100%;
        height: auto;
        border-radius: 18px;
      }
      .meta h2 {
        margin: 8px 0 10px;
        font-size: 30px;
      }
      .meta p {
        margin: 0;
        color: var(--subtext);
        font-size: 15px;
        line-height: 1.7;
      }
      .meta a {
        display: inline-block;
        margin-top: 18px;
        color: var(--accent);
        font-weight: 700;
        text-decoration: none;
      }
      .eyebrow {
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      @media (max-width: 960px) {
        .card {
          grid-template-columns: 1fr;
        }
        .thumb-mobile,
        .thumb-desktop {
          min-height: auto;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <span class="tag">GoalFlow / UI Mockups</span>
        <h1>基于 PRD 的整套页面 UI 图</h1>
        <p>这套稿件覆盖了用户端核心链路和后台管理端关键页面，视觉方向遵循 PRD 里的“简约、轻盈、成长感、低压迫感”，以柔和绿色为主色，辅以蓝色进度与紫色成长氛围。</p>
      </header>
      <section class="grid">
        ${cards}
      </section>
    </main>
  </body>
</html>`;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const items = [];

  for (const page of pages) {
    const svg = page.render();
    await fs.writeFile(path.join(outputDir, page.filename), svg, "utf8");
    items.push({
      ...page,
      caption:
        page.kind === "mobile"
          ? "面向微信小程序的高保真页面稿，强调卡片式布局、渐变背景和低压迫感。"
          : "面向后台管理系统的桌面稿，强调信息密度、状态识别和管理动作。"
    });
  }

  await fs.writeFile(path.join(outputDir, "index.html"), renderIndex(items), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
