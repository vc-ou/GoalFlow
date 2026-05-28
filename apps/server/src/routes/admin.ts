import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { requireAdminAuth } from "../middleware/admin-auth.js";
import { PlanModel } from "../models/plan.js";
import { MilestoneModel } from "../models/milestone.js";
import { ReviewModel } from "../models/review.js";
import { TaskModel } from "../models/task.js";
import { TemplatePlanModel } from "../models/template-plan.js";
import { UserModel } from "../models/user.js";
import { asyncHandler } from "../utils/async-handler.js";
import type { PlanDocument } from "../models/plan.js";
import type { TemplatePlanDocument } from "../models/template-plan.js";
import type { UserDocument } from "../models/user.js";

type LeanEntity<T> = T & { _id: unknown };

export const adminRouter = Router();

adminRouter.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      res.status(401).json({ code: "ADMIN_LOGIN_FAILED", message: "Invalid admin credentials" });
      return;
    }

    const token = jwt.sign({ role: "admin", username }, env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, admin: { username } });
  })
);

adminRouter.use("/admin", requireAdminAuth);

adminRouter.get(
  "/admin/users",
  asyncHandler(async (req, res) => {
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
    const filter = keyword
      ? {
          $or: [
            { nickname: { $regex: keyword, $options: "i" } },
            { openid: { $regex: keyword, $options: "i" } }
          ]
        }
      : {};

    const users = await UserModel.find(filter).sort({ created_at: -1 }).limit(100).lean<LeanEntity<UserDocument>[]>();
    const userIds = users.map((user) => String(user._id));
    const plans = await PlanModel.find({ user_id: { $in: userIds }, deleted_at: null }).lean<LeanEntity<PlanDocument>[]>();
    const activeAtByUser = await TaskModel.aggregate<{ _id: string; last_active_at: Date }>([
      { $match: { deleted_at: null } },
      { $lookup: { from: "plans", localField: "plan_id", foreignField: "_id", as: "plan" } },
      { $unwind: "$plan" },
      { $match: { "plan.user_id": { $in: userIds } } },
      { $group: { _id: "$plan.user_id", last_active_at: { $max: "$updated_at" } } }
    ]);

    const activeMap = new Map(activeAtByUser.map((item) => [item._id, item.last_active_at]));

    res.json(
      users.map((user) => {
        const userId = String(user._id);
        const userPlans = plans.filter((plan) => plan.user_id === userId);
        return {
          id: userId,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          current_plan_id: user.current_plan_id,
          status: user.status,
          plans_count: userPlans.length,
          active_plans_count: userPlans.filter((plan) => plan.status === "active").length,
          last_active_at: activeMap.get(userId) ?? user.updated_at,
          created_at: user.created_at
        };
      })
    );
  })
);

adminRouter.get(
  "/admin/users/:id/plans",
  asyncHandler(async (req, res) => {
    const plans = await PlanModel.find({ user_id: req.params.id, deleted_at: null })
      .sort({ updated_at: -1 })
      .lean<LeanEntity<PlanDocument>[]>();
    const planIds = plans.map((plan) => String(plan._id));
    const [milestones, tasks] = await Promise.all([
      MilestoneModel.find({ plan_id: { $in: planIds }, deleted_at: null }).sort({ sort_order: 1 }).lean(),
      TaskModel.find({ plan_id: { $in: planIds }, deleted_at: null }).sort({ sort_order: 1 }).lean()
    ]);

    res.json(
      plans.map((plan) => {
        const planId = String(plan._id);
        const planMilestones = milestones.filter((milestone) => milestone.plan_id === planId);
        return {
          ...plan,
          id: planId,
          milestones: planMilestones.map((milestone) => ({
            ...milestone,
            id: String(milestone._id),
            tasks: tasks.filter((task) => task.milestone_id === String(milestone._id))
          }))
        };
      })
    );
  })
);

adminRouter.patch(
  "/admin/users/:id/status",
  asyncHandler(async (req, res) => {
    const status = req.body.status as "active" | "banned";
    if (!["active", "banned"].includes(status)) {
      res.status(400).json({ code: "INVALID_INPUT", message: "status must be active or banned" });
      return;
    }

    const user = await UserModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) {
      res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
      return;
    }

    res.json({
      id: String(user._id),
      nickname: user.nickname,
      status: user.status
    });
  })
);

adminRouter.get(
  "/admin/templates",
  asyncHandler(async (_req, res) => {
    const templates = await TemplatePlanModel.find({ deleted_at: null }).sort({ updated_at: -1 }).lean();
    res.json(templates);
  })
);

adminRouter.post(
  "/admin/templates",
  asyncHandler(async (req, res) => {
    if (!req.body.title) {
      res.status(400).json({ code: "INVALID_INPUT", message: "title is required" });
      return;
    }

    const template = await TemplatePlanModel.create(normalizeTemplatePayload(req.body));
    res.status(201).json(template);
  })
);

adminRouter.put(
  "/admin/templates/:id",
  asyncHandler(async (req, res) => {
    const template = await TemplatePlanModel.findOneAndUpdate(
      { _id: req.params.id, deleted_at: null },
      normalizeTemplatePayload(req.body),
      { new: true }
    );

    if (!template) {
      res.status(404).json({ code: "TEMPLATE_NOT_FOUND", message: "Template not found" });
      return;
    }

    res.json(template);
  })
);

adminRouter.delete(
  "/admin/templates/:id",
  asyncHandler(async (req, res) => {
    const template = await TemplatePlanModel.findOneAndUpdate(
      { _id: req.params.id, deleted_at: null },
      { deleted_at: new Date() },
      { new: true }
    );

    if (!template) {
      res.status(404).json({ code: "TEMPLATE_NOT_FOUND", message: "Template not found" });
      return;
    }

    res.json({ success: true });
  })
);

adminRouter.post(
  "/admin/templates/:id/copy-to-user",
  asyncHandler(async (req, res) => {
    const userId = String(req.body.user_id || "");
    if (!userId) {
      res.status(400).json({ code: "INVALID_INPUT", message: "user_id is required" });
      return;
    }

    const [user, template] = await Promise.all([
      UserModel.findById(userId),
      TemplatePlanModel.findOne({ _id: req.params.id, deleted_at: null }).lean<LeanEntity<TemplatePlanDocument> | null>()
    ]);

    if (!user) {
      res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
      return;
    }

    if (!template) {
      res.status(404).json({ code: "TEMPLATE_NOT_FOUND", message: "Template not found" });
      return;
    }

    const plan = await PlanModel.create({
      user_id: userId,
      title: template.title,
      goal: template.goal,
      cover_color: template.cover_color,
      tags: template.tags,
      progress: 0,
      status: "active"
    });

    for (const templateMilestone of template.milestones) {
      const milestone = await MilestoneModel.create({
        plan_id: String(plan._id),
        title: templateMilestone.title,
        description: templateMilestone.description,
        sort_order: templateMilestone.sort_order
      });

      if (templateMilestone.tasks.length > 0) {
        await TaskModel.insertMany(
          templateMilestone.tasks.map((task) => ({
            plan_id: String(plan._id),
            milestone_id: String(milestone._id),
            title: task.title,
            description: task.description,
            execution_platforms: task.execution_platforms,
            search_keywords: task.search_keywords,
            completion_criteria: task.completion_criteria,
            weight: task.weight,
            status: "todo",
            priority: task.priority,
            tags: task.tags,
            remark: task.remark,
            sort_order: task.sort_order,
            status_changed_at: null,
            completed_at: null
          }))
        );
      }
    }

    if (!user.current_plan_id) {
      user.current_plan_id = String(plan._id);
      await user.save();
    }

    res.status(201).json({
      id: String(plan._id),
      title: plan.title,
      user_id: plan.user_id
    });
  })
);

adminRouter.get(
  "/admin/stats",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [plansCount, averageProgress, activeUsersToday, activeUsersWeek, templatesCount, reviewsCount] =
      await Promise.all([
        PlanModel.countDocuments({ deleted_at: null }),
        PlanModel.aggregate<{ average_completion_rate: number }>([
          { $match: { deleted_at: null } },
          { $group: { _id: null, average_completion_rate: { $avg: "$progress" } } }
        ]),
        countActiveUsersSince(dayStart),
        countActiveUsersSince(weekStart),
        TemplatePlanModel.countDocuments({ deleted_at: null }),
        ReviewModel.countDocuments({ deleted_at: null })
      ]);

    res.json({
      dau: activeUsersToday,
      wau: activeUsersWeek,
      plans_count: plansCount,
      average_completion_rate: averageProgress[0]?.average_completion_rate ?? 0,
      templates_count: templatesCount,
      reviews_count: reviewsCount,
      retention: {
        d1: null,
        d7: null,
        note: "留存需要接入真实访问日志后计算"
      }
    });
  })
);

function normalizeTemplatePayload(payload: Record<string, unknown>) {
  return {
    title: String(payload.title || ""),
    goal: String(payload.goal || ""),
    cover_color: String(payload.cover_color || "green"),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    milestones: Array.isArray(payload.milestones) ? payload.milestones : []
  };
}

async function countActiveUsersSince(date: Date) {
  const items = await TaskModel.aggregate<{ _id: string }>([
    { $match: { updated_at: { $gte: date }, deleted_at: null } },
    { $lookup: { from: "plans", localField: "plan_id", foreignField: "_id", as: "plan" } },
    { $unwind: "$plan" },
    { $group: { _id: "$plan.user_id" } }
  ]);

  return items.length;
}
