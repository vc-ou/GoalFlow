import { PlanModel } from "../models/plan.js";
import { TaskModel } from "../models/task.js";

export async function recalculatePlanProgress(planId: string) {
  const tasks = await TaskModel.find({
    plan_id: planId,
    deleted_at: null
  }).lean();

  const total = tasks.reduce((sum, task) => sum + task.weight, 0);
  const done = tasks.reduce((sum, task) => sum + (task.status === "done" ? task.weight : 0), 0);
  const progress = total === 0 ? 0 : done / total;

  await PlanModel.findByIdAndUpdate(planId, { progress });
}
