import { MilestoneModel } from "../models/milestone.js";
import { PlanModel } from "../models/plan.js";
import { TaskModel } from "../models/task.js";
import { TomorrowTodoModel } from "../models/tomorrow-todo.js";
import { UserModel } from "../models/user.js";
import { recalculatePlanProgress } from "../services/plan-service.js";
import { getTomorrowLocalDateKey } from "../utils/local-date.js";

export async function seedDemoData() {
  const user = await UserModel.findOneAndUpdate(
    { openid: "dev_demo" },
    {
      nickname: "GoalFlow Demo",
      avatar: "",
      status: "active"
    },
    { upsert: true, new: true }
  );

  await Promise.all([
    PlanModel.deleteMany({ user_id: String(user._id) }),
    MilestoneModel.deleteMany({ plan_id: { $in: await listPlanIds(String(user._id)) } }),
    TaskModel.deleteMany({ plan_id: { $in: await listPlanIds(String(user._id)) } }),
    TomorrowTodoModel.deleteMany({ user_id: String(user._id) })
  ]);

  const plan = await PlanModel.create({
    user_id: String(user._id),
    title: "AI 创作者成长路径",
    goal: "从 AI 对话走向持续输出",
    cover_color: "green",
    tags: ["AI", "Creator"],
    progress: 0,
    status: "active"
  });

  const [milestone1, milestone2] = await MilestoneModel.insertMany([
    {
      plan_id: String(plan._id),
      title: "用 AI 扫描国际市场",
      description: "收集真实需求和高频场景",
      sort_order: 1
    },
    {
      plan_id: String(plan._id),
      title: "做出第一版样板内容",
      description: "验证内容方向和表达方式",
      sort_order: 2
    }
  ]);

  await TaskModel.insertMany([
    {
      plan_id: String(plan._id),
      milestone_id: String(milestone1._id),
      title: "去平台收集需求",
      description: "在平台搜索真实问题并记录下来",
      execution_platforms: ["Reddit", "YouTube", "TikTok"],
      search_keywords: ["coaches AI workflow", "course creator conversion"],
      completion_criteria: "记录 10 个真实需求",
      weight: 20,
      status: "doing",
      status_changed_at: new Date(Date.now() - 60 * 60 * 1000),
      priority: "high",
      tags: ["海外需求"],
      remark: "",
      sort_order: 1
    },
    {
      plan_id: String(plan._id),
      milestone_id: String(milestone1._id),
      title: "整理需求清单",
      description: "把收集到的问题归类成 3 个机会方向",
      execution_platforms: ["Notion"],
      search_keywords: ["pain point clustering"],
      completion_criteria: "输出 3 个机会主题",
      weight: 10,
      status: "todo",
      priority: "normal",
      tags: ["整理"],
      remark: "",
      sort_order: 2
    },
    {
      plan_id: String(plan._id),
      milestone_id: String(milestone2._id),
      title: "写第一条内容脚本",
      description: "针对最强需求写一条短内容脚本",
      execution_platforms: ["Notion"],
      search_keywords: ["hook script framework"],
      completion_criteria: "完成 1 版脚本",
      weight: 10,
      status: "todo",
      priority: "normal",
      tags: ["内容"],
      remark: "",
      sort_order: 1
    }
  ]);

  const tomorrow = getTomorrowLocalDateKey();

  await TomorrowTodoModel.create({
    user_id: String(user._id),
    content: "明天把 10 个需求归类成 3 个方向",
    status: "todo",
    target_date: tomorrow,
    sort_order: 1
  });

  user.current_plan_id = String(plan._id);
  await user.save();
  await recalculatePlanProgress(String(plan._id));

  return user;
}

async function listPlanIds(userId: string) {
  const plans = await PlanModel.find({ user_id: userId }).select("_id").lean();
  return plans.map((plan) => String(plan._id));
}
