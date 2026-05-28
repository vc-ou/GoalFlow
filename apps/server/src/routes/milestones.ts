import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { MilestoneModel } from "../models/milestone.js";
import { PlanModel } from "../models/plan.js";
import { TaskModel } from "../models/task.js";
import { ensureMilestoneOwnership, ensurePlanOwnership } from "../services/authz-service.js";
import { recalculatePlanProgress } from "../services/plan-service.js";

export const milestonesRouter = Router();

milestonesRouter.use(requireAuth);

milestonesRouter.post(
  "/milestones",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { plan_id, title, description = "", sort_order = 1 } = req.body as {
      plan_id?: string;
      title?: string;
      description?: string;
      sort_order?: number;
    };

    if (!plan_id || !title) {
      res.status(400).json({ code: "INVALID_INPUT", message: "plan_id and title are required" });
      return;
    }

    const plan = await ensurePlanOwnership(plan_id, userId);
    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    const milestone = await MilestoneModel.create({
      plan_id,
      title,
      description,
      sort_order
    });

    res.status(201).json(milestone);
  })
);

milestonesRouter.put(
  "/milestones/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const milestoneId = String(req.params.id);
    const milestone = await ensureMilestoneOwnership(milestoneId, await getUserPlanIds(userId));

    if (!milestone) {
      res.status(404).json({ code: "MILESTONE_NOT_FOUND", message: "Milestone not found" });
      return;
    }

    milestone.title = req.body.title ?? milestone.title;
    milestone.description = req.body.description ?? milestone.description;
    milestone.sort_order = req.body.sort_order ?? milestone.sort_order;
    await milestone.save();

    res.json(milestone);
  })
);

milestonesRouter.delete(
  "/milestones/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const milestoneId = String(req.params.id);
    const milestone = await ensureMilestoneOwnership(milestoneId, await getUserPlanIds(userId));

    if (!milestone) {
      res.status(404).json({ code: "MILESTONE_NOT_FOUND", message: "Milestone not found" });
      return;
    }

    milestone.deleted_at = new Date();
    await milestone.save();
    await TaskModel.updateMany({ milestone_id: String(milestone._id), deleted_at: null }, { deleted_at: new Date() });
    await recalculatePlanProgress(milestone.plan_id);

    res.json({ success: true });
  })
);

async function getUserPlanIds(userId: string) {
  const plans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean();

  return plans.map((plan) => String(plan._id));
}
