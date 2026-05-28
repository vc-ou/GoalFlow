# AI创作者目标推进系统

# 微信小程序产品需求文档（V1.1）

---

# 一、项目概述

## 1.1 项目名称

成长薄

---

## 1.2 产品定位

本产品是：

# “目标驱动型成长管理工具”

而不是：

* 日历工具
* 打卡工具
* 时间管理工具
* 传统待办工具

系统核心逻辑：

```text
目标 -> 阶段 -> 行动 -> 结果
```

适用于：

* AI创作者
* 独立开发者
* 自由职业者
* 项目驱动型人格
* 非固定作息用户

---

# 二、核心产品逻辑

## 2.1 非时间驱动

系统：

# 不基于日期推进任务

例如：

错误逻辑：

```text
今天第几天
今日打卡
连续签到
```

正确逻辑：

```text
距离目标还差多少
当前推进到哪个阶段
还有哪些关键任务
```

---

## 2.2 核心推进模型

系统采用：

# “目标权重推进模型”

即：

```text
任务完成
-> 阶段推进
-> 总目标推进
```

总进度唯一公式：

```text
已完成任务权重总和
/
未删除任务权重总和
```

阶段进度唯一公式：

```text
阶段内已完成任务权重总和
/
阶段内未删除任务权重总和
```

说明：

* V1 只采用任务权重推进
* V1 不采用阶段权重推进
* 所有进度在任务状态变化后实时重算

---

## 2.3 时间性模块例外

系统整体不按日期推进。

唯一例外是：

# 明日代办

它的定位是：

* 次日意向清单
* 临时备忘区
* 不属于正式任务系统

它不是：

* 计划任务
* 进度输入项
* 长期待办清单

---

# 三、系统角色

## 3.1 普通用户

权限：

* 创建计划
* 设置当前计划
* 创建和管理阶段
* 创建和管理任务
* 查看首页聚合信息
* 管理明日代办
* 提交和查看复盘
* 查看个人统计

---

## 3.2 管理员

权限：

* 管理员账号密码登录
* 用户管理
* 模板管理
* 数据统计
* 系统配置

说明：

* 小程序用户与后台管理员使用两套独立登录体系

---

# 四、功能模块

## 4.1 微信授权登录

### 功能说明

用户通过微信授权进入系统。

### 登录方式

* 微信一键授权登录

### 登录流程

```text
用户点击登录
-> 微信授权
-> 获取 code
-> 后端换取 openid
-> 创建或绑定用户
-> 生成 token
-> 前端缓存登录态
```

### 登录规则

* 小程序 token 使用 JWT
* token 有效期为 7 天
* token 失效后前端重新发起 `wx.login`
* 若用户状态为 `banned`，业务接口统一返回 `403`

### 用户字段

| 字段 | 类型 |
| --- | --- |
| openid | string |
| nickname | string |
| avatar | string |
| current_plan_id | string \| null |
| status | enum |
| token | string |

---

## 4.2 首页（核心页面）

### 页面目标

用户打开后，一眼看到：

```text
我当前最重要的目标
我推进到了哪里
我下一步该做什么
```

### 1. 当前目标模块

显示：

| 内容 |
| --- |
| 当前目标名称 |
| 当前阶段 |
| 总进度 |
| 激励文案 |

当前目标规则：

* 同一时刻一个用户只能有一个当前计划
* 首页优先展示 `current_plan_id` 对应计划
* 若 `current_plan_id` 为空且用户只有 1 个未归档计划，系统自动使用该计划
* 若 `current_plan_id` 为空且用户有多个未归档计划，首页提示用户选择当前计划
* 已归档计划和已删除计划不能作为当前计划

UI 要求：

* 大卡片设计
* 顶部展示
* 进度条动态动画
* 柔和渐变背景

### 2. 当前执行任务模块

模块定位：

```text
现在推进
```

页面需要直接回答：

```text
我现在推进到哪个阶段
我下一步具体该做什么
去哪里做
用什么关键词
做到什么结果算完成
```

显示：

* 当前阶段名称
* 下一步行动
* 平台
* 关键词
* 完成标准
* 推荐任务列表

首页结构：

* `现在推进`：显示当前计划、当前阶段、阶段进度
* `下一步行动`：只显示 1 个主行动
* `推荐任务列表`：显示其他可继续推进的任务

支持：

* 勾选完成
* 修改状态
* 快速进入详情

任务状态：

```text
todo
doing
done
```

下一步行动规则：

* 只在当前阶段内选择
* 优先最早进入 `doing` 的未完成任务
* 若没有 `doing`，则选择最高优先级未完成任务
* 若仍并列，则按 `sort_order` 升序
* 若 `sort_order` 相同，则按 `updated_at` 倒序
* 若当前阶段已无未完成任务，则 `下一步行动` 为空

推荐任务列表排序规则：

* `doing` 优先
* 其次 `high` 优先级未完成任务
* 再次其他未完成任务
* 同类任务按 `sort_order` 升序
* 若 `sort_order` 相同，则按 `updated_at` 倒序

完成反馈：

* 卡片渐变
* 勾选动画
* 进度增长动画
* 轻提示：

```text
你离目标更近一步
```

### 3. 明日代办模块

模块定位：

```text
明天特别想做的事情
```

它是：

* 主观强意愿记录区
* 次日意向清单
* 备忘性质补充模块

它不是：

* 正式任务
* 计划组成部分
* 进度来源

与正式任务区别：

| 正式任务 | 明日代办 |
| --- | --- |
| 属于计划 | 不属于计划 |
| 影响进度 | 不影响进度 |
| 有权重 | 无权重 |
| 长期目标 | 次日意向 |

支持：

* 快速输入
* 勾选完成
* 长按删除
* 拖拽排序

生命周期规则：

* 用户在自然日 D 创建条目
* 该条目的 `target_date` 固定为 D+1
* 条目仅在 D+1 当天展示
* 到 D+2 0:00 后自动清空
* 自动清空不影响任何计划和任务

UI 设计：

* 更轻
* 更柔和
* 类似便签

输入引导：

```text
明天特别想做什么？
```

### 4. 最近成果模块

显示：

* 最近完成任务
* 完成时间

产品目标：

* 强化成长感
* 避免任务压力

说明：

* V1 不实现徽章系统
* 徽章能力仅作为后续扩展预留

---

## 4.3 计划管理系统

### 计划结构

```text
计划
-> 阶段
-> 任务
```

### 创建计划

页面字段：

| 字段 | 类型 |
| --- | --- |
| 计划名称 | string |
| 最终目标 | text |
| 封面颜色 | enum |
| 标签 | array |
| 阶段列表 | array |

计划状态：

```text
active
archived
completed
```

说明：

* 删除采用软删除
* 软删除通过 `deleted_at` 表示
* 已删除计划不再出现在首页、列表和统计中

### 编辑计划

支持：

* 修改计划
* 删除计划
* 归档计划
* 设为当前计划

### 计划详情页

显示：

* 计划名称
* 当前阶段
* 总进度
* 阶段列表
* 任务列表
* 已完成任务

### 阶段模块

字段：

| 字段 | 类型 |
| --- | --- |
| 阶段名称 | string |
| 描述 | text |
| 排序值 | number |

规则：

* 阶段只负责结构组织和展示顺序
* 阶段不参与总进度加权
* 当前阶段定义为第一个仍有未完成任务的阶段
* 如果所有阶段均完成，则当前阶段为空

### 任务模块

字段：

| 字段 | 类型 |
| --- | --- |
| 任务名称 | string |
| 描述 | text |
| 执行平台 | array |
| 搜索关键词 | array |
| 完成标准 | text |
| 权重 | number |
| 状态 | enum |
| 优先级 | enum |
| 标签 | array |
| 备注 | text |
| 排序值 | number |

字段语义：

* `描述`：记录怎么做
* `执行平台`：记录去哪里做，如 `Reddit / YouTube / TikTok`
* `搜索关键词`：记录应该搜索的词
* `完成标准`：记录做到什么结果算完成
* `备注`：只存补充说明，不承载首页主语义

权重规则：

* 所有任务默认权重为 `10`
* 用户可手动修改
* 权重必须为正数

状态流转规则：

* 允许 `todo -> doing`
* 允许 `doing -> done`
* 允许 `todo -> done`
* 允许 `done -> doing`
* 允许 `doing -> todo`
* 允许 `done -> todo`

优先级规则：

```text
low
normal
high
```

默认值：

```text
normal
```

---

## 4.4 复盘系统

### 页面目标

帮助用户：

```text
从执行走向成长
```

### 页面字段

| 字段 | 类型 |
| --- | --- |
| 今日收获 | text |
| 遇到的问题 | text |
| 新想法 | text |
| 下一步行动 | text |
| 关联计划 | string \| null |

### 功能

支持：

* 新建复盘
* 查看历史复盘
* 编辑复盘
* 删除复盘

规则：

* 复盘属于用户
* 可选关联当前计划
* 同一天允许创建多条复盘
* 历史列表按 `created_at` 倒序
* 复盘不参与进度计算

---

## 4.5 我的页面

### 页面内容

显示：

* 用户头像
* 用户昵称
* 当前目标数
* 已完成任务数
* 累计复盘数

统计口径：

* 当前目标数 = `status=active` 且未删除的计划数
* 已完成任务数 = 未删除且 `status=done` 的任务数
* 累计复盘数 = 未删除复盘总数

### 功能

支持：

* 设置
* 退出登录
* 清理缓存

---

# 五、进度系统

## 5.1 系统本质

本系统：

* 不按日期推进
* 只按目标推进

---

## 5.2 总进度计算

公式：

```text
sum(done task weight)
/
sum(all non-deleted task weight)
```

规则：

* 任务删除后不再参与分母和分子
* 任务状态回退后进度实时回退
* 若计划下无任务，则总进度记为 `0`

---

## 5.3 阶段进度计算

公式：

```text
sum(done task weight in milestone)
/
sum(all non-deleted task weight in milestone)
```

规则：

* 若阶段下无任务，则阶段进度记为 `0`
* 阶段进度只用于阶段展示

---

## 5.4 UI 表现

显示：

* 百分比
* 动态进度条
* 阶段完成情况
* 已完成任务数量

---

# 六、UI 设计规范

## 6.1 UI 关键词

```text
简约
轻盈
成长感
呼吸感
低压迫感
```

---

## 6.2 视觉风格

主色：

* 柔和绿色

辅助色：

| 颜色 | 含义 |
| --- | --- |
| 紫色 | 成长 |
| 黄色 | 奖励预留 |
| 蓝色 | 进度 |

---

## 6.3 页面设计

统一规则：

* 大圆角
* 卡片式布局
* 微阴影
* 大留白
* 柔和渐变

---

## 6.4 动效设计

支持：

* 勾选动画
* 进度增长动画
* 完成庆祝动画
* 页面柔和切换

说明：

* 动效属于第二阶段优化项

---

# 七、后台管理系统

## 7.1 管理后台技术

推荐：

```text
Vue3 + Element Plus
```

---

## 7.2 登录系统

管理员账号密码登录。

---

## 7.3 用户管理

功能：

* 查看用户
* 搜索用户
* 查看用户计划
* 查看用户活跃度
* 封禁用户

封禁规则：

* 被封禁用户状态变为 `banned`
* 被封禁用户调用业务接口返回 `403`

---

## 7.4 模板计划管理

管理员可：

* 创建官方模板
* 修改模板
* 删除模板

说明：

* 模板计划属于第二阶段
* 用户从模板创建计划时采用一次性复制
* 模板与用户计划之间不保持实时联动

---

## 7.5 数据统计

统计：

| 数据 | 口径 |
| --- | --- |
| DAU | 自然日内至少一次成功鉴权业务请求的去重用户数 |
| WAU | 最近 7 天去重活跃用户数 |
| 计划数量 | 未删除计划总数 |
| 平均完成率 | 未删除计划 `progress` 平均值 |
| 用户留存 | 先统计 D1 和 D7 留存 |

---

# 八、数据库设计

## 8.1 用户表 users

| 字段 | 类型 |
| --- | --- |
| id | string |
| openid | string |
| nickname | string |
| avatar | string |
| current_plan_id | string \| null |
| status | string |
| created_at | datetime |
| updated_at | datetime |

---

## 8.2 计划表 plans

| 字段 | 类型 |
| --- | --- |
| id | string |
| user_id | string |
| title | string |
| goal | text |
| cover_color | string |
| tags | array |
| progress | number |
| status | string |
| created_at | datetime |
| updated_at | datetime |
| deleted_at | datetime \| null |

---

## 8.3 阶段表 milestones

| 字段 | 类型 |
| --- | --- |
| id | string |
| plan_id | string |
| title | string |
| description | text |
| sort_order | number |
| created_at | datetime |
| updated_at | datetime |
| deleted_at | datetime \| null |

---

## 8.4 任务表 tasks

| 字段 | 类型 |
| --- | --- |
| id | string |
| plan_id | string |
| milestone_id | string |
| title | string |
| description | text |
| weight | number |
| status | string |
| priority | string |
| tags | array |
| remark | text |
| sort_order | number |
| completed_at | datetime \| null |
| created_at | datetime |
| updated_at | datetime |
| deleted_at | datetime \| null |

---

## 8.5 明日代办表 tomorrow_todos

| 字段 | 类型 |
| --- | --- |
| id | string |
| user_id | string |
| content | text |
| status | string |
| target_date | date |
| sort_order | number |
| completed_at | datetime \| null |
| created_at | datetime |

---

## 8.6 复盘表 reviews

| 字段 | 类型 |
| --- | --- |
| id | string |
| user_id | string |
| plan_id | string \| null |
| gains | text |
| problems | text |
| ideas | text |
| next_actions | text |
| created_at | datetime |
| updated_at | datetime |
| deleted_at | datetime \| null |

---

# 九、接口设计（RESTful）

## 9.1 用户

| 接口 | 方法 |
| --- | --- |
| /api/login | POST |
| /api/user/info | GET |

---

## 9.2 首页

| 接口 | 方法 |
| --- | --- |
| /api/home | GET |

---

## 9.3 计划

| 接口 | 方法 |
| --- | --- |
| /api/plans | GET |
| /api/plans | POST |
| /api/plans/:id | GET |
| /api/plans/:id | PUT |
| /api/plans/:id | DELETE |
| /api/plans/:id/current | PATCH |
| /api/plans/:id/status | PATCH |

---

## 9.4 阶段

| 接口 | 方法 |
| --- | --- |
| /api/milestones | POST |
| /api/milestones/:id | PUT |
| /api/milestones/:id | DELETE |

---

## 9.5 任务

| 接口 | 方法 |
| --- | --- |
| /api/tasks | GET |
| /api/tasks/:id | GET |
| /api/tasks | POST |
| /api/tasks/:id | PUT |
| /api/tasks/:id/status | PATCH |
| /api/tasks/:id | DELETE |

说明：

* `GET /api/tasks` 支持按 `plan_id`、`milestone_id`、`status` 过滤

---

## 9.6 明日代办

| 接口 | 方法 |
| --- | --- |
| /api/tomorrow-todos | GET |
| /api/tomorrow-todos | POST |
| /api/tomorrow-todos/:id | PATCH |
| /api/tomorrow-todos/:id | DELETE |
| /api/tomorrow-todos/reorder | PATCH |

---

## 9.7 复盘

| 接口 | 方法 |
| --- | --- |
| /api/reviews | GET |
| /api/reviews | POST |
| /api/reviews/:id | PUT |
| /api/reviews/:id | DELETE |

---

# 十、技术方案

## 10.1 前端

推荐：

```text
UniApp
```

说明：

* V1 验收范围仅限微信小程序
* H5 和 APP 仅作为后续可扩展能力，不纳入当前交付

---

## 10.2 后端

推荐：

```text
Node.js
Express
MongoDB
```

---

## 10.3 部署

推荐：

| 服务 | 推荐 |
| --- | --- |
| 对象存储 | 腾讯云 COS |
| 数据库 | MongoDB Atlas |
| 服务部署 | 腾讯云轻量服务器 |

---

# 十一、MVP 开发优先级

## 第一阶段（必须）

用户端：

* 微信登录
* 首页聚合接口
* 创建计划
* 设置当前计划
* 创建阶段
* 创建任务
* 任务完成与状态回退
* 进度计算
* 明日代办

后台与服务端：

* 基础用户管理
* 用户封禁
* 基础统计

---

## 第二阶段

* 复盘系统
* 动效
* 模板计划
* 管理后台完善

---

## 第三阶段

* AI 辅助生成计划
* AI 任务拆解
* AI 复盘总结
* AI 成长建议

---

# 十二、产品核心价值

这个产品本质不是：

```text
管理时间
```

而是：

```text
推进人生目标
```

用户获得的不是：

```text
今天完成了几个待办
```

而是：

```text
我正在越来越接近我想成为的人
```
