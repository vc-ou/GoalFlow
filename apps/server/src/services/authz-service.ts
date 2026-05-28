import { MilestoneModel } from "../models/milestone.js";
import { PlanModel } from "../models/plan.js";
import { TaskModel } from "../models/task.js";

export async function ensurePlanOwnership(planId: string, userId: string) {
  return PlanModel.findOne({
    _id: planId,
    user_id: userId,
    deleted_at: null
  });
}

export async function ensureMilestoneOwnership(milestoneId: string, userPlanIds: string[]) {
  return MilestoneModel.findOne({
    _id: milestoneId,
    plan_id: { $in: userPlanIds },
    deleted_at: null
  });
}

export async function ensureTaskOwnership(taskId: string, userPlanIds: string[]) {
  return TaskModel.findOne({
    _id: taskId,
    plan_id: { $in: userPlanIds },
    deleted_at: null
  });
}
