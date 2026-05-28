import { TaskModel } from "../models/task.js";
import { PlanModel } from "../models/plan.js";
import { MilestoneModel } from "../models/milestone.js";
import { TomorrowTodoModel } from "../models/tomorrow-todo.js";
import { UserModel } from "../models/user.js";
import { getLocalDateKey } from "../utils/local-date.js";
import type { PlanDocument } from "../models/plan.js";
import type { MilestoneDocument } from "../models/milestone.js";
import type { TaskDocument } from "../models/task.js";
import type { TomorrowTodoDocument } from "../models/tomorrow-todo.js";
import type { UserDocument } from "../models/user.js";

type LeanEntity<T> = T & { _id: unknown };
type LeanUser = LeanEntity<UserDocument>;
type LeanPlan = LeanEntity<PlanDocument>;
type LeanMilestone = LeanEntity<MilestoneDocument>;
type LeanTask = LeanEntity<TaskDocument>;
type LeanTomorrowTodo = LeanEntity<TomorrowTodoDocument>;

export async function getHomePayload(userId: string) {
  const user = (await UserModel.findById(userId).lean()) as LeanUser | null;
  if (!user) {
    return {
      needs_plan_selection: false,
      current_plan: null,
      current_milestone: null,
      now_progressing: null,
      next_action: null,
      recommended_tasks: [],
      tomorrow_todos: [],
      recent_completed_tasks: []
    };
  }

  const activePlans = await PlanModel.find({
    user_id: userId,
    deleted_at: null,
    status: { $ne: "archived" }
  })
    .sort({ updated_at: -1 })
    .lean<LeanPlan[]>();

  let currentPlan = activePlans.find((plan) => String(plan._id) === user.current_plan_id) ?? null;

  if (!currentPlan && activePlans.length === 1) {
    currentPlan = activePlans[0] ?? null;
  }

  if (!currentPlan && activePlans.length > 1) {
    return {
      needs_plan_selection: true,
      current_plan: null,
      current_milestone: null,
      now_progressing: null,
      next_action: null,
      recommended_tasks: [],
      tomorrow_todos: [],
      recent_completed_tasks: []
    };
  }

  if (!currentPlan) {
    return {
      needs_plan_selection: false,
      current_plan: null,
      current_milestone: null,
      now_progressing: null,
      next_action: null,
      recommended_tasks: [],
      tomorrow_todos: [],
      recent_completed_tasks: []
    };
  }

  const milestones = await MilestoneModel.find({
    plan_id: String(currentPlan._id),
    deleted_at: null
  })
    .sort({ sort_order: 1 })
    .lean<LeanMilestone[]>();

  const tasks = await TaskModel.find({
    plan_id: String(currentPlan._id),
    deleted_at: null
  })
    .sort({ sort_order: 1, updated_at: -1 })
    .lean<LeanTask[]>();

  const currentMilestone =
    milestones.find((milestone) =>
      tasks.some((task) => task.milestone_id === String(milestone._id) && task.status !== "done")
    ) ?? null;

  const milestoneTasks = currentMilestone
    ? tasks.filter((task) => task.milestone_id === String(currentMilestone._id) && task.status !== "done")
    : [];

  const doingTasks = milestoneTasks
    .filter((task) => task.status === "doing")
    .sort((a, b) => getStatusChangedTime(a) - getStatusChangedTime(b));
  const nextAction =
    doingTasks[0] ??
    [...milestoneTasks].sort((a, b) => {
      const priorityRank = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityRank[a.priority as keyof typeof priorityRank] - priorityRank[b.priority as keyof typeof priorityRank];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })[0] ??
    null;

  const recommendedTasks = [...tasks]
    .filter((task) => task.status !== "done")
    .sort((a, b) => {
      const rank = (task: (typeof tasks)[number]) => {
        if (task.status === "doing") {
          return 0;
        }

        if (task.priority === "high") {
          return 1;
        }

        return 2;
      };

      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) {
        return rankDiff;
      }

      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .slice(0, 5);

  const completedTasks = await TaskModel.find({
    plan_id: String(currentPlan._id),
    deleted_at: null,
    status: "done"
  })
    .sort({ completed_at: -1 })
    .limit(5)
    .lean<LeanTask[]>();

  const today = getLocalDateKey();
  const tomorrowTodos = await TomorrowTodoModel.find({
    user_id: userId,
    target_date: today
  })
    .sort({ sort_order: 1, created_at: 1 })
    .lean<LeanTomorrowTodo[]>();

  const milestoneProgress = currentMilestone
    ? computeProgress(tasks.filter((task) => task.milestone_id === String(currentMilestone._id)))
    : 0;

  return {
    needs_plan_selection: false,
    current_plan: {
      id: String(currentPlan._id),
      title: currentPlan.title,
      goal: currentPlan.goal,
      cover_color: currentPlan.cover_color,
      progress: currentPlan.progress,
      status: currentPlan.status
    },
    current_milestone: currentMilestone
      ? {
          id: String(currentMilestone._id),
          title: currentMilestone.title,
          progress: milestoneProgress
        }
      : null,
    now_progressing: currentMilestone
      ? {
          plan_id: String(currentPlan._id),
          plan_title: currentPlan.title,
          milestone_id: String(currentMilestone._id),
          milestone_title: currentMilestone.title,
          plan_progress: currentPlan.progress,
          milestone_progress: milestoneProgress
        }
      : null,
    next_action: nextAction
      ? {
          id: String(nextAction._id),
          title: nextAction.title,
          description: nextAction.description,
          execution_platforms: nextAction.execution_platforms,
          search_keywords: nextAction.search_keywords,
          completion_criteria: nextAction.completion_criteria,
          status: nextAction.status,
          priority: nextAction.priority,
          weight: nextAction.weight
        }
      : null,
    recommended_tasks: recommendedTasks.map((task) => ({
      id: String(task._id),
      title: task.title,
      description: task.description,
      execution_platforms: task.execution_platforms,
      search_keywords: task.search_keywords,
      completion_criteria: task.completion_criteria,
      status: task.status,
      priority: task.priority,
      weight: task.weight
    })),
    tomorrow_todos: tomorrowTodos.map((item) => ({
      id: String(item._id),
      content: item.content,
      status: item.status,
      target_date: item.target_date,
      sort_order: item.sort_order
    })),
    recent_completed_tasks: completedTasks.map((task) => ({
      id: String(task._id),
      title: task.title,
      completed_at: task.completed_at
    }))
  };
}

function computeProgress(tasks: Pick<LeanTask, "status" | "weight">[]) {
  const total = tasks.reduce((sum, task) => sum + task.weight, 0);
  if (total === 0) {
    return 0;
  }

  const done = tasks.reduce((sum, task) => sum + (task.status === "done" ? task.weight : 0), 0);
  return done / total;
}

function getStatusChangedTime(task: Pick<LeanTask, "status_changed_at" | "updated_at" | "created_at">) {
  const value = task.status_changed_at ?? task.updated_at ?? task.created_at;
  return new Date(value).getTime();
}
