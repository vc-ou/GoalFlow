import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { PlanModel } from "../models/plan.js";
import { MilestoneModel } from "../models/milestone.js";
import { UserModel, type UserDocument } from "../models/user.js";
import { TaskModel } from "../models/task.js";
import type { PlanDocument } from "../models/plan.js";
import type { MilestoneDocument } from "../models/milestone.js";
import type { TaskDocument } from "../models/task.js";

type LeanEntity<T> = T & { _id: unknown };

export const plansRouter = Router();

plansRouter.use(requireAuth);

plansRouter.get(
  "/plans",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const plans = await PlanModel.find({ user_id: userId, deleted_at: null }).sort({ updated_at: -1 }).lean();
    res.json(plans);
  })
);

plansRouter.get(
  "/plans/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const planId = String(req.params.id);
    const plan = await PlanModel.findOne({ _id: planId, user_id: userId, deleted_at: null }).lean<
      LeanEntity<PlanDocument> | null
    >();

    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    const user = await UserModel.findById(userId).select("current_plan_id").lean<LeanEntity<UserDocument> | null>();

    const milestones = await MilestoneModel.find({
      plan_id: planId,
      deleted_at: null
    })
      .sort({ sort_order: 1 })
      .lean<LeanEntity<MilestoneDocument>[]>();

    const tasks = await TaskModel.find({
      plan_id: planId,
      deleted_at: null
    })
      .sort({ sort_order: 1, updated_at: -1 })
      .lean<LeanEntity<TaskDocument>[]>();

    res.json({
      ...plan,
      milestones: milestones.map((milestone) => ({
        ...milestone,
        id: String(milestone._id),
        tasks: tasks.filter((task) => task.milestone_id === String(milestone._id))
      })),
      is_current: user?.current_plan_id === String(plan._id),
      id: String(plan._id)
    });
  })
);

plansRouter.post(
  "/plans",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { title, goal = "", cover_color = "green", tags = [], milestones = [] } = req.body;

    if (!title) {
      res.status(400).json({ code: "INVALID_INPUT", message: "title is required" });
      return;
    }

    const plan = await PlanModel.create({
      user_id: userId,
      title,
      goal,
      cover_color,
      tags,
      progress: 0,
      status: "active"
    });

    if (Array.isArray(milestones) && milestones.length > 0) {
      await MilestoneModel.insertMany(
        milestones.map((milestone: { title: string; description?: string; sort_order?: number }) => ({
          plan_id: String(plan._id),
          title: milestone.title,
          description: milestone.description ?? "",
          sort_order: milestone.sort_order ?? 1
        }))
      );
    }

    const user = await UserModel.findById(userId);
    if (user && !user.current_plan_id) {
      user.current_plan_id = String(plan._id);
      await user.save();
    }

    res.status(201).json(plan);
  })
);

plansRouter.put(
  "/plans/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const plan = await PlanModel.findOneAndUpdate(
      { _id: req.params.id, user_id: userId, deleted_at: null },
      {
        title: req.body.title,
        goal: req.body.goal ?? "",
        cover_color: req.body.cover_color ?? "green",
        tags: req.body.tags ?? []
      },
      { new: true }
    );

    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    res.json(plan);
  })
);

plansRouter.patch(
  "/plans/:id/current",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const plan = await PlanModel.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null,
      status: { $ne: "archived" }
    });

    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    const currentPlanId = String(plan._id);
    await UserModel.findByIdAndUpdate(userId, { current_plan_id: currentPlanId });
    res.json({ success: true, current_plan_id: currentPlanId, plan_id: currentPlanId });
  })
);

plansRouter.post(
  "/plans/:id/current",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const plan = await PlanModel.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null,
      status: { $ne: "archived" }
    });

    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    const currentPlanId = String(plan._id);
    await UserModel.findByIdAndUpdate(userId, { current_plan_id: currentPlanId });
    res.json({ success: true, current_plan_id: currentPlanId, plan_id: currentPlanId });
  })
);

plansRouter.patch(
  "/plans/:id/status",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { status } = req.body as { status: "active" | "archived" | "completed" };
    const plan = await PlanModel.findOneAndUpdate(
      { _id: req.params.id, user_id: userId, deleted_at: null },
      { status },
      { new: true }
    );

    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    if (status === "archived") {
      await UserModel.findByIdAndUpdate(userId, { current_plan_id: null });
    }

    res.json(plan);
  })
);

plansRouter.delete(
  "/plans/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const planId = String(req.params.id);
    const plan = await PlanModel.findOneAndUpdate(
      { _id: planId, user_id: userId, deleted_at: null },
      { deleted_at: new Date() },
      { new: true }
    );

    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    await Promise.all([
      MilestoneModel.updateMany({ plan_id: planId, deleted_at: null }, { deleted_at: new Date() }),
      TaskModel.updateMany({ plan_id: planId, deleted_at: null }, { deleted_at: new Date() })
    ]);

    const user = await UserModel.findById(userId).lean<LeanEntity<UserDocument> | null>();
    if (String(plan._id) === user?.current_plan_id) {
      await UserModel.findByIdAndUpdate(userId, { current_plan_id: null });
    }

    res.json({ success: true });
  })
);
