import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { TaskModel } from "../models/task.js";
import { PlanModel } from "../models/plan.js";
import { recalculatePlanProgress } from "../services/plan-service.js";
import { ensureMilestoneOwnership, ensurePlanOwnership, ensureTaskOwnership } from "../services/authz-service.js";
import type { TaskStatus } from "@goalflow/shared";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get(
  "/tasks",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { plan_id, milestone_id, status } = req.query;
    const userPlans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean();
    const userPlanIds = userPlans.map((plan) => String(plan._id));
    const filter: Record<string, unknown> = { deleted_at: null, plan_id: { $in: userPlanIds } };

    if (typeof plan_id === "string") filter.plan_id = plan_id;
    if (typeof milestone_id === "string") filter.milestone_id = milestone_id;
    if (typeof status === "string") filter.status = status;

    const tasks = await TaskModel.find(filter).sort({ sort_order: 1, updated_at: -1 }).lean();
    res.json(tasks);
  })
);

tasksRouter.get(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const taskId = String(req.params.id);
    const userPlans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean();
    const task = await ensureTaskOwnership(
      taskId,
      userPlans.map((plan) => String(plan._id))
    );

    if (!task) {
      res.status(404).json({ code: "TASK_NOT_FOUND", message: "Task not found" });
      return;
    }

    res.json(task.toObject());
  })
);

tasksRouter.post(
  "/tasks",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const plan = await ensurePlanOwnership(req.body.plan_id, userId);

    if (!plan) {
      res.status(404).json({ code: "PLAN_NOT_FOUND", message: "Plan not found" });
      return;
    }

    const milestone = await ensureMilestoneOwnership(req.body.milestone_id, [String(plan._id)]);
    if (!milestone) {
      res.status(404).json({ code: "MILESTONE_NOT_FOUND", message: "Milestone not found" });
      return;
    }

    const task = await TaskModel.create({
      ...req.body,
      execution_platforms: req.body.execution_platforms ?? [],
      search_keywords: req.body.search_keywords ?? [],
      completion_criteria: req.body.completion_criteria ?? "",
      tags: req.body.tags ?? [],
      remark: req.body.remark ?? ""
    });

    await recalculatePlanProgress(task.plan_id);
    res.status(201).json(task);
  })
);

tasksRouter.put(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const taskId = String(req.params.id);
    const userPlans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean();
    const task = await ensureTaskOwnership(
      taskId,
      userPlans.map((plan) => String(plan._id))
    );

    if (!task) {
      res.status(404).json({ code: "TASK_NOT_FOUND", message: "Task not found" });
      return;
    }

    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.execution_platforms = req.body.execution_platforms ?? task.execution_platforms;
    task.search_keywords = req.body.search_keywords ?? task.search_keywords;
    task.completion_criteria = req.body.completion_criteria ?? task.completion_criteria;
    task.weight = req.body.weight ?? task.weight;
    task.priority = req.body.priority ?? task.priority;
    task.tags = req.body.tags ?? task.tags;
    task.remark = req.body.remark ?? task.remark;
    task.sort_order = req.body.sort_order ?? task.sort_order;
    await task.save();

    await recalculatePlanProgress(task.plan_id);
    res.json(task);
  })
);

tasksRouter.patch(
  "/tasks/:id/status",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const taskId = String(req.params.id);
    const userPlans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean();
    const task = await ensureTaskOwnership(
      taskId,
      userPlans.map((plan) => String(plan._id))
    );

    if (!task) {
      res.status(404).json({ code: "TASK_NOT_FOUND", message: "Task not found" });
      return;
    }

    applyTaskStatus(task, req.body.status);
    await task.save();
    await recalculatePlanProgress(task.plan_id);

    res.json(task);
  })
);

tasksRouter.post(
  "/tasks/:id/status",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const taskId = String(req.params.id);
    const userPlans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean();
    const task = await ensureTaskOwnership(
      taskId,
      userPlans.map((plan) => String(plan._id))
    );

    if (!task) {
      res.status(404).json({ code: "TASK_NOT_FOUND", message: "Task not found" });
      return;
    }

    applyTaskStatus(task, req.body.status);
    await task.save();
    await recalculatePlanProgress(task.plan_id);

    res.json(task);
  })
);

tasksRouter.delete(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const taskId = String(req.params.id);
    const userPlans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean();
    const task = await ensureTaskOwnership(
      taskId,
      userPlans.map((plan) => String(plan._id))
    );

    if (!task) {
      res.status(404).json({ code: "TASK_NOT_FOUND", message: "Task not found" });
      return;
    }

    task.deleted_at = new Date();
    await task.save();
    await recalculatePlanProgress(task.plan_id);

    res.json({ success: true });
  })
);

function applyTaskStatus(task: Awaited<ReturnType<typeof ensureTaskOwnership>>, status: TaskStatus) {
  if (!task) return;

  const now = new Date();
  if (task.status !== status) {
    task.status_changed_at = now;
  }
  task.status = status;
  task.completed_at = status === "done" ? now : null;
}
