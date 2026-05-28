# GoalFlow 开发规格说明（V1）

本文档用于补足接口契约、核心行为与实现口径，供前后端与测试直接使用。

---

# 一、范围说明

V1 只覆盖：

* 微信小程序用户端
* Node.js + Express + MongoDB 后端
* 首页聚合接口
* 计划、阶段、任务、明日代办、复盘的基础 CRUD
* 管理员独立登录与基础封禁能力

V1 不覆盖：

* 徽章系统
* AI 功能
* 模板中心用户入口
* H5 与 APP 发布

---

# 二、核心枚举

## 2.1 用户状态

```ts
type UserStatus = "active" | "banned";
```

## 2.2 计划状态

```ts
type PlanStatus = "active" | "archived" | "completed";
```

## 2.3 任务状态

```ts
type TaskStatus = "todo" | "doing" | "done";
```

## 2.4 任务优先级

```ts
type TaskPriority = "low" | "normal" | "high";
```

## 2.5 明日代办状态

```ts
type TomorrowTodoStatus = "todo" | "done";
```

---

# 三、数据模型

## 3.1 users

```ts
interface User {
  id: string;
  openid: string;
  nickname: string;
  avatar: string;
  current_plan_id: string | null;
  status: "active" | "banned";
  created_at: string;
  updated_at: string;
}
```

## 3.2 plans

```ts
interface Plan {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  cover_color: string;
  tags: string[];
  progress: number;
  status: "active" | "archived" | "completed";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

## 3.3 milestones

```ts
interface Milestone {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

## 3.4 tasks

```ts
interface Task {
  id: string;
  plan_id: string;
  milestone_id: string;
  title: string;
  description: string;
  execution_platforms: string[];
  search_keywords: string[];
  completion_criteria: string;
  weight: number;
  status: "todo" | "doing" | "done";
  priority: "low" | "normal" | "high";
  tags: string[];
  remark: string;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

## 3.5 tomorrow_todos

```ts
interface TomorrowTodo {
  id: string;
  user_id: string;
  content: string;
  status: "todo" | "done";
  target_date: string;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
}
```

## 3.6 reviews

```ts
interface Review {
  id: string;
  user_id: string;
  plan_id: string | null;
  gains: string;
  problems: string;
  ideas: string;
  next_actions: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

---

# 四、关键业务规则

## 4.1 当前计划判定

规则顺序：

1. 若 `users.current_plan_id` 有值，且对应计划未删除且状态不是 `archived`，则它是首页当前计划。
2. 若 `users.current_plan_id` 为空，且用户只有 1 个未删除且未归档计划，则系统自动选中该计划作为当前计划，并回写 `current_plan_id`。
3. 若 `users.current_plan_id` 为空，且用户有多个未删除且未归档计划，则首页返回 `needs_plan_selection=true`。
4. 若当前计划被归档或删除，则清空 `current_plan_id` 后重新执行以上规则。

## 4.2 计划进度重算

触发场景：

* 新建任务
* 更新任务权重
* 更新任务状态
* 删除任务
* 删除阶段内任务

公式：

```text
progress = sum(done task weight) / sum(all non-deleted task weight)
```

约束：

* 若分母为 0，进度返回 `0`
* 建议在服务层统一重算，不依赖前端上传进度

## 4.3 当前阶段判定

规则：

* 按 `milestones.sort_order asc` 遍历阶段
* 找到第一个存在未删除且 `status != done` 任务的阶段
* 该阶段即当前阶段
* 若不存在，则当前阶段为空

## 4.4 任务排序

首页任务推荐排序键：

1. `status=doing`
2. `priority=high AND status!=done`
3. `status in (todo, doing) AND priority in (low, normal)`
4. `sort_order asc`
5. `updated_at desc`

说明：

* 多个 `doing` 任务允许同时存在
* `done` 任务不出现在推荐列表

## 4.5 下一步行动判定

规则：

* 只在当前阶段内选择
* 优先选择 `status=doing` 的未完成任务
* 若存在多个 `doing`，按 `sort_order asc, updated_at desc` 取第 1 个
* 若不存在 `doing`，则在当前阶段的未完成任务里按 `priority` 从高到低选择
* 若优先级相同，则按 `sort_order asc, updated_at desc` 取第 1 个
* 若当前阶段不存在未完成任务，则 `next_action = null`

说明：

* `recommended_tasks` 用于展示可推进任务列表
* `next_action` 用于回答首页“下一步该做什么”
* 二者不可简单等同为同一个排序结果的第 1 项

## 4.6 明日代办生命周期

规则：

* 用户在日期 D 创建条目时，`target_date = D + 1`
* `GET /api/tomorrow-todos` 只返回 `target_date = today` 的条目
* 到 `target_date + 1` 的 0:00 后，条目视为过期
* 过期条目可通过定时任务物理删除，或在每次读取前清理 `target_date < today` 的数据

## 4.7 软删除

规则：

* `plans`、`milestones`、`tasks`、`reviews` 使用软删除
* 明日代办使用物理删除
* 所有列表、统计、首页聚合默认排除 `deleted_at != null` 数据

---

# 五、接口契约

统一要求：

* 所有业务接口要求携带用户 token
* 返回 JSON
* 错误返回至少包含 `code` 和 `message`

## 5.1 POST /api/login

请求：

```json
{
  "code": "wx-login-code"
}
```

响应：

```json
{
  "token": "jwt-token",
  "user": {
    "id": "u_1",
    "nickname": "小王",
    "avatar": "https://example.com/avatar.png",
    "current_plan_id": null,
    "status": "active"
  }
}
```

## 5.2 GET /api/home

响应：

```json
{
  "needs_plan_selection": false,
  "current_plan": {
    "id": "p_1",
    "title": "AI 创作者起步计划",
    "goal": "发布第一轮内容",
    "cover_color": "green",
    "progress": 0.35,
    "status": "active"
  },
  "current_milestone": {
    "id": "m_1",
    "title": "内容准备阶段",
    "progress": 0.4
  },
  "now_progressing": {
    "plan_id": "p_1",
    "plan_title": "AI 创作者起步计划",
    "milestone_id": "m_1",
    "milestone_title": "内容准备阶段",
    "plan_progress": 0.35,
    "milestone_progress": 0.4
  },
  "next_action": {
    "id": "t_1",
    "title": "去平台收集需求",
    "description": "在平台搜索真实问题并记录",
    "execution_platforms": ["Reddit", "YouTube", "TikTok"],
    "search_keywords": ["coaches AI workflow", "course creator conversion"],
    "completion_criteria": "记录 10 个真实需求",
    "status": "doing",
    "priority": "high",
    "weight": 20
  },
  "recommended_tasks": [
    {
      "id": "t_1",
      "title": "输出 10 个选题",
      "status": "doing",
      "priority": "high",
      "weight": 20
    }
  ],
  "tomorrow_todos": [
    {
      "id": "tt_1",
      "content": "明晚录一条短视频",
      "status": "todo",
      "target_date": "2026-05-27",
      "sort_order": 1
    }
  ],
  "recent_completed_tasks": [
    {
      "id": "t_9",
      "title": "完成账号定位",
      "completed_at": "2026-05-26T10:00:00.000Z"
    }
  ]
}
```

行为：

* `now_progressing` 用于首页顶部“现在推进”卡片
* `next_action` 用于首页“下一步行动”卡片
* `recommended_tasks` 继续返回推荐任务列表，但不作为 `next_action` 的唯一来源
* `tomorrow_todos` 只作临时备忘，不参与 `current_milestone`、`now_progressing`、`next_action` 判定

## 5.3 GET /api/plans

行为：

* 仅返回当前用户未删除计划
* 默认按 `updated_at desc` 排序

## 5.4 POST /api/plans

请求：

```json
{
  "title": "AI 创作者起步计划",
  "goal": "发布首轮内容",
  "cover_color": "green",
  "tags": ["AI", "内容"],
  "milestones": [
    {
      "title": "准备阶段",
      "description": "选题和定位",
      "sort_order": 1
    }
  ]
}
```

行为：

* 创建计划时初始化 `progress=0`
* 若用户当前没有可用当前计划，可自动将新计划设为当前计划

## 5.5 PATCH /api/plans/:id/current

请求：

```json
{
  "is_current": true
}
```

行为：

* 将用户 `current_plan_id` 更新为该计划 ID
* 目标计划必须属于当前用户，且未删除且不是 `archived`

## 5.6 PATCH /api/plans/:id/status

请求：

```json
{
  "status": "archived"
}
```

行为：

* 只允许更新为 `active | archived | completed`
* 若归档的是当前计划，需要清空 `current_plan_id`

## 5.7 POST /api/tasks

请求：

```json
{
  "plan_id": "p_1",
  "milestone_id": "m_1",
  "title": "输出 10 个选题",
  "description": "",
  "execution_platforms": ["Reddit"],
  "search_keywords": ["coaches AI workflow"],
  "completion_criteria": "记录 10 个真实需求",
  "weight": 20,
  "priority": "high",
  "tags": [],
  "remark": "",
  "sort_order": 1
}
```

行为：

* 默认 `status=todo`
* 默认 `priority=normal`
* `description` 记录怎么做
* `execution_platforms` 记录去哪里做
* `search_keywords` 记录应该搜索的词
* `completion_criteria` 记录做到什么结果算完成
* `remark` 仅记录补充说明
* 成功后触发计划进度重算

## 5.8 GET /api/tasks/:id

响应：

```json
{
  "id": "t_1",
  "plan_id": "p_1",
  "milestone_id": "m_1",
  "title": "去平台收集需求",
  "description": "在平台搜索真实问题并记录",
  "execution_platforms": ["Reddit", "YouTube", "TikTok"],
  "search_keywords": ["coaches AI workflow", "course creator conversion"],
  "completion_criteria": "记录 10 个真实需求",
  "weight": 20,
  "status": "doing",
  "priority": "high",
  "tags": ["海外需求"],
  "remark": "",
  "sort_order": 1
}
```

行为：

* 仅允许读取当前用户所属任务
* 默认排除 `deleted_at != null` 任务

## 5.9 PUT /api/tasks/:id

请求：

```json
{
  "title": "去平台收集需求",
  "description": "在平台搜索真实问题并记录",
  "execution_platforms": ["Reddit", "YouTube", "TikTok"],
  "search_keywords": ["coaches AI workflow", "course creator conversion"],
  "completion_criteria": "记录 10 个真实需求",
  "weight": 20,
  "priority": "high",
  "tags": ["海外需求"],
  "remark": "",
  "sort_order": 1
}
```

行为：

* 仅允许更新当前用户所属任务
* 若更新 `weight`，成功后触发计划进度重算
* 不允许通过该接口直接修改 `status`

## 5.10 PATCH /api/tasks/:id/status

请求：

```json
{
  "status": "done"
}
```

行为：

* 校验目标状态属于允许枚举
* 若变为 `done`，写入 `completed_at`
* 若从 `done` 回退，清空 `completed_at`
* 成功后触发计划进度重算

## 5.11 GET /api/tomorrow-todos

行为：

* 读取前先清理当前用户 `target_date < today` 的条目
* 仅返回 `target_date = today` 的条目
* 按 `sort_order asc, created_at asc` 排序

## 5.12 POST /api/tomorrow-todos

请求：

```json
{
  "content": "明早写 landing page 文案"
}
```

行为：

* 服务端根据用户当地自然日计算 `target_date`
* 新增条目默认 `status=todo`
* 新增条目默认追加到当前排序末尾

## 5.13 PATCH /api/tomorrow-todos/reorder

请求：

```json
{
  "items": [
    { "id": "tt_1", "sort_order": 1 },
    { "id": "tt_2", "sort_order": 2 }
  ]
}
```

行为：

* 仅允许更新当前用户、当前展示日的条目

## 5.14 GET /api/reviews

行为：

* 仅返回当前用户未删除复盘
* 按 `created_at desc` 排序
* 可支持 `plan_id` 过滤

---

# 六、统计口径

## 6.1 DAU

定义：

* 自然日内至少一次成功通过鉴权并命中业务接口的去重用户数

## 6.2 WAU

定义：

* 截止统计日向前 7 天内的去重活跃用户数

## 6.3 平均完成率

定义：

* 所有未删除计划 `progress` 的平均值

## 6.4 用户留存

定义：

* D1 留存：注册次日仍活跃的用户占注册当日新增用户比例
* D7 留存：注册后第 7 天仍活跃的用户占注册当日新增用户比例

---

# 七、测试清单

## 7.1 当前计划

* 无计划时首页返回空状态
* 单未归档计划时自动成为当前计划
* 多计划且未设置当前计划时返回选择提示
* 当前计划归档后首页自动回退到可选计划或空状态

## 7.2 进度

* 新增任务后分母变化正确
* 完成任务后进度增加正确
* 已完成任务回退后进度回退正确
* 删除任务后分母与进度同步更新

## 7.3 首页聚合

* 当前阶段正确定位到第一个仍有未完成任务的阶段
* `next_action` 优先选择当前阶段内最早的 `doing` 任务
* 无 `doing` 时，`next_action` 正确回退到最高优先级未完成任务
* 多个 `doing` 并列时，`next_action` 按 `sort_order asc, updated_at desc` 稳定选择
* 当前阶段全部完成后，`next_action` 返回 `null`
* `tomorrow_todos` 不影响 `current_milestone`、`now_progressing`、`next_action`

## 7.4 任务行动字段

* 新建任务时 `execution_platforms`、`search_keywords`、`completion_criteria` 正确写入
* 获取任务详情时结构化行动字段完整返回
* 更新任务时结构化行动字段可被正确修改
* 行动字段为空时首页返回空数组或空字符串，不报错

## 7.5 明日代办

* D 日创建条目，当天列表不可见
* D+1 列表可见
* D+2 自动清空
* 勾选完成后 `completed_at` 正确写入
* 拖拽排序后读取顺序稳定

## 7.6 复盘

* 同一天创建多条复盘成功
* 复盘可带计划关联，也可为空
* 列表按创建时间倒序返回

## 7.7 权限

* token 过期后请求失败并要求重新登录
* 被封禁用户访问业务接口收到 `403`
* 管理员登录逻辑不影响小程序用户接口
